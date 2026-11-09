import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/booking_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/studio_settings_provider.dart';
import '../../services/jitsi_service.dart';

class MyBookingsScreen extends ConsumerStatefulWidget {
  const MyBookingsScreen({super.key});

  @override
  ConsumerState<MyBookingsScreen> createState() => _MyBookingsScreenState();
}

class _MyBookingsScreenState extends ConsumerState<MyBookingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final JitsiService _jitsiService = JitsiService();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _handleCancelBooking(BookingModel booking) async {
    final settingsAsync = ref.read(studioSettingsStreamProvider);
    final policyHours = settingsAsync.value?.cancellationPolicyHours ?? 12;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Reservation?'),
        content: Text(
          'If you cancel at least $policyHours hours prior to class, your credit will be restored to your account.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Keep Booking'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cancel Class'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final bookingService = ref.read(bookingServiceProvider);
      final refunded = await bookingService.cancelBooking(
        booking: booking,
        customCancellationHours: policyHours,
      );

      if (mounted) {
        final user = ref.read(currentUserProvider);
        if (refunded && user != null && booking.creditDeducted > 0) {
          ref.read(authProvider.notifier).updateCredits(user.remainingCredits + booking.creditDeducted);
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(refunded
                ? 'Booking cancelled. Credit restored to your account!'
                : 'Booking cancelled outside policy window. No credit refunded.'),
          ),
        );
      }
    }
  }

  void _handleJoinLive(BookingModel booking) {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    final settingsAsync = ref.read(studioSettingsStreamProvider);
    final jitsiServer = settingsAsync.value?.jitsiDefaultServer ?? 'meet.jit.si';
    _jitsiService.joinLiveYogaSession(
      context: context,
      booking: booking,
      user: user,
      serverDomain: jitsiServer,
    );
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(userBookingsStreamProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Class Bookings'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.burgundy,
          labelColor: AppTheme.burgundy,
          unselectedLabelColor: AppTheme.mutedText,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'Upcoming'),
            Tab(text: 'Completed'),
            Tab(text: 'Cancelled'),
          ],
        ),
      ),
      body: SafeArea(
        child: bookingsAsync.when(
          data: (bookings) {
            final upcoming = bookings.where((b) => b.isConfirmed && b.classEndTime.isAfter(DateTime.now())).toList();
            final completed = bookings.where((b) => b.bookingStatus == 'attended' || (b.isConfirmed && b.classEndTime.isBefore(DateTime.now()))).toList();
            final cancelled = bookings.where((b) => b.isCancelled).toList();

            return TabBarView(
              controller: _tabController,
              children: [
                _buildBookingList(upcoming, isUpcoming: true),
                _buildBookingList(completed, isUpcoming: false),
                _buildBookingList(cancelled, isUpcoming: false),
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
        ),
      ),
    );
  }

  Widget _buildBookingList(List<BookingModel> list, {required bool isUpcoming}) {
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_note_rounded, size: 48, color: AppTheme.mutedText.withOpacity(0.4)),
            const SizedBox(height: 12),
            const Text('No bookings found in this section.', style: TextStyle(color: AppTheme.mutedText, fontSize: 14)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(18),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (context, index) {
        final b = list[index];
        final isOnline = b.isOnline;

        return Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppTheme.pureWhite,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isOnline ? const Color(0xFFEFF2FE) : const Color(0xFFFEF3E8),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isOnline ? 'ONLINE CLASS' : 'STUDIO SANCTUARY',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isOnline ? const Color(0xFF3B5EDB) : const Color(0xFFB55D0F),
                      ),
                    ),
                  ),
                  Text(
                    b.bookingId,
                    style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: AppTheme.mutedText),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                b.classTitle,
                style: const TextStyle(fontFamily: 'Playfair Display', fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.darkText),
              ),
              const SizedBox(height: 4),
              Text(
                'Instructor: ${b.instructorName}',
                style: const TextStyle(fontSize: 13, color: AppTheme.mutedText),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.calendar_today_rounded, size: 14, color: AppTheme.burgundy),
                  const SizedBox(width: 6),
                  Text(
                    DateFormat('EEE, d MMM yyyy • hh:mm a').format(b.classStartTime),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.darkText),
                  ),
                ],
              ),
              if (isUpcoming) ...[
                const SizedBox(height: 16),
                const Divider(height: 1, color: AppTheme.borderSubtle),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: () => _handleCancelBooking(b),
                      child: const Text('Cancel Reservation', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                    if (isOnline)
                      ElevatedButton.icon(
                        icon: const Icon(Icons.videocam_rounded, size: 16),
                        label: const Text('Join Live Room'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: b.canJoinLive ? Colors.red.shade700 : AppTheme.burgundy,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => _handleJoinLive(b),
                      ),
                  ],
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

