/**
 * Utility for formatting currency and monetary amounts according to studio settings
 */

export const getSymbolForCurrency = (code: string): string => {
  switch (code.toUpperCase()) {
    case 'HKD':
      return 'HK$';
    case 'EUR':
      return '€';
    case 'INR':
      return '₹';
    case 'GBP':
      return '£';
    case 'SGD':
      return 'S$';
    case 'AUD':
      return 'A$';
    case 'JPY':
      return '¥';
    case 'USD':
    default:
      return '$';
  }
};

export const formatCurrency = (
  amount: number,
  symbol: string = '$',
  _currencyCode: string = 'USD'
): string => {
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol}${formattedNumber}`;
};

export const formatCurrencyWithCode = (
  amount: number,
  symbol: string = '$',
  currencyCode: string = 'USD'
): string => {
  return `${formatCurrency(amount, symbol, currencyCode)} ${currencyCode}`;
};

