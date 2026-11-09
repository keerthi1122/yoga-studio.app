import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  void _showPolicyDialog(BuildContext context, String title, String content) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: AppTheme.pureWhite,
        title: Text(
          title,
          style: const TextStyle(
            fontFamily: 'Playfair Display',
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        content: SingleChildScrollView(
          child: Text(
            content,
            style: const TextStyle(fontSize: 13, height: 1.5, color: AppTheme.mutedText),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Understood', style: TextStyle(color: AppTheme.burgundy, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Studio Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: AppTheme.burgundy),
            tooltip: 'Edit Profile',
            onPressed: () => context.push('/edit-profile'),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Avatar & Name Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppTheme.pureWhite,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: AppTheme.cream,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppTheme.burgundy, width: 2),
                      ),
                      child: Center(
                        child: Text(
                          (user?.fullName.isNotEmpty == true) ? user!.fullName[0] : 'Y',
                          style: const TextStyle(
                            fontFamily: 'Playfair Display',
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.burgundy,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      user?.fullName ?? 'Beloved Practitioner',
                      style: const TextStyle(
                        fontFamily: 'Playfair Display',
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.darkText,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.email ?? '',
                      style: const TextStyle(fontSize: 13, color: AppTheme.mutedText),
                    ),
                    if (user?.phone != null && user!.phone!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        user.phone!,
                        style: const TextStyle(fontSize: 12, color: AppTheme.mutedText),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: user?.role == 'instructor' ? AppTheme.sageGreen.withOpacity(0.15) : AppTheme.cream,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: user?.role == 'instructor' ? AppTheme.sageGreen : AppTheme.warmBeige,
                            ),
                          ),
                          child: Text(
                            (user?.role ?? 'customer').toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                              color: user?.role == 'instructor' ? AppTheme.sageGreen : AppTheme.burgundy,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.cream,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.warmBeige),
                      ),
                      child: Text(
                        '${user?.remainingCredits ?? 0} Class Credits Available',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.burgundy,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Menu Options
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.pureWhite,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Column(
                  children: [
                    _menuTile(
                      icon: Icons.person_outline,
                      title: 'Personal Information',
                      subtitle: 'Update full name and phone number',
                      onTap: () => context.push('/edit-profile'),
                    ),
                    const Divider(height: 1, indent: 56, color: AppTheme.borderSubtle),
                    _menuTile(
                      icon: Icons.history_rounded,
                      title: 'Activity & Attendance Log',
                      subtitle: 'Chronological timeline of bookings and pass activity',
                      onTap: () => context.push('/activity-logs'),
                    ),
                    const Divider(height: 1, indent: 56, color: AppTheme.borderSubtle),
                    _menuTile(
                      icon: Icons.card_membership_rounded,
                      title: 'Passes & Subscriptions',
                      subtitle: 'Manage active packs and renewal dates',
                      onTap: () => context.go('/memberships'),
                    ),
                    const Divider(height: 1, indent: 56, color: AppTheme.borderSubtle),
                    _menuTile(
                      icon: Icons.bookmark_border_rounded,
                      title: 'My Reservations',
                      subtitle: 'Upcoming and historical session records',
                      onTap: () => context.go('/bookings'),
                    ),
                    const Divider(height: 1, indent: 56, color: AppTheme.borderSubtle),
                    _menuTile(
                      icon: Icons.shield_outlined,
                      title: 'Studio Policies & Regulations',
                      subtitle: 'Cancellation rules, mat hygiene, and arrival times',
                      onTap: () => _showPolicyDialog(
                        context,
                        'Studio Regulations & Cancellation',
                        '1. Cancellation Policy: Free cancellation is permitted up to 12 hours before class start. Credit is returned immediately to your account.\n\n2. Studio Sanctuary Etiquette: Please remove shoes prior to entering the practice floor. Arrive 10 minutes early.\n\n3. Online Live Sessions: Microphones are kept muted during guided movement. Video cameras are recommended.',
                      ),
                    ),
                    const Divider(height: 1, indent: 56, color: AppTheme.borderSubtle),
                    _menuTile(
                      icon: Icons.lock_outline_rounded,
                      title: 'Privacy Policy',
                      subtitle: 'How we protect your account information',
                      onTap: () => _showPolicyDialog(
                        context,
                        'Privacy Policy',
                        'We value your confidentiality. Your email and practice attendance records are strictly protected. We never sell personal data or transmit sensitive payment information across unsecured channels.',
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Logout Button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red.shade700,
                    side: BorderSide(color: Colors.red.shade200),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  onPressed: () async {
                    await ref.read(authProvider.notifier).signOut();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  },
                  child: const Text('Sign Out of Account', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 14),
              TextButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      title: const Text('Delete Account?'),
                      content: const Text(
                        'This will permanently cancel remaining credits and remove your reservation history. Are you sure you wish to submit an account deletion request?',
                        style: TextStyle(fontSize: 13, color: AppTheme.mutedText),
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx),
                          child: const Text('Cancel'),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                          onPressed: () {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Account deletion request submitted for processing.')),
                            );
                          },
                          child: const Text('Confirm Deletion'),
                        ),
                      ],
                    ),
                  );
                },
                child: const Text('Request Account Deletion', style: TextStyle(fontSize: 12, color: AppTheme.mutedText)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _menuTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.cream,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: AppTheme.burgundy, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.darkText)),
      subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.mutedText)),
      trailing: const Icon(Icons.chevron_right, size: 20, color: AppTheme.mutedText),
      onTap: onTap,
    );
  }
}
