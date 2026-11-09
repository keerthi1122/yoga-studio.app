import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/primary_button.dart';
import '../../shared/widgets/custom_text_field.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  bool _emailNotifs = true;
  bool _pushNotifs = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(currentUserProvider);
    _nameController = TextEditingController(text: user?.fullName ?? '');
    _phoneController = TextEditingController(text: user?.phone ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _handleSave() async {
    setState(() => _isSaving = true);
    await Future.delayed(const Duration(milliseconds: 400));

    final user = ref.read(currentUserProvider);
    if (user != null) {
      final updated = user.copyWith(
        fullName: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
      );
      ref.read(authProvider.notifier).updateUserProfile(updated);
    }

    setState(() => _isSaving = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile details updated successfully!'),
          backgroundColor: AppTheme.sageGreen,
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Stack(
                  children: [
                    Container(
                      width: 84,
                      height: 84,
                      decoration: BoxDecoration(
                        color: AppTheme.cream,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppTheme.burgundy, width: 2),
                      ),
                      child: Center(
                        child: Text(
                          _nameController.text.isNotEmpty ? _nameController.text[0] : 'Y',
                          style: const TextStyle(
                            fontFamily: 'Playfair Display',
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.burgundy,
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: AppTheme.burgundy,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              CustomTextField(
                label: 'Full Legal Name',
                hint: 'Your Name',
                controller: _nameController,
                prefixIcon: Icons.person_outline,
              ),

              const SizedBox(height: 18),

              CustomTextField(
                label: 'Contact Phone',
                hint: '+1 (555) 012-3456',
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                prefixIcon: Icons.phone_outlined,
              ),

              const SizedBox(height: 28),

              const Text(
                'COMMUNICATION PREFERENCES',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: AppTheme.mutedText,
                ),
              ),
              const SizedBox(height: 12),

              Container(
                decoration: BoxDecoration(
                  color: AppTheme.pureWhite,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppTheme.borderSubtle),
                ),
                child: Column(
                  children: [
                    SwitchListTile(
                      activeColor: AppTheme.burgundy,
                      title: const Text('Push Reminders', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      subtitle: const Text('Notify 1 hour before scheduled yoga practice', style: TextStyle(fontSize: 11, color: AppTheme.mutedText)),
                      value: _pushNotifs,
                      onChanged: (val) => setState(() => _pushNotifs = val),
                    ),
                    const Divider(height: 1, indent: 16, endIndent: 16, color: AppTheme.borderSubtle),
                    SwitchListTile(
                      activeColor: AppTheme.burgundy,
                      title: const Text('Studio Announcements Email', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      subtitle: const Text('Receive weekend workshop & visiting master schedules', style: TextStyle(fontSize: 11, color: AppTheme.mutedText)),
                      value: _emailNotifs,
                      onChanged: (val) => setState(() => _emailNotifs = val),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 36),

              PrimaryButton(
                text: 'Save Changes',
                isLoading: _isSaving,
                onPressed: _handleSave,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
