import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/membership_model.dart';
import 'auth_provider.dart';
import 'classes_provider.dart';

final userMembershipsStreamProvider = StreamProvider<List<MembershipModel>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value([]);
  final firestoreService = ref.watch(firestoreServiceProvider);
  return firestoreService.streamUserMemberships(user.uid);
});

final activeMembershipProvider = Provider<MembershipModel?>((ref) {
  final membershipsAsync = ref.watch(userMembershipsStreamProvider);
  return membershipsAsync.when(
    data: (memberships) {
      final valid = memberships.where((m) => m.isValid).toList();
      return valid.isNotEmpty ? valid.first : null;
    },
    loading: () => null,
    error: (_, __) => null,
  );
});

