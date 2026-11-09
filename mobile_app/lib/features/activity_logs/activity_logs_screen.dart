import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/activity_log_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/classes_provider.dart';

class ActivityLogsScreen extends ConsumerWidget {
  const ActivityLogsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final firestoreService = ref.watch(firestoreServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Activity History'),
      ),
      body: SafeArea(
        child: user == null
            ? const Center(child: Text('Please log in.'))
            : StreamBuilder<List<ActivityLogModel>>(
                stream: firestoreService.streamUserActivities(user.uid),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final activities = snapshot.data ?? [];

                  if (activities.isEmpty) {
                    return const Center(child: Text('No activity records found.'));
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.all(20),
                    itemCount: activities.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 14),
                    itemBuilder: (context, index) {
                      final act = activities[index];
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.pureWhite,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.borderSubtle),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppTheme.cream,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.history_toggle_off_rounded, color: AppTheme.burgundy, size: 18),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    act.action.replaceAll('_', ' '),
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.darkText,
                                    ),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    act.description,
                                    style: const TextStyle(fontSize: 12, color: AppTheme.mutedText),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    DateFormat('d MMM yyyy • hh:mm a').format(act.timestamp),
                                    style: const TextStyle(fontSize: 11, color: AppTheme.sageGreen, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
      ),
    );
  }
}

