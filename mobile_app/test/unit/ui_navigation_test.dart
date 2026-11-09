import 'package:flutter_test/flutter_test.dart';
import 'package:yoga_studio_app/models/user_model.dart';
import 'package:yoga_studio_app/models/package_model.dart';

void main() {
  group('UI State & Model Tests', () {
    test('UserModel copyWith correctly updates profile fields', () {
      const user = UserModel(
        uid: 'u_108',
        fullName: 'Maya Lin',
        email: 'maya@example.com',
        remainingCredits: 8,
      );

      final updated = user.copyWith(
        fullName: 'Maya Lin Vance',
        phone: '+1 555 4321',
        remainingCredits: 7,
      );

      expect(updated.fullName, equals('Maya Lin Vance'));
      expect(updated.phone, equals('+1 555 4321'));
      expect(updated.remainingCredits, equals(7));
      expect(updated.email, equals('maya@example.com'));
    });

    test('PackageModel serializes and deserializes accurately', () {
      const pkg = PackageModel(
        packageId: 'pkg_test',
        name: 'Workshop Weekend',
        description: 'Immersive sound bath and meditation',
        price: 150.0,
        currency: 'USD',
        credits: 4,
        validityDays: 14,
        unlimited: false,
        eligibleCategories: ['Meditation', 'Sound'],
        eligibleBookingTypes: ['offline'],
        startDateRules: 'immediate',
        active: true,
      );

      final map = pkg.toMap();
      final reconstructed = PackageModel.fromMap(map, 'pkg_test');

      expect(reconstructed.name, equals('Workshop Weekend'));
      expect(reconstructed.price, equals(150.0));
      expect(reconstructed.eligibleCategories, contains('Meditation'));
      expect(reconstructed.eligibleBookingTypes, contains('offline'));
    });
  });
}

