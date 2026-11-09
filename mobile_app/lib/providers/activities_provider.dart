import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/activity_log_model.dart';
import 'auth_provider.dart';
import 'classes_provider.dart';

final userActivitiesStreamProvider = StreamProvider<List<ActivityLogModel>>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) return Stream.value([]);
  final firestoreService = ref.watch(firestoreServiceProvider);
  return firestoreService.streamUserActivities(user.uid);
});

