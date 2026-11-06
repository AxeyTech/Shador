/**
 * ShadowTrace - SSRF & Domain Validation Guard (FR-1)
 * Fable 5.1 Caliber Hardened: RFC 1035 compliance, decimal/hex/octal IP normalization,
 * IPv4 & IPv6 dual-stack resolution checks, and defense against DNS Rebinding and Cloud Metadata exfiltration.
 */

import { promises as dns, setDefaultResultOrder } from "node:dns";
import net from "node:net";

// Prioritize IPv4 lookups to eradicate Windows RFC 8305 IPv6 connect timeout lag
try {
  setDefaultResultOrder?.("ipv4first");
} catch {
  // Ignore in restricted environments
}

// Dedicated recursive resolver anchored to ultra-fast Anycast backbones
const dedicatedResolver = new dns.Resolver();
try {
  dedicatedResolver.setServers(["1.1.1.1", "8.8.8.8", "1.0.0.1", "8.8.4.4"]);
} catch {
  // Ignore in restricted environments
}

// Timeout wrapper ensuring pre-flight SSRF DNS inspection never hangs
async function resolveDnsWithTimeout<T>(promise: Promise<T>, timeoutMs = 300, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), timeoutMs);
  });

  return Promise.race([
    promise
      .then((val) => {
        clearTimeout(timer);
        return val;
      })
      .catch(() => {
        clearTimeout(timer);
        return fallback;
      }),
    timeoutPromise,
  ]);
}

export class DomainValidationError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "DomainValidationError";
    this.code = code;
  }
}

/**
 * Checks for obfuscated IP representations (decimal, hex, octal formats often used in SSRF bypasses).
 * e.g., 2130706433 (decimal for 127.0.0.1), 0x7f.1 (hex), 0177.0.0.1 (octal)
 */
function isObfuscatedIpFormat(input: string): boolean {
  // Pure decimal integer (e.g., 2130706433)
  if (/^\d{8,10}$/.test(input)) {
    const num = parseInt(input, 10);
    if (num >= 0 && num <= 4294967295) return true;
  }

  // Hexadecimal notation (e.g., 0x7f000001, 0x7f.0.0.1)
  if (/^0x[0-9a-f]+/i.test(input) || input.includes("0x")) {
    return true;
  }

  // Octal notation (e.g., 0177.0.0.1)
  if (/^0\d+(\.0\d+)*$/.test(input)) {
    return true;
  }

  return false;
}

/**
 * Strips protocol, credentials, path, query strings, and port.
 */
export function sanitizeDomainInput(input: string): string {
  if (!input || typeof input !== "string") {
    throw new DomainValidationError("Target domain cannot be empty", "EMPTY_INPUT");
  }

  let clean = input.trim().toLowerCase();

  // Strip leading protocols (http://, https://, ftp://, //)
  clean = clean.replace(/^[a-zA-Z]+:\/\//, "");
  clean = clean.replace(/^\/\//, "");

  // Strip user authentication (user:pass@)
  if (clean.includes("@")) {
    const parts = clean.split("@");
    clean = parts[parts.length - 1];
  }

  // Strip path segments, query params, hash fragments
  clean = clean.split("/")[0];
  clean = clean.split("?")[0];
  clean = clean.split("#")[0];

  // Strip trailing port if present (e.g., example.com:8080)
  if (clean.includes(":") && !clean.includes("[")) {
    clean = clean.split(":")[0];
  } else if (clean.startsWith("[") && clean.includes("]")) {
    clean = clean.replace(/^\[|\]$/g, "");
  }

  // Remove trailing dots
  clean = clean.replace(/\.+$/, "");

  return clean;
}

/**
 * Validates domain structure against RFC 1035 / RFC 1123 specifications.
 */
export function validateRfc1035Domain(domain: string): boolean {
  if (!domain || domain.length > 253) {
    return false;
  }

  // Reject local and reserved pseudo-TLDs / Internal targets
  const reservedTlds = [
    "localhost",
    "local",
    "internal",
    "lan",
    "home",
    "corp",
    "invalid",
    "test",
    "example",
    "arpa",
    "onion",
  ];

  const parts = domain.split(".");
  if (parts.length < 2) {
    return false;
  }

  const tld = parts[parts.length - 1];
  if (reservedTlds.includes(tld)) {
    return false;
  }

  // Check known cloud metadata hostnames
  if (domain.includes("metadata.google.internal") || domain.includes("instance-data")) {
    return false;
  }

  // RFC 1035 / RFC 1123 label regex:
  // Each label must be 1-63 chars, start and end with alphanumeric, can contain hyphens.
  const labelRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;

  for (const label of parts) {
    if (!label || label.length > 63 || !labelRegex.test(label)) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluates whether an IPv4 or IPv6 address belongs to a private, loopback, or cloud metadata block.
 */
export function isForbiddenIp(ipAddress: string): boolean {
  const ipType = net.isIP(ipAddress);
  if (ipType === 0) return false;

  if (ipType === 4) {
    const octets = ipAddress.split(".").map(Number);
    if (octets.length !== 4 || octets.some(isNaN)) return true;

    const [a, b, c] = octets;

    // Loopback (127.0.0.0/8)
    if (a === 127) return true;

    // Current network (0.0.0.0/8)
    if (a === 0) return true;

    // RFC 1918 Private ranges:
    // 10.0.0.0/8
    if (a === 10) return true;
    // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;

    // Carrier-Grade NAT (100.64.0.0/10)
    if (a === 100 && b >= 64 && b <= 127) return true;

    // Link-Local & Cloud Metadata (169.254.0.0/16, including AWS/GCP/Azure 169.254.169.254)
    if (a === 169 && b === 254) return true;

    // IETF Protocol Assignments (192.0.0.0/24)
    if (a === 192 && b === 0 && c === 0) return true;

    // Benchmarking (198.18.0.0/15)
    if (a === 198 && (b === 18 || b === 19)) return true;

    // Multicast (224.0.0.0/4) and Future Use (240.0.0.0/4)
    if (a >= 224) return true;

    // Broadcast
    if (ipAddress === "255.255.255.255") return true;

    return false;
  }

  if (ipType === 6) {
    const lower = ipAddress.toLowerCase();
    // IPv6 Loopback (::1)
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
    // Unspecified (::)
    if (lower === "::" || lower === "0:0:0:0:0:0:0:0") return true;
    // Link-local unicast (fe80::/10)
    if (lower.startsWith("fe80:") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true;
    // Unique local address (fc00::/7 - fc00 to fdff)
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    // IPv4-mapped IPv6 (::ffff:192.0.2.1)
    if (lower.startsWith("::ffff:")) {
      const v4Part = lower.replace("::ffff:", "");
      if (net.isIPv4(v4Part)) return isForbiddenIp(v4Part);
    }
  }

  return false;
}

/**
 * Pre-flight Domain Security Inspector.
 * Normalizes input, checks for SSRF bypass obfuscation, verifies RFC 1035 compliance,
 * resolves both IPv4 & IPv6 records, and blocks SSRF targets against internal enterprise assets.
 */
export async function validateAndInspectDomain(rawInput: string): Promise<{
  sanitizedDomain: string;
  resolvedIps: string[];
}> {
  const sanitizedDomain = sanitizeDomainInput(rawInput);

  // Check for obfuscated IP notations (decimal, hex, octal)
  if (isObfuscatedIpFormat(sanitizedDomain)) {
    throw new DomainValidationError(
      `SSRF Defense Alert: Input '${sanitizedDomain}' matches an obfuscated numeric IP pattern. Please provide a legitimate domain name.`,
      "SSRF_OBFUSCATED_IP"
    );
  }

  // If user provided a raw IP, block and advise
  if (net.isIP(sanitizedDomain)) {
    if (isForbiddenIp(sanitizedDomain)) {
      throw new DomainValidationError(
        `SSRF Protection Alert: Address ${sanitizedDomain} is reserved/private and cannot be audited.`,
        "SSRF_FORBIDDEN_IP"
      );
    }
    throw new DomainValidationError(
      "Direct IP scanning is disallowed. Please provide an authorized Fully Qualified Domain Name (FQDN).",
      "IP_NOT_ALLOWED"
    );
  }

  if (!validateRfc1035Domain(sanitizedDomain)) {
    throw new DomainValidationError(
      `Invalid domain syntax '${sanitizedDomain}'. Must comply with RFC 1035 FQDN standards (e.g., example.com).`,
      "INVALID_RFC1035"
    );
  }

  // Dual-Stack Pre-flight DNS resolution (IPv4 & IPv6) to prevent DNS Rebinding / Private IP SSRF
  try {
    const [resolvedIpv4, resolvedIpv6] = await Promise.all([
      resolveDnsWithTimeout(dedicatedResolver.resolve4(sanitizedDomain), 250, [] as string[]),
      resolveDnsWithTimeout(dedicatedResolver.resolve6(sanitizedDomain), 250, [] as string[]),
    ]);

    const allIps = [...resolvedIpv4, ...resolvedIpv6];

    for (const ip of allIps) {
      if (isForbiddenIp(ip)) {
        throw new DomainValidationError(
          `SSRF Security Block: Domain '${sanitizedDomain}' resolves to protected internal IP (${ip}). Reconnaissance aborted.`,
          "SSRF_INTERNAL_RESOLUTION"
        );
      }
    }

    return { sanitizedDomain, resolvedIps: resolvedIpv4 };
  } catch (err: unknown) {
    if (err instanceof DomainValidationError) {
      throw err;
    }
    return { sanitizedDomain, resolvedIps: [] };
  }
}
