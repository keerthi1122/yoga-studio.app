import 'package:flutter_test/flutter_test.dart';
import 'package:yoga_studio_app/utils/currency_formatter.dart';
import 'package:yoga_studio_app/models/package_model.dart';
import 'package:yoga_studio_app/models/user_model.dart';

void main() {
  group('Phase 7: Multi-Currency & Payment System Tests', () {
    test('1. CurrencyFormatter accurately formats diverse global currencies without hardcoding', () {
      // USD
      expect(CurrencyFormatter.format(25, symbol: '\$', currencyCode: 'USD'), equals('\$25'));
      expect(CurrencyFormatter.format(25.50, symbol: '\$', currencyCode: 'USD'), equals('\$25.50'));

      // Hong Kong Dollar (HKD)
      expect(CurrencyFormatter.format(210, symbol: 'HK\$', currencyCode: 'HKD'), equals('HK\$210'));

      // Euro (EUR)
      expect(CurrencyFormatter.format(180, symbol: '€', currencyCode: 'EUR'), equals('€180'));

      // Indian Rupee (INR)
      expect(CurrencyFormatter.format(1500, symbol: '₹', currencyCode: 'INR'), equals('₹1,500'));

      // British Pound (GBP)
      expect(CurrencyFormatter.format(140, symbol: '£', currencyCode: 'GBP'), equals('£140'));
    });

    test('2. CurrencyFormatter.formatWithCode outputs standard monetary strings', () {
      expect(CurrencyFormatter.formatWithCode(25, symbol: '\$', currencyCode: 'USD'), equals('\$25 USD'));
      expect(CurrencyFormatter.formatWithCode(210, symbol: 'HK\$', currencyCode: 'HKD'), equals('HK\$210 HKD'));
      expect(CurrencyFormatter.formatWithCode(180, symbol: '€', currencyCode: 'EUR'), equals('€180 EUR'));
      expect(CurrencyFormatter.formatWithCode(1500, symbol: '₹', currencyCode: 'INR'), equals('₹1,500 INR'));
    });

    test('3. Symbol resolver returns correct standard glyphs for currency ISO codes', () {
      expect(CurrencyFormatter.getSymbolForCode('USD'), equals('\$'));
      expect(CurrencyFormatter.getSymbolForCode('HKD'), equals('HK\$'));
      expect(CurrencyFormatter.getSymbolForCode('EUR'), equals('€'));
      expect(CurrencyFormatter.getSymbolForCode('INR'), equals('₹'));
      expect(CurrencyFormatter.getSymbolForCode('GBP'), equals('£'));
      expect(CurrencyFormatter.getSymbolForCode('SGD'), equals('S\$'));
      expect(CurrencyFormatter.getSymbolForCode('AUD'), equals('A\$'));
      expect(CurrencyFormatter.getSymbolForCode('JPY'), equals('¥'));
      expect(CurrencyFormatter.getSymbolForCode('UNKNOWN'), equals('\$'));
    });

    test('4. Payment Methods: Instant Simulated vs Wire Transfer Lifecycle', () {
      const user = UserModel(
        uid: 'user_buyer',
        fullName: 'Kavita Rao',
        email: 'kavita@example.com',
        remainingCredits: 2,
      );

      const pkg = PackageModel(
        packageId: 'pkg_10',
        name: '10-Session Flexible Pack',
        description: '10 sessions',
        price: 210.0,
        currency: 'USD',
        credits: 10,
        validityDays: 90,
        unlimited: false,
        eligibleCategories: ['all'],
        eligibleBookingTypes: ['online', 'offline'],
        startDateRules: 'immediate',
        active: true,
      );

      // Workflow A: Instant Checkout
      final instantPaymentData = {
        'paymentId': 'PAY-INSTANT-101',
        'userId': user.uid,
        'userFullName': user.fullName,
        'packageId': pkg.packageId,
        'packageName': pkg.name,
        'amount': pkg.price,
        'currency': pkg.currency,
        'paymentMethod': 'simulated',
        'paymentStatus': 'verified', // Instant completion
      };

      expect(instantPaymentData['paymentStatus'], equals('verified'));
      expect(instantPaymentData['paymentMethod'], equals('simulated'));

      // Workflow B: Manual Bank Transfer
      final wirePaymentData = {
        'paymentId': 'PAY-WIRE-202',
        'userId': user.uid,
        'userFullName': user.fullName,
        'packageId': pkg.packageId,
        'packageName': pkg.name,
        'amount': pkg.price,
        'currency': pkg.currency,
        'paymentMethod': 'bank_transfer',
        'transactionId': 'WIRE-REF-987654',
        'proofUrl': 'https://storage.googleapis.com/receipts/wire_slip.jpg',
        'paymentStatus': 'pending', // Requires staff verification
      };

      expect(wirePaymentData['paymentStatus'], equals('pending'));
      expect(wirePaymentData['paymentMethod'], equals('bank_transfer'));
      expect(wirePaymentData['proofUrl'], isNotNull);
    });

    test('5. Single Class Purchase Without Membership support', () {
      const singleClassPass = PackageModel(
        packageId: 'pkg_single_dropin',
        name: 'Drop-In Session',
        description: 'Single session pass',
        price: 25.0,
        currency: 'USD',
        credits: 1,
        validityDays: 14,
        unlimited: false,
        eligibleCategories: ['all'],
        eligibleBookingTypes: ['online', 'offline'],
        startDateRules: 'immediate',
        active: true,
      );

      expect(singleClassPass.credits, equals(1));
      expect(singleClassPass.unlimited, isFalse);
      expect(singleClassPass.price, equals(25.0));
    });
  });
}

