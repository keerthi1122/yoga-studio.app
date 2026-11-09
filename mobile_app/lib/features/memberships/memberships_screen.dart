import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../models/package_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/classes_provider.dart';
import '../../providers/studio_settings_provider.dart';
import '../../services/payment_service.dart';
import '../../shared/widgets/primary_button.dart';
import '../../utils/currency_formatter.dart';

class MembershipsScreen extends ConsumerStatefulWidget {
  const MembershipsScreen({super.key});

  @override
  ConsumerState<MembershipsScreen> createState() => _MembershipsScreenState();
}

class _MembershipsScreenState extends ConsumerState<MembershipsScreen> {
  final PaymentService _paymentService = PaymentService();
  bool _isProcessing = false;

  void _openPurchaseSheet(PackageModel package, String currencySymbol, String currencyCode) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: AppTheme.pureWhite,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Select Payment Method',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              'Purchasing: ${package.name} • ${CurrencyFormatter.formatWithCode(package.price, symbol: currencySymbol, currencyCode: currencyCode)}',
              style: const TextStyle(color: AppTheme.mutedText, fontSize: 13),
            ),
            const SizedBox(height: 24),

            // Option 1: Instant Simulated Checkout
            ListTile(
              contentPadding: const EdgeInsets.all(12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: AppTheme.borderSubtle),
              ),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.burgundy.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.bolt_rounded, color: AppTheme.burgundy),
              ),
              title: const Text('Simulated Instant Payment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: const Text('Testing sandbox: instantly activates credits in your account', style: TextStyle(fontSize: 11)),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                Navigator.pop(ctx);
                await _processSimulatedPayment(package);
              },
            ),

            const SizedBox(height: 12),

            // Option 2: Manual Bank Transfer
            ListTile(
              contentPadding: const EdgeInsets.all(12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: AppTheme.borderSubtle),
              ),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.sageGreen.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.account_balance_outlined, color: AppTheme.sageGreen),
              ),
              title: const Text('Manual Bank Transfer / FPS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: const Text('Upload transfer slip for staff verification & credit activation', style: TextStyle(fontSize: 11)),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                Navigator.pop(ctx);
                await _processBankTransfer(package);
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Future<void> _processSimulatedPayment(PackageModel package) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _isProcessing = true);
    await _paymentService.processSimulatedPayment(user: user, package: package);

    final newCredits = package.unlimited ? 999 : user.remainingCredits + package.credits;
    ref.read(authProvider.notifier).updateCredits(newCredits);

    setState(() => _isProcessing = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Payment approved! ${package.credits} credits activated in your account.'),
          backgroundColor: AppTheme.sageGreen,
        ),
      );
    }
  }

  Future<void> _processBankTransfer(PackageModel package) async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;

    setState(() => _isProcessing = true);
    await _paymentService.submitManualBankTransfer(
      user: user,
      package: package,
      referenceNumber: 'WIRE-${DateTime.now().millisecondsSinceEpoch % 100000}',
    );
    setState(() => _isProcessing = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Wire transfer proof submitted for review. Credits will activate upon staff confirmation.'),
          backgroundColor: Colors.brown,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final firestoreService = ref.watch(firestoreServiceProvider);
    final settingsAsync = ref.watch(studioSettingsStreamProvider);
    final currencySymbol = settingsAsync.value?.currencySymbol ?? '\$';
    final currencyCode = settingsAsync.value?.currency ?? 'USD';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Passes & Memberships'),
      ),
      body: SafeArea(
        child: StreamBuilder<List<PackageModel>>(
          stream: firestoreService.streamPackages(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            final packages = snapshot.data ?? [];

            return ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: packages.length,
              separatorBuilder: (_, __) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final pkg = packages[index];
                return _buildPackageCard(pkg, currencySymbol, currencyCode);
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildPackageCard(PackageModel pkg, String currencySymbol, String currencyCode) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppTheme.pureWhite,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: pkg.unlimited ? AppTheme.burgundy : AppTheme.borderSubtle,
          width: pkg.unlimited ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.darkText.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (pkg.unlimited)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFFDF6F5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'RECOMMENDED PASS',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: AppTheme.burgundy,
                ),
              ),
            ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pkg.name,
                      style: const TextStyle(
                        fontFamily: 'Playfair Display',
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.darkText,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      pkg.description,
                      style: const TextStyle(fontSize: 13, color: AppTheme.mutedText),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    CurrencyFormatter.format(pkg.price, symbol: currencySymbol),
                    style: const TextStyle(
                      fontFamily: 'Playfair Display',
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.darkText,
                    ),
                  ),
                  Text(
                    '$currencyCode / ${pkg.validityDays}d',
                    style: const TextStyle(fontSize: 11, color: AppTheme.mutedText),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 18),
          const Divider(height: 1, color: AppTheme.borderSubtle),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.check_circle_outline, size: 16, color: AppTheme.sageGreen),
              const SizedBox(width: 8),
              Text(
                pkg.unlimited ? 'Unlimited class bookings' : '${pkg.credits} Session Credits',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.darkText),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.check_circle_outline, size: 16, color: AppTheme.sageGreen),
              const SizedBox(width: 8),
              Text(
                'Access to ${pkg.eligibleBookingTypes.join(' & ')} classes',
                style: const TextStyle(fontSize: 13, color: AppTheme.mutedText),
              ),
            ],
          ),
          const SizedBox(height: 20),
          PrimaryButton(
            text: 'Purchase Pass',
            isLoading: _isProcessing,
            onPressed: () => _openPurchaseSheet(pkg, currencySymbol, currencyCode),
          ),
        ],
      ),
    );
  }
}

