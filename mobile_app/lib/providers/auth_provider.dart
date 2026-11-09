import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? errorMessage;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.errorMessage,
  });

  bool get isAuthenticated => user != null;
  bool get isInstructor => user?.role == 'instructor';
  bool get isAdmin => user?.role == 'admin';

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    String? errorMessage,
    bool clearUser = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService, {UserModel? initialUser})
      : super(AuthState(user: initialUser, isLoading: initialUser == null)) {
    if (initialUser == null) {
      _initAuth();
    }
  }

  void _initAuth() {
    _authService.authStateChanges.listen((firebaseUser) async {
      if (firebaseUser == null) {
        state = const AuthState(user: null, isLoading: false);
      } else {
        try {
          final doc = await _authService.firestore.collection('users').doc(firebaseUser.uid).get();
          if (doc.exists && doc.data() != null) {
            final userModel = UserModel.fromMap(doc.data()!, firebaseUser.uid);
            if (userModel.status == 'suspended') {
              await _authService.signOut();
              state = const AuthState(user: null, isLoading: false, errorMessage: 'Account suspended');
            } else {
              state = AuthState(user: userModel, isLoading: false);
            }
          } else {
            final userModel = UserModel(
              uid: firebaseUser.uid,
              fullName: firebaseUser.displayName ?? 'Practitioner',
              email: firebaseUser.email ?? '',
              role: 'customer',
              status: 'active',
              remainingCredits: 0,
            );
            try {
              await _authService.firestore.collection('users').doc(firebaseUser.uid).set(userModel.toMap());
            } catch (_) {}
            state = AuthState(user: userModel, isLoading: false);
          }
        } catch (e) {
          state = AuthState(user: null, isLoading: false, errorMessage: e.toString());
        }
      }
    });
  }

  Future<void> signIn(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final user = await _authService.signInWithEmail(email: email, password: password);
      state = AuthState(user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString().replaceAll('Exception: ', ''));
      rethrow;
    }
  }

  Future<void> register(String fullName, String email, String password, String? phone) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final user = await _authService.registerCustomer(
        fullName: fullName,
        email: email,
        password: password,
        phone: phone,
      );
      state = AuthState(user: user, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString().replaceAll('Exception: ', ''));
      rethrow;
    }
  }

  Future<void> sendPasswordReset(String email) async {
    await _authService.sendPasswordResetEmail(email);
  }

  Future<void> signOut() async {
    await _authService.signOut();
    state = const AuthState(user: null, isLoading: false);
  }

  void updateCredits(int newCredits) {
    if (state.user != null) {
      final updatedUser = state.user!.copyWith(remainingCredits: newCredits);
      state = state.copyWith(user: updatedUser);
    }
  }

  void updateUserProfile(UserModel updatedUser) {
    state = state.copyWith(user: updatedUser);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});

// Selector provider for convenient access to current user model
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).user;
});
