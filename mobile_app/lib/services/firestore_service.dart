import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/class_model.dart';
import '../models/package_model.dart';
import '../models/booking_model.dart';
import '../models/membership_model.dart';
import '../models/activity_log_model.dart';
import '../models/studio_settings_model.dart';
import '../models/user_model.dart';

class FirestoreService {
  final FirebaseFirestore _firestore;

  FirestoreService({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  // Stream global studio settings
  Stream<StudioSettingsModel> streamStudioSettings() {
    try {
      return _firestore
          .collection('studioSettings')
          .doc('default')
          .snapshots()
          .map((snapshot) {
        if (!snapshot.exists || snapshot.data() == null) {
          return const StudioSettingsModel();
        }
        return StudioSettingsModel.fromMap(snapshot.data());
      });
    } catch (_) {
      return Stream.value(const StudioSettingsModel());
    }
  }

  // Stream active classes
  Stream<List<ClassModel>> streamClasses() {
    return _firestore
        .collection('classes')
        .where('status', isNotEqualTo: 'cancelled')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => ClassModel.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

  // Stream packages
  Stream<List<PackageModel>> streamPackages() {
    return _firestore
        .collection('packages')
        .where('active', isEqualTo: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => PackageModel.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

  // Stream user's bookings
  Stream<List<BookingModel>> streamUserBookings(String userId) {
    return _firestore
        .collection('bookings')
        .where('userId', isEqualTo: userId)
        .orderBy('classStartTime', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => BookingModel.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

  // Stream user's memberships
  Stream<List<MembershipModel>> streamUserMemberships(String userId) {
    return _firestore
        .collection('memberships')
        .where('userId', isEqualTo: userId)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => MembershipModel.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

  // Stream user activities
  Stream<List<ActivityLogModel>> streamUserActivities(String userId) {
    return _firestore
        .collection('activityLogs')
        .where('userId', isEqualTo: userId)
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => ActivityLogModel.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

  // Atomic class reservation transaction
  Future<String> bookClassTransaction({
    required String userId,
    required UserModel user,
    required ClassModel yogaClass,
    required String paymentMethod, // 'membership_credit', 'card', 'bank_transfer'
    String? transactionId,
  }) async {
    final bookingRef = _firestore.collection('bookings').doc();
    final classRef = _firestore.collection('classes').doc(yogaClass.classId);
    final userRef = _firestore.collection('users').doc(userId);
    final logRef = _firestore.collection('activityLogs').doc();

    await _firestore.runTransaction((transaction) async {
      final classSnapshot = await transaction.get(classRef);
      if (!classSnapshot.exists) {
        throw Exception('Selected yoga session no longer exists.');
      }

      final classData = classSnapshot.data()!;
      final int currentBooked = (classData['bookedSeats'] as num?)?.toInt() ?? 0;
      final int maxCapacity = (classData['capacity'] as num?)?.toInt() ?? 0;

      if (currentBooked >= maxCapacity) {
        throw Exception('This class is now fully booked. Please select another time.');
      }

      final userSnapshot = await transaction.get(userRef);
      int userCredits = 0;
      if (userSnapshot.exists) {
        userCredits = (userSnapshot.data()?['remainingCredits'] as num?)?.toInt() ?? user.remainingCredits;
      } else {
        userCredits = user.remainingCredits;
      }

      bool usedCredit = false;
      if (paymentMethod == 'membership_credit') {
        if (userCredits <= 0) {
          throw Exception('Insufficient class credits. Please purchase a session package.');
        }
        transaction.update(userRef, {
          'remainingCredits': userCredits - 1,
          'updatedAt': FieldValue.serverTimestamp(),
        });
        usedCredit = true;
      }

      // Increment booked seats
      transaction.update(classRef, {
        'bookedSeats': currentBooked + 1,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      // Write booking ledger
      transaction.set(bookingRef, {
        'bookingId': bookingRef.id,
        'userId': userId,
        'userFullName': user.fullName,
        'userEmail': user.email,
        'classId': yogaClass.classId,
        'classTitle': yogaClass.title,
        'instructorName': yogaClass.instructorName,
        'classStartTime': Timestamp.fromDate(yogaClass.startTime),
        'classEndTime': Timestamp.fromDate(yogaClass.endTime),
        'bookingType': yogaClass.bookingType,
        'bookingStatus': 'confirmed',
        'paymentStatus': 'paid',
        'paymentMethod': paymentMethod,
        'usedCredit': usedCredit,
        'jitsiRoom': yogaClass.jitsiRoom,
        'studioRoom': yogaClass.studioRoom,
        'studioAddress': yogaClass.studioAddress,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // Write activity log
      transaction.set(logRef, {
        'logId': logRef.id,
        'userId': userId,
        'actorRole': 'customer',
        'action': 'BOOKING_CREATED',
        'description': 'Reserved ${yogaClass.title} (${yogaClass.bookingType.toUpperCase()})',
        'timestamp': FieldValue.serverTimestamp(),
      });
    });

    return bookingRef.id;
  }

  // Atomic cancellation transaction with policy enforcement
  Future<bool> cancelBookingTransaction({
    required String bookingId,
    required String userId,
    required String classId,
    int cancellationPolicyHours = 12,
  }) async {
    final bookingRef = _firestore.collection('bookings').doc(bookingId);
    final classRef = _firestore.collection('classes').doc(classId);
    final userRef = _firestore.collection('users').doc(userId);
    final logRef = _firestore.collection('activityLogs').doc();

    bool refunded = false;

    await _firestore.runTransaction((transaction) async {
      final bookingSnapshot = await transaction.get(bookingRef);
      if (!bookingSnapshot.exists) {
        throw Exception('Booking record not found.');
      }

      final bookingData = bookingSnapshot.data()!;
      if (bookingData['bookingStatus'] == 'cancelled') {
        throw Exception('This booking has already been cancelled.');
      }

      final startTimeTimestamp = bookingData['classStartTime'] as Timestamp?;
      final DateTime startTime = startTimeTimestamp?.toDate() ?? DateTime.now();
      final now = DateTime.now();
      final hoursUntilClass = startTime.difference(now).inHours;

      final bool eligibleForRefund = hoursUntilClass >= cancellationPolicyHours;
      final bool usedCredit = bookingData['usedCredit'] == true;

      // Mark booking cancelled
      transaction.update(bookingRef, {
        'bookingStatus': 'cancelled',
        'refundEligible': eligibleForRefund,
        'cancelledAt': FieldValue.serverTimestamp(),
      });

      // Decrement booked seats on class
      final classSnapshot = await transaction.get(classRef);
      if (classSnapshot.exists) {
        final currentBooked = (classSnapshot.data()?['bookedSeats'] as num?)?.toInt() ?? 1;
        transaction.update(classRef, {
          'bookedSeats': currentBooked > 0 ? currentBooked - 1 : 0,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }

      // Refund credit if within cancellation threshold
      if (eligibleForRefund && usedCredit) {
        final userSnapshot = await transaction.get(userRef);
        if (userSnapshot.exists) {
          final currentCredits = (userSnapshot.data()?['remainingCredits'] as num?)?.toInt() ?? 0;
          transaction.update(userRef, {
            'remainingCredits': currentCredits + 1,
            'updatedAt': FieldValue.serverTimestamp(),
          });
          refunded = true;
        }
      }

      // Log activity
      transaction.set(logRef, {
        'logId': logRef.id,
        'userId': userId,
        'actorRole': 'customer',
        'action': 'BOOKING_CANCELLED',
        'description': 'Cancelled reservation ${bookingData['classTitle'] ?? ''} (${eligibleForRefund ? "Credit refunded" : "Late cancellation - no credit refund"})',
        'timestamp': FieldValue.serverTimestamp(),
      });
    });

    return refunded;
  }

  // Purchase package transaction
  Future<String> purchasePackageTransaction({
    required String userId,
    required UserModel user,
    required PackageModel package,
    required String paymentMethod,
    String? proofUrl,
    String? notes,
  }) async {
    final paymentRef = _firestore.collection('payments').doc();
    final membershipRef = _firestore.collection('memberships').doc();
    final userRef = _firestore.collection('users').doc(userId);
    final logRef = _firestore.collection('activityLogs').doc();

    final isInstant = paymentMethod != 'bank_transfer';
    final now = DateTime.now();
    final expiryDate = now.add(Duration(days: package.validityDays));

    await _firestore.runTransaction((transaction) async {
      // Create payment document
      transaction.set(paymentRef, {
        'paymentId': paymentRef.id,
        'userId': userId,
        'customerName': user.fullName,
        'customerEmail': user.email,
        'packageId': package.packageId,
        'packageName': package.name,
        'amount': package.price,
        'currency': package.currency,
        'method': paymentMethod,
        'status': isInstant ? 'completed' : 'pending_verification',
        'proofUrl': proofUrl,
        'notes': notes,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // If instant payment (credit card, simulated gateway)
      if (isInstant) {
        transaction.set(membershipRef, {
          'membershipId': membershipRef.id,
          'userId': userId,
          'packageId': package.packageId,
          'packageName': package.name,
          'startDate': Timestamp.fromDate(now),
          'expiryDate': Timestamp.fromDate(expiryDate),
          'totalCredits': package.credits,
          'remainingCredits': package.credits,
          'unlimited': package.unlimited,
          'status': 'active',
          'createdAt': FieldValue.serverTimestamp(),
        });

        final userSnapshot = await transaction.get(userRef);
        final currentCredits = (userSnapshot.data()?['remainingCredits'] as num?)?.toInt() ?? user.remainingCredits;
        final newCredits = package.unlimited ? currentCredits : currentCredits + (package.credits > 0 ? package.credits : 0);

        transaction.update(userRef, {
          'activeMembershipId': membershipRef.id,
          'remainingCredits': newCredits,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }

      // Log activity
      transaction.set(logRef, {
        'logId': logRef.id,
        'userId': userId,
        'actorRole': 'customer',
        'action': isInstant ? 'PACKAGE_PURCHASED' : 'BANK_TRANSFER_SUBMITTED',
        'description': isInstant
            ? 'Purchased ${package.name} for \$${package.price}'
            : 'Submitted bank transfer receipt for ${package.name} (\$${package.price})',
        'timestamp': FieldValue.serverTimestamp(),
      });
    });

    return isInstant ? membershipRef.id : paymentRef.id;
  }
}
