import 'package:flutter_test/flutter_test.dart';
import 'package:yoga_studio_app/models/membership_model.dart';

void main() {
  group('Membership & Credit Validity Tests', () {
    test('Active membership with remaining credits is valid', () {
      final validMembership = MembershipModel(
        membershipId: 'mem_valid',
        userId: 'usr_1',
        packageId: 'pkg_10',
        packageName: '10-Class Pack',
        startDate: DateTime.now().subtract(const Duration(days: 10)),
        expiryDate: DateTime.now().add(const Duration(days: 80)),
        totalCredits: 10,
        remainingCredits: 5,
        unlimited: false,
        status: 'active',
      );

      expect(validMembership.isValid, isTrue);
    });

    test('Expired membership is detected as invalid', () {
      final expiredMembership = MembershipModel(
        membershipId: 'mem_expired',
        userId: 'usr_1',
        packageId: 'pkg_10',
        packageName: '10-Class Pack',
        startDate: DateTime.now().subtract(const Duration(days: 100)),
        expiryDate: DateTime.now().subtract(const Duration(days: 10)),
        totalCredits: 10,
        remainingCredits: 5,
        unlimited: false,
        status: 'active',
      );

      expect(expiredMembership.isValid, isFalse);
    });

    test('Depleted credits without unlimited access is detected as invalid', () {
      final depletedMembership = MembershipModel(
        membershipId: 'mem_depleted',
        userId: 'usr_1',
        packageId: 'pkg_10',
        packageName: '10-Class Pack',
        startDate: DateTime.now().subtract(const Duration(days: 5)),
        expiryDate: DateTime.now().add(const Duration(days: 85)),
        totalCredits: 10,
        remainingCredits: 0,
        unlimited: false,
        status: 'active',
      );

      expect(depletedMembership.isValid, isFalse);
    });

    test('Unlimited membership is valid even with 0 tracked credits', () {
      final unlimitedMembership = MembershipModel(
        membershipId: 'mem_unlimited',
        userId: 'usr_1',
        packageId: 'pkg_unlimited',
        packageName: 'Monthly Unlimited',
        startDate: DateTime.now().subtract(const Duration(days: 5)),
        expiryDate: DateTime.now().add(const Duration(days: 25)),
        totalCredits: -1,
        remainingCredits: 0,
        unlimited: true,
        status: 'active',
      );

      expect(unlimitedMembership.isValid, isTrue);
    });
  });
}

