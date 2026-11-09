import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/class_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/memberships_provider.dart';
import '../../shared/widgets/primary_button.dart';

class OnlineBookingScreen extends ConsumerStatefulWidget {
  final ClassModel yogaClass;

  const OnlineBookingScreen({super.key, required this.yogaClass});

  @override
  ConsumerState<OnlineBookingScreen> createState() => _OnlineBookingScreenState();
}

class _OnlineBookingScreenState extends ConsumerState<OnlineBookingScreen> {
  bool _isLoading = false;
  String? _error;

  Future<void> _confirmBooking() async {
    final user = ref.read(currentUserProvider);
    if (user == null) {
      context.push('/login');
      return;
    }

    final activeMembership = ref.read(activeMembershipProvider);

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final bookingService = ref.read(bookingServiceProvider);
      final booking = await bookingService.createBooking(
        user: user,
        yogaClass: widget.yogaClass,
        activeMembership: activeMembership,
      );

      // Deduct local credit in provider if not unlimited and a credit was consumed
      if (booking.creditDeducted > 0 && user.remainingCredits > 0) {
        ref.read(authProvider.notifier).updateCredits(user.remainingCredits - booking.creditDeducted);
      }

      if (mounted) {
        _showSuccessDialog();
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: AppTheme.pureWhite,
        title: const Column(
          children: [
            Icon(Icons.check_circle_rounded, color: AppTheme.sageGreen, size: 54),
            SizedBox(height: 12),
            Text(
              'Reservation Confirmed',
              style: TextStyle(
                fontFamily: 'Playfair Display',
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        content: Text(
          'Your spot for ${widget.yogaClass.title} is secured. You will be able to join the live video stream 15 minutes prior to class.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13, color: AppTheme.mutedText),
        ),
        actions: [
          PrimaryButton(
            text: 'View My Bookings',
            onPressed: () {
              Navigator.pop(ctx);
              context.go('/bookings');
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final c = widget.yogaClass;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Online Session Reservation'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Delivery Mode Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF2FE),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFD3DCFC)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.videocam_rounded, size: 14, color: Color(0xFF3B5EDB)),
                    SizedBox(width: 6),
                    Text(
                      'INTERACTIVE LIVE STREAM',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: Color(0xFF3B5EDB),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              Text(
                c.title,
                style: Theme.of(context).textTheme.displayMedium,
              ),

              const SizedBox(height: 8),

              Text(
                c.description,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppTheme.mutedText,
                  height: 1.5,
                ),
              ),

              const SizedBox(height: 24),

              // Class Info Box
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppTheme.pureWhite,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Column(
                  children: [
                    _infoRow(Icons.person_outline, 'Lead Instructor', c.instructorName),
                    const Divider(height: 24, color: AppTheme.borderSubtle),
                    _infoRow(
                      Icons.calendar_today_rounded,
                      'Date & Time',
                      '${DateFormat('EEEE, d MMM').format(c.startTime)}\n${DateFormat('hh:mm a').format(c.startTime)} (${c.durationMinutes} mins)',
                    ),
                    const Divider(height: 24, color: AppTheme.borderSubtle),
                    _infoRow(
                      Icons.people_outline,
                      'Available Seats',
                      '${c.availableSeats} of ${c.capacity} spots remaining',
                    ),
                    const Divider(height: 24, color: AppTheme.borderSubtle),
                    _infoRow(
                      Icons.policy_outlined,
                      'Cancellation Policy',
                      'Free cancellation up to ${c.cancellationPolicyHours} hours before start.',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Membership Eligibility Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.cream,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.warmBeige),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Your Remaining Balance',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.mutedText),
                        ),
                        Text(
                          '${user?.remainingCredits ?? 0} Class Credits',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.darkText),
                        ),
                      ],
                    ),
                    const Text(
                      '1 Credit / Class',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.burgundy),
                    ),
                  ],
                ),
              ),

              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    _error!,
                    style: TextStyle(color: Colors.red.shade800, fontSize: 12),
                  ),
                ),
              ],

              const SizedBox(height: 28),

              PrimaryButton(
                text: 'Confirm Online Booking',
                isLoading: _isLoading,
                onPressed: _confirmBooking,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String title, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppTheme.burgundy),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.mutedText),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.darkText),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

