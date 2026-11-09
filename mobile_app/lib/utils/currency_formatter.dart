import 'package:intl/intl.dart';

class CurrencyFormatter {
  /// Formats a numerical amount with studio currency symbol and formatting
  static String format(
    num amount, {
    String symbol = '\$',
    String currencyCode = 'USD',
    bool showDecimals = false,
  }) {
    final NumberFormat formatter = showDecimals
        ? NumberFormat.currency(symbol: symbol, decimalDigits: 2)
        : NumberFormat.currency(
            symbol: symbol,
            decimalDigits: amount % 1 == 0 ? 0 : 2,
          );

    return formatter.format(amount).trim();
  }

  /// Formats amount with currency suffix, e.g. "$25 USD" or "HK$210 HKD"
  static String formatWithCode(
    num amount, {
    String symbol = '\$',
    String currencyCode = 'USD',
  }) {
    final formatted = format(amount, symbol: symbol, showDecimals: false);
    return '$formatted $currencyCode';
  }

  /// Returns the standard currency symbol for a given 3-letter currency code
  static String getSymbolForCode(String code) {
    switch (code.toUpperCase()) {
      case 'HKD':
        return 'HK\$';
      case 'EUR':
        return '€';
      case 'INR':
        return '₹';
      case 'GBP':
        return '£';
      case 'SGD':
        return 'S\$';
      case 'AUD':
        return 'A\$';
      case 'JPY':
        return '¥';
      case 'USD':
      default:
        return '\$';
    }
  }
}

