import 'package:flutter_test/flutter_test.dart';
import 'package:yoga_studio_app/models/user_model.dart';
import 'package:yoga_studio_app/models/class_model.dart';
import 'package:yoga_studio_app/models/package_model.dart';
import 'package:yoga_studio_app/models/booking_model.dart';
import 'package:yoga_studio_app/models/membership_model.dart';
import 'package:yoga_studio_app/models/activity_log_model.dart';
import 'package:yoga_studio_app/models/studio_settings_model.dart';

void main() {
  group('Backend Models & Serialization Tests', () {
    test('StudioSettingsModel deserializes with defaults and maps correctly', () {
      const defaultSettings = StudioSettingsModel();
      expect(defaultSettings.studioName, 'Prana Sanctuary Yoga & Wellness');
      expect(defaultSettings.currency, 'USD');
      expect(defaultSettings.currencySymbol, '\$');
      expect(defaultSettings.cancellationPolicyHours, 12);
      expect(defaultSettings.jitsiDefaultServer, 'meet.jit.si');

      final customMap = {
        'studioName': 'Lotus Haven Yoga',
        'currency': 'HKD',
        'currencySymbol': 'HK\$',
        'cancellationPolicyHours': 8,
        'jitsiDefaultServer': 'video.lotushaven.com',
        'address': {
          'street': '88 Queen Road Central',
          'city': 'Hong Kong',
          'state': 'HK',
          'postalCode': '999077',
          'country': 'Hong Kong'
        }
      };

      final customSettings = StudioSettingsModel.fromMap(customMap);
      expect(customSettings.studioName, 'Lotus Haven Yoga');
      expect(customSettings.currency, 'HKD');
      expect(customSettings.cancellationPolicyHours, 8);
      expect(customSettings.jitsiDefaultServer, 'video.lotushaven.com');
      expect(customSettings.address.city, 'Hong Kong');
      expect(customSettings.address.fullAddress, contains('Queen Road Central'));

      final serialized = customSettings.toMap();
      expect(serialized['currency'], 'HKD');
      expect(serialized['cancellationPolicyHours'], 8);
    });

    test('ClassModel calculations and serialization', () {
      final now = DateTime.now();
      final classModel = ClassModel(
        classId: 'c_test_1',
        title: 'Vinyasa Flow Advanced',
        description: 'Vigorous flow',
        category: 'Vinyasa Yoga',
        instructorId: 'i_1',
        instructorName: 'Elena Vance',
        bookingType: 'online',
        startTime: now.add(const Duration(hours: 2)),
        endTime: now.add(const Duration(hours: 3)),
        durationMinutes: 60,
        capacity: 25,
        bookedSeats: 20,
        status: 'scheduled',
        jitsiRoom: 'yoga_studio_vinyasa_test_1',
      );

      expect(classModel.availableSeats, 5);
      expect(classModel.isFull, false);
      expect(classModel.isOnline, true);
      expect(classModel.isOffline, false);

      final map = classModel.toMap();
      expect(map['title'], 'Vinyasa Flow Advanced');
      expect(map['capacity'], 25);
      expect(map['bookedSeats'], 20);
      expect(map['meetingConfiguration']['jitsiRoom'], 'yoga_studio_vinyasa_test_1');

      final reconstructed = ClassModel.fromMap(map, 'c_test_1');
      expect(reconstructed.classId, 'c_test_1');
      expect(reconstructed.availableSeats, 5);
      expect(reconstructed.jitsiRoom, 'yoga_studio_vinyasa_test_1');
    });

    test('MembershipModel validity checks', () {
      final now = DateTime.now();

      // Valid active membership with credits
      final activeMember = MembershipModel(
        membershipId: 'm1',
        userId: 'u1',
        packageId: 'pkg1',
        packageName: '10-Class Pack',
        startDate: now.subtract(const Duration(days: 5)),
        expiryDate: now.add(const Duration(days: 25)),
        totalCredits: 10,
        remainingCredits: 4,
        unlimited: false,
        status: 'active',
      );
      expect(activeMember.isValid, true);

      // Expired date
      final expiredMember = MembershipModel(
        membershipId: 'm2',
        userId: 'u1',
        packageId: 'pkg1',
        packageName: '10-Class Pack',
        startDate: now.subtract(const Duration(days: 35)),
        expiryDate: now.subtract(const Duration(days: 5)),
        totalCredits: 10,
        remainingCredits: 4,
        unlimited: false,
        status: 'active',
      );
      expect(expiredMember.isValid, false);

      // Depleted credits on non-unlimited
      final depletedMember = MembershipModel(
        membershipId: 'm3',
        userId: 'u1',
        packageId: 'pkg1',
        packageName: '10-Class Pack',
        startDate: now.subtract(const Duration(days: 5)),
        expiryDate: now.add(const Duration(days: 25)),
        totalCredits: 10,
        remainingCredits: 0,
        unlimited: false,
        status: 'active',
      );
      expect(depletedMember.isValid, false);

      // Depleted credits on UNLIMITED pass is still valid!
      final unlimitedMember = MembershipModel(
        membershipId: 'm4',
        userId: 'u1',
        packageId: 'pkg_unlimited',
        packageName: 'Monthly Unlimited',
        startDate: now.subtract(const Duration(days: 5)),
        expiryDate: now.add(const Duration(days: 25)),
        totalCredits: -1,
        remainingCredits: 0,
        unlimited: true,
        status: 'active',
      );
      expect(unlimitedMember.isValid, true);
    });

    test('BookingModel serialization and state checks', () {
      final now = DateTime.now();
      final booking = BookingModel(
        bookingId: 'BK-9999',
        userId: 'u100',
        userFullName: 'Kavita Rao',
        userEmail: 'kavita@example.com',
        classId: 'c1',
        classTitle: 'Morning Gentle Vinyasa',
        instructorName: 'Elena Vance',
        classStartTime: now.add(const Duration(hours: 15)),
        classEndTime: now.add(const Duration(hours: 16)),
        bookingType: 'online',
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        jitsiRoom: 'yoga_studio_sunrise_vinyasa_c1',
      );

      expect(booking.isConfirmed, true);
      expect(booking.isCancelled, false);
      expect(booking.canJoinLive, false); // Not within 15 min window

      final map = booking.toMap();
      expect(map['bookingId'], 'BK-9999');
      expect(map['bookingStatus'], 'confirmed');
      expect(map['userFullName'], 'Kavita Rao');

      final reconstructed = BookingModel.fromMap(map, 'BK-9999');
      expect(reconstructed.classTitle, 'Morning Gentle Vinyasa');
      expect(reconstructed.instructorName, 'Elena Vance');
    });

    test('ActivityLogModel serialization', () {
      final now = DateTime.now();
      final log = ActivityLogModel(
        logId: 'act_101',
        userId: 'u100',
        actorRole: 'customer',
        action: 'BOOKING_CREATED',
        description: 'Booked Sunrise Vinyasa Flow (Online Stream)',
        timestamp: now,
      );

      final map = log.toMap();
      expect(map['action'], 'BOOKING_CREATED');
      expect(map['actorRole'], 'customer');

      final reconstructed = ActivityLogModel.fromMap(map, 'act_101');
      expect(reconstructed.description, contains('Sunrise Vinyasa Flow'));
    });
  });
}

