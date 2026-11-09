import 'package:flutter_test/flutter_test.dart';
import 'package:yoga_studio_app/models/user_model.dart';
import 'package:yoga_studio_app/providers/auth_provider.dart';
import 'package:yoga_studio_app/services/auth_service.dart';

void main() {
  group('Authentication & Role Validation Tests', () {
    late AuthService authService;

    setUp(() {
      authService = AuthService();
    });

    test('Registration rejects invalid email format', () async {
      expect(
        () => authService.registerCustomer(
          fullName: 'Test Yogi',
          email: 'not-an-email',
          password: 'password123',
        ),
        throwsA(isA<Exception>()),
      );
    });

    test('Registration rejects passwords shorter than 6 characters', () async {
      expect(
        () => authService.registerCustomer(
          fullName: 'Test Yogi',
          email: 'yogi@example.com',
          password: '123',
        ),
        throwsA(isA<Exception>()),
      );
    });

    test('Registration rejects empty full name', () async {
      expect(
        () => authService.registerCustomer(
          fullName: '   ',
          email: 'yogi@example.com',
          password: 'password123',
        ),
        throwsA(isA<Exception>()),
      );
    });

    test('Default registered user receives customer role', () async {
      final user = await authService.registerCustomer(
        fullName: 'Maya Lin',
        email: 'maya.lin@example.com',
        password: 'password123',
      );

      expect(user.role, equals('customer'));
      expect(user.status, equals('active'));
    });

    test('AuthState correctly exposes role predicates', () {
      const customerState = AuthState(
        user: UserModel(
          uid: 'u1',
          fullName: 'Customer User',
          email: 'customer@studio.com',
          role: 'customer',
        ),
      );

      expect(customerState.isAuthenticated, isTrue);
      expect(customerState.isInstructor, isFalse);
      expect(customerState.isAdmin, isFalse);

      const instructorState = AuthState(
        user: UserModel(
          uid: 'i1',
          fullName: 'Elena Vance',
          email: 'instructor@studio.com',
          role: 'instructor',
        ),
      );

      expect(instructorState.isAuthenticated, isTrue);
      expect(instructorState.isInstructor, isTrue);
      expect(instructorState.isAdmin, isFalse);

      const adminState = AuthState(
        user: UserModel(
          uid: 'a1',
          fullName: 'Studio Director',
          email: 'admin@studio.com',
          role: 'admin',
        ),
      );

      expect(adminState.isAuthenticated, isTrue);
      expect(adminState.isAdmin, isTrue);
      expect(adminState.isInstructor, isFalse);
    });

    test('Sign out clears user state and revokes authentication', () async {
      final notifier = AuthNotifier(
        authService,
        initialUser: const UserModel(
          uid: 'u1',
          fullName: 'Test Yogi',
          email: 'test@studio.com',
        ),
      );
      expect(notifier.state.isAuthenticated, isTrue);

      await notifier.signOut();
      expect(notifier.state.isAuthenticated, isFalse);
      expect(notifier.state.user, isNull);
    });
  });
}

