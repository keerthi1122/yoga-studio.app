import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/studio_settings_provider.dart';
import '../../services/jitsi_service.dart';
import '../../shared/widgets/primary_button.dart';

class LiveSessionScreen extends ConsumerStatefulWidget {
  const LiveSessionScreen({super.key});

  @override
  ConsumerState<LiveSessionScreen> createState() => _LiveSessionScreenState();
}

class _LiveSessionScreenState extends ConsumerState<LiveSessionScreen> {
  final JitsiService _jitsiService = JitsiService();

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final bookingsAsync = ref.watch(userBookingsStreamProvider);
    final settingsAsync = ref.watch(studioSettingsStreamProvider);
    final jitsiServer = settingsAsync.value?.jitsiDefaultServer ?? 'meet.jit.si';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Yoga Live Video Room'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E24),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.red.shade900,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.fiber_manual_record, color: Colors.white, size: 10),
                              SizedBox(width: 4),
                              Text('LIVE STREAMING', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Interactive Video Sanctuary',
                      style: TextStyle(
                        fontFamily: 'Playfair Display',
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Practice with live audio/video. Your microphone joins muted by default to preserve studio stillness.',
                      style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13, height: 1.4),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              Text(
                'Eligible Live Sessions',
                style: Theme.of(context).textTheme.headlineSmall,
              ),

              const SizedBox(height: 12),

              bookingsAsync.when(
                data: (bookings) {
                  final onlineBookings = bookings.where((b) => b.isOnline && b.isConfirmed).toList();

                  if (onlineBookings.isEmpty) {
                    return Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: AppTheme.pureWhite,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.borderSubtle),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.videocam_off_rounded, size: 40, color: AppTheme.mutedText),
                          const SizedBox(height: 12),
                          const Text('No online live sessions booked.', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          const SizedBox(height: 4),
                          const Text('Browse the daily schedule to book a live streaming class.', style: TextStyle(color: AppTheme.mutedText, fontSize: 13)),
                          const SizedBox(height: 16),
                          PrimaryButton(
                            text: 'Explore Schedule',
                            onPressed: () => context.go('/schedule'),
                          ),
                        ],
                      ),
                    );
                  }

                  return Column(
                    children: onlineBookings.map((b) {
                      final isOpen = b.canJoinLive;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppTheme.pureWhite,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isOpen ? Colors.red.shade400 : AppTheme.borderSubtle,
                            width: isOpen ? 1.5 : 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  b.classTitle,
                                  style: const TextStyle(fontFamily: 'Playfair Display', fontSize: 17, fontWeight: FontWeight.bold),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isOpen ? Colors.red.shade50 : AppTheme.softBackground,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    isOpen ? 'STREAM OPEN' : 'OPENS 15M PRIOR',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: isOpen ? Colors.red.shade700 : AppTheme.mutedText,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text('Teacher: ${b.instructorName}', style: const TextStyle(fontSize: 13, color: AppTheme.mutedText)),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                const Icon(Icons.access_time_rounded, size: 14, color: AppTheme.sageGreen),
                                const SizedBox(width: 6),
                                Text(
                                  DateFormat('EEE, d MMM • hh:mm a').format(b.classStartTime),
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            PrimaryButton(
                              text: isOpen ? 'Enter Jitsi Live Stream' : 'Live Room Locked',
                              backgroundColor: isOpen ? Colors.red.shade800 : Colors.grey.shade400,
                              icon: Icons.videocam_rounded,
                              onPressed: isOpen
                                  ? () {
                                      if (user != null) {
                                        _jitsiService.joinLiveYogaSession(
                                          context: context,
                                          booking: b,
                                          user: user,
                                          serverDomain: jitsiServer,
                                        );
                                      }
                                    }
                                  : null,
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Text('Error: $e'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

