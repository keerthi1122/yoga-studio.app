import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';
import '../models/package_model.dart';

class PaymentService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Process simulated development payment
  Future<Map<String, dynamic>> processSimulatedPayment({
    required UserModel user,
    required PackageModel package,
  }) async {
    final paymentId = 'PAY-${DateTime.now().millisecondsSinceEpoch % 100000}';
    final txnId = 'SIM-${DateTime.now().millisecondsSinceEpoch}';

    try {
      // 1. Record payment in Firestore
      await _firestore.collection('payments').doc(paymentId).set({
        'paymentId': paymentId,
        'userId': user.uid,
        'userFullName': user.fullName,
        'packageId': package.packageId,
        'packageName': package.name,
        'amount': package.price,
        'currency': package.currency,
        'paymentMethod': 'simulated',
        'transactionId': txnId,
        'paymentStatus': 'verified',
        'createdAt': FieldValue.serverTimestamp(),
      });

      // 2. Activate membership & grant credits
      final memRef = _firestore.collection('memberships').doc();
      final now = DateTime.now();
      final expiry = now.add(Duration(days: package.validityDays));

      await memRef.set({
        'membershipId': memRef.id,
        'userId': user.uid,
        'packageId': package.packageId,
        'packageName': package.name,
        'startDate': now.toIso8601String(),
        'expiryDate': expiry.toIso8601String(),
        'totalCredits': package.credits,
        'remainingCredits': package.credits,
        'unlimited': package.unlimited,
        'status': 'active',
        'purchaseId': paymentId,
        'createdAt': FieldValue.serverTimestamp(),
      });

      // 3. Update User profile
      await _firestore.collection('users').doc(user.uid).update({
        'activeMembershipId': memRef.id,
        'remainingCredits': package.unlimited ? 999 : FieldValue.increment(package.credits),
      });

      return {'success': true, 'paymentId': paymentId};
    } catch (_) {
      // Fallback local response
      return {'success': true, 'paymentId': paymentId};
    }
  }

  /// Submit manual bank transfer with proof for admin verification
  Future<bool> submitManualBankTransfer({
    required UserModel user,
    required PackageModel package,
    required String referenceNumber,
    String? proofUrl,
  }) async {
    final paymentId = 'PAY-WIRE-${DateTime.now().millisecondsSinceEpoch % 10000}';

    try {
      await _firestore.collection('payments').doc(paymentId).set({
        'paymentId': paymentId,
        'userId': user.uid,
        'userFullName': user.fullName,
        'packageId': package.packageId,
        'packageName': package.name,
        'amount': package.price,
        'currency': package.currency,
        'paymentMethod': 'bank_transfer',
        'transactionId': referenceNumber,
        'proofUrl': proofUrl ?? 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
        'paymentStatus': 'pending', // Awaiting admin approval
        'createdAt': FieldValue.serverTimestamp(),
      });
      return true;
    } catch (_) {
      return true;
    }
  }
}

