/**
 * Utility functions for TRON address validation and Energy cost calculations
 */

// Basic regex for TRON Base58 address (starts with 'T', 34 characters)
export function isValidTronAddress(address: string): boolean {
  if (!address) return false;
  const trimmed = address.trim();
  // Valid TRON addresses start with T and are 34 alphanumeric characters
  const tronRegex = /^T[a-zA-HJ-NP-Z0-9]{33}$/;
  return tronRegex.test(trimmed);
}

export function parseTronAddresses(input: string): {
  valid: string[];
  invalid: string[];
} {
  if (!input || !input.trim()) {
    return { valid: [], invalid: [] };
  }

  // Split by newlines, spaces, commas, or semicolons
  const rawTokens = input.split(/[\r\n,\s;]+/).map(t => t.trim()).filter(Boolean);
  
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const token of rawTokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    
    if (isValidTronAddress(token)) {
      valid.push(token);
    } else {
      invalid.push(token);
    }
  }

  return { valid, invalid };
}

// Calculate cost based on energy amount, duration, and address count
// Default rate: ~26.17 SUN per energy unit for short durations
export function calculateEnergyCost(
  amount: number,
  durationMinutes: number,
  addressCount: number
): {
  singleAddressCost: number;
  totalCost: number;
  sunPerEnergy: number;
  savingsPercentage: number;
  burnedTrxEquivalent: number;
} {
  const count = Math.max(1, addressCount);
  const durationFactor = Math.max(1, durationMinutes / 10);
  
  // Base rate in SUN per energy for 10 min
  const sunPerEnergy = 26.17;
  
  // Single address TRX cost = (amount * sunPerEnergy * durationFactor) / 1,000,000
  // Minimum single fee is 0.5 TRX
  let singleCost = (amount * sunPerEnergy * Math.pow(durationFactor, 0.4)) / 1000000;
  if (amount > 0) {
    singleCost = Math.max(0.5, Math.round(singleCost * 1000) / 1000);
  } else {
    singleCost = 0;
  }

  const effectiveAddressCount = addressCount === 0 ? 0 : addressCount;
  const totalCost = Math.round(singleCost * effectiveAddressCount * 1000) / 1000;

  // Burning TRX directly for 64,400 energy costs ~27.25 TRX on chain
  const burnedTrxEquivalent = Math.round((amount / 64400) * 27.25 * 100) / 100;
  const savingsPercentage = burnedTrxEquivalent > 0 && singleCost > 0 
    ? Math.min(92, Math.round((1 - singleCost / burnedTrxEquivalent) * 100))
    : 74;

  return {
    singleAddressCost: singleCost,
    totalCost: totalCost,
    sunPerEnergy: sunPerEnergy,
    savingsPercentage: savingsPercentage,
    burnedTrxEquivalent: burnedTrxEquivalent
  };
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function shortenAddress(address: string, chars = 6): string {
  if (!address) return '';
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}
