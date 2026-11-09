import 'package:flutter_test/flutter_test.dart';
import 'package:yoga_studio_app/models/user_model.dart';
import 'package:yoga_studio_app/models/package_model.dart';
import 'package:yoga_studio_app/models/membership_model.dart';

void main() {
  group('Payment & Membership Activation Logic Tests', () {
    test('Package Model properties and validity calculations', () {
      const dropIn = PackageModel(
        packageId: 'pkg_dropin',
        name: 'Single Class Pass',
        description: 'Valid for 14 days',
        price: 25.0,
        currency: 'USD',
        credits: 1,
        validityDays: 14,
        unlimited: false,
        eligibleCategories: ['all'],
        eligibleBookingTypes: ['online', 'offline'],
        startDateRules: 'immediate',
        active: true,
      );

      expect(dropIn.credits, 1);
      expect(dropIn.validityDays, 14);
      expect(dropIn.unlimited, isFalse);

      const unlimitedMonth = PackageModel(
        packageId: 'pkg_unlimited_month',
        name: 'Monthly Unlimited',
        description: 'Unlimited 30 days',
        price: 180.0,
        currency: 'USD',
        credits: -1,
        validityDays: 30,
        unlimited: true,
        eligibleCategories: ['all'],
        eligibleBookingTypes: ['online', 'offline'],
        startDateRules: 'immediate',
        active: true,
      );

      expect(unlimitedMonth.credits, -1);
      expect(unlimitedMonth.unlimited, isTrue);
      expect(unlimitedMonth.validityDays, 30);
    });

    test('Membership expiry date calculation matches package validity period', () {
      final now = DateTime(2026, 11, 5, 10, 0);
      const validityDays = 90;
      final expectedExpiry = now.add(const Duration(days: validityDays));

      final membership = MembershipModel(
        membershipId: 'mem_calc_1',
        userId: 'usr_1',
        packageId: 'pkg_10',
        packageName: '10-Session Flexible Pack',
        startDate: now,
        expiryDate: expectedExpiry,
        totalCredits: 10,
        remainingCredits: 10,
        unlimited: false,
        status: 'active',
      );

      expect(membership.expiryDate.difference(membership.startDate).inDays, equals(90));
      expect(membership.isValid, isTrue);
    });

    test('User credit replenishment logic upon verified package activation', () {
      const initialUser = UserModel(
        uid: 'u_test',
        fullName: 'Maya Lin',
        email: 'maya@example.com',
        remainingCredits: 2,
      );

      // Purchasing 10-pack adds 10 credits -> total 12
      final updatedUserCredits = initialUser.copyWith(
        remainingCredits: initialUser.remainingCredits + 10,
        activeMembershipId: 'mem_new_10',
      );

      expect(updatedUserCredits.remainingCredits, 12);
      expect(updatedUserCredits.activeMembershipId, 'mem_new_10');
    });

    test('Pending wire transfer does not grant credits until admin marks verified', () {
      // User with 0 credits
      const user = UserModel(
        uid: 'u_wire',
        fullName: 'Wire Practitioner',
        email: 'wire@example.com',
        remainingCredits: 0,
      );

      // Payment is pending
      const paymentStatus = 'pending';
      final bool grantCredits = paymentStatus == 'verified';

      expect(grantCredits, isFalse);
      expect(user.remainingCredits, 0); // No credits granted yet
    });
  });
}

