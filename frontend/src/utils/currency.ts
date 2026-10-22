// Indian Rupee (INR) currency formatting and Web3 ETH conversion utilities

export const ETH_TO_INR_RATE = 285000; // 1 ETH = ₹2,85,000 INR
export const ETH_TO_USD_RATE = 3400;   // 1 ETH = $3,400 USD

/**
 * Format an amount in INR using the standard Indian numbering system (Lakhs, Crores, or grouped digits)
 * e.g. 150000 -> ₹1,50,000
 * e.g. compact: 4275000 -> ₹42.75 L
 */
export function formatINR(amount: number | string, compact: boolean = false): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  if (isNaN(num) || num === null || num === undefined) return '₹0';

  if (compact) {
    if (num >= 10000000) {
      // Crores (1 Cr = 1,00,00,000)
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      // Lakhs (1 Lakh = 1,00,000)
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(1)}k`;
    }
  }

  // Full Indian comma grouping (e.g. 1,50,000)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Convert ETH to INR (rounded integer for rupees)
 */
export function ethToInr(eth: number | string): number {
  const num = typeof eth === 'string' ? parseFloat(eth) || 0 : eth;
  return Math.round(num * ETH_TO_INR_RATE);
}

/**
 * Convert INR to ETH string with proper decimal precision
 */
export function inrToEth(inr: number | string): string {
  const num = typeof inr === 'string' ? parseFloat(inr) || 0 : inr;
  if (!num) return '0';
  const eth = num / ETH_TO_INR_RATE;
  if (eth >= 1) return eth.toFixed(4);
  if (eth >= 0.01) return eth.toFixed(4);
  return eth.toFixed(6);
}

/**
 * Convert a numeric amount into words in Indian English (e.g. for official Section 80G tax receipts)
 * e.g. 25000 -> "Rupees Twenty-Five Thousand Only"
 */
export function numberToIndianWords(num: number | string): string {
  const n = Math.floor(typeof num === 'string' ? parseFloat(num) || 0 : num);
  if (!n || isNaN(n)) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convertTwoDigits(val: number): string {
    if (val < 20) return ones[val];
    const unit = val % 10;
    return tens[Math.floor(val / 10)] + (unit ? ' ' + ones[unit] : '');
  }

  function convertThreeDigits(val: number): string {
    const hundred = Math.floor(val / 100);
    const rest = val % 100;
    let res = '';
    if (hundred) {
      res += ones[hundred] + ' Hundred';
      if (rest) res += ' and ';
    }
    if (rest) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let remaining = n;
  let result = '';

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;

  if (crore) {
    result += convertThreeDigits(crore) + ' Crore ';
  }
  if (lakh) {
    result += convertThreeDigits(lakh) + ' Lakh ';
  }
  if (thousand) {
    result += convertThreeDigits(thousand) + ' Thousand ';
  }
  if (remaining) {
    result += convertThreeDigits(remaining);
  }

  return 'Rupees ' + result.trim() + ' Only';
}
