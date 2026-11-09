import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/classes_provider.dart';
import '../../providers/bookings_provider.dart';
import '../../providers/memberships_provider.dart';
import '../../providers/studio_settings_provider.dart';
import '../../shared/widgets/class_card.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final classesAsync = ref.watch(classesStreamProvider);
    final bookingsAsync = ref.watch(userBookingsStreamProvider);
    final activeMembership = ref.watch(activeMembershipProvider);
    final settingsAsync = ref.watch(studioSettingsStreamProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.burgundy,
          onRefresh: () async {
            ref.invalidate(classesStreamProvider);
            ref.invalidate(userBookingsStreamProvider);
            ref.invalidate(userMembershipsStreamProvider);
            ref.invalidate(studioSettingsStreamProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header: Greeting & Profile Avatar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Namaste,',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.sageGreen.withOpacity(0.9),
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          user?.fullName ?? 'Beloved Yogi',
                          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                                fontSize: 22,
                                height: 1.2,
                              ),
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: () => context.go('/profile'),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppTheme.cream,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.warmBeige, width: 1.5),
                        ),
                        child: Center(
                          child: Text(
                            (user?.fullName.isNotEmpty == true) ? user!.fullName[0] : 'Y',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.burgundy,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Studio Announcements Banner
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFBF4E8),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppTheme.warmBeige),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.burgundy.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.campaign_outlined, color: AppTheme.burgundy, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: settingsAsync.when(
                          data: (settings) => Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                settings.studioName,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.darkText),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                settings.tagline,
                                style: const TextStyle(fontSize: 11, color: AppTheme.mutedText),
                              ),
                            ],
                          ),
                          loading: () => const Text(
                            'Welcome to your sanctuary',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.darkText),
                          ),
                          error: (_, __) => const Text(
                            'Mindful breathing and holistic movement',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.darkText),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                // Membership & Credits Pass Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.burgundy,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.burgundy.withOpacity(0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.pureWhite.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.auto_awesome, size: 12, color: AppTheme.warmBeige),
                                const SizedBox(width: 4),
                                Text(
                                  activeMembership != null ? 'ACTIVE PASS' : 'MEMBERSHIP PASS',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.8,
                                    color: AppTheme.warmBeige,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          GestureDetector(
                            onTap: () => context.go('/memberships'),
                            child: Text(
                              activeMembership != null ? 'Manage / Renew' : 'Explore Passes',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.warmBeige,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        '${user?.remainingCredits ?? 0} Class Credits',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.pureWhite,
                          fontFamily: 'Playfair Display',
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        activeMembership != null
                            ? '${activeMembership.packageName} • Valid until ${DateFormat('d MMM yyyy').format(activeMembership.expiryDate)}'
                            : 'No active pass • Tap to explore packages',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.pureWhite.withOpacity(0.8),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Next Upcoming Session Card
                bookingsAsync.when(
                  data: (bookings) {
                    final upcoming = bookings.where((b) => b.isConfirmed && b.classEndTime.isAfter(DateTime.now())).toList();
                    if (upcoming.isEmpty) return const SizedBox.shrink();
                    final next = upcoming.first;

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'YOUR NEXT PRACTICE',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.0,
                            color: AppTheme.mutedText,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.pureWhite,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.borderSubtle),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: next.isOnline ? const Color(0xFFEFF2FE) : const Color(0xFFFEF3E8),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  next.isOnline ? Icons.videocam_rounded : Icons.location_on_rounded,
                                  color: next.isOnline ? const Color(0xFF3B5EDB) : const Color(0xFFB55D0F),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      next.classTitle,
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.darkText,
                                      ),
                                    ),
                                    Text(
                                      '${DateFormat('EEE, d MMM').format(next.classStartTime)} • ${DateFormat('hh:mm a').format(next.classStartTime)}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.mutedText,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (next.canJoinLive)
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red.shade700,
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  onPressed: () => context.go('/yoga-live'),
                                  child: const Text('Join Live', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    );
                  },
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),

                // Online vs Offline Action Shortcuts
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => context.go('/schedule'),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.pureWhite,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.borderSubtle),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.videocam_rounded, color: Color(0xFF3B5EDB), size: 24),
                              SizedBox(height: 10),
                              Text(
                                'Live Streams',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.darkText,
                                ),
                              ),
                              Text(
                                'Join remote classes',
                                style: TextStyle(fontSize: 11, color: AppTheme.mutedText),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => context.go('/schedule'),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.pureWhite,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.borderSubtle),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.spa_rounded, color: AppTheme.burgundy, size: 24),
                              SizedBox(height: 10),
                              Text(
                                'Studio Sessions',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.darkText,
                                ),
                              ),
                              Text(
                                'In-person sanctuaries',
                                style: TextStyle(fontSize: 11, color: AppTheme.mutedText),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 28),

                // Today's Yoga Classes Section Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Today's Yoga Offerings",
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    GestureDetector(
                      onTap: () => context.go('/schedule'),
                      child: const Text(
                        'Full Calendar →',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.burgundy,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // Classes List
                classesAsync.when(
                  data: (classes) {
                    final todayClasses = classes.take(3).toList();
                    if (todayClasses.isEmpty) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                        decoration: BoxDecoration(
                          color: AppTheme.pureWhite,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.borderSubtle),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.event_available_outlined, size: 36, color: AppTheme.mutedText),
                            const SizedBox(height: 8),
                            const Text(
                              'No classes scheduled for today',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.darkText),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Check the full calendar for upcoming sessions.',
                              style: TextStyle(fontSize: 12, color: AppTheme.mutedText),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 12),
                            OutlinedButton(
                              onPressed: () => context.go('/schedule'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.burgundy,
                                side: const BorderSide(color: AppTheme.burgundy),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Text('View Full Calendar', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      );
                    }
                    return Column(
                      children: todayClasses.map((c) {
                        return ClassCard(
                          yogaClass: c,
                          onBookTap: () {
                            if (c.isOnline) {
                              context.push('/online-booking', extra: c);
                            } else {
                              context.push('/offline-booking', extra: c);
                            }
                          },
                        );
                      }).toList(),
                    );
                  },
                  loading: () => const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24.0),
                      child: CircularProgressIndicator(),
                    ),
                  ),
                  error: (e, _) => Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.pureWhite,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.borderSubtle),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.amber, size: 32),
                        const SizedBox(height: 8),
                        Text(
                          'Unable to load classes: $e',
                          style: const TextStyle(fontSize: 12, color: AppTheme.mutedText),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () => ref.invalidate(classesStreamProvider),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
