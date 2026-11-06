/**
 * SHADOR - Universal Utility Functions
 * Deterministic formatting, zero-hydration mismatches, and precision helper utilities.
 */

/**
 * Deterministically formats dates to ISO-like YYYY-MM-DD in UTC.
 * Completely immune to server-vs-client locale mismatches (e.g. en-US vs en-GB).
 */
export function formatUtcDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return "N/A";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "N/A";
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "N/A";
  }
}

/**
 * Deterministically formats dates and times to YYYY-MM-DD HH:mm UTC.
 */
export function formatUtcDateTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return "N/A";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "N/A";
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
  } catch {
    return "N/A";
  }
}

/**
 * Calculates total addressable IPv4 count from CIDR prefix bits.
 */
export function calculateCidrHostCount(cidr: string): number {
  if (!cidr || !cidr.includes("/")) return 1;
  const parts = cidr.split("/");
  const bits = parseInt(parts[1], 10);
  if (isNaN(bits) || bits < 0 || bits > 32) return 1;
  return Math.pow(2, 32 - bits);
}

/**
 * Formats a raw number into human-readable compact notation (e.g. 1.05M, 65.5K).
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`;
  }
  return num.toString();
}
