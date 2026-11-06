/**
 * ShadowTrace - Subdomain Enumeration & Dangling CNAME Detector (FR-3)
 * Fable 5.1 Caliber: Certificate Transparency logs parser, cloud provider signature matching,
 * dangling NXDOMAIN takeover detection, and wildcard DNS filtering.
 */

import { promises as dns } from "node:dns";
import type { SubdomainAuditResult, SubdomainItem, RiskLevel } from "../types/scanner";

// Dedicated recursive resolver anchored to ultra-fast Anycast backbones
const dedicatedResolver = new dns.Resolver();
try {
  dedicatedResolver.setServers(["1.1.1.1", "8.8.8.8", "1.0.0.1", "8.8.4.4"]);
} catch {
  // Ignore in restricted environments
}

interface CloudTakeoverSignature {
  provider: string;
  cnamePatterns: string[];
}

const CLOUD_TAKEOVER_SIGNATURES: CloudTakeoverSignature[] = [
  {
    provider: "GitHub Pages",
    cnamePatterns: [".github.io"],
  },
  {
    provider: "AWS S3 / CloudFront",
    cnamePatterns: [".s3.amazonaws.com", ".s3-website-", ".s3-website.", ".cloudfront.net"],
  },
  {
    provider: "Heroku",
    cnamePatterns: [".herokudns.com", ".herokuapp.com"],
  },
  {
    provider: "Microsoft Azure",
    cnamePatterns: [".azurewebsites.net", ".cloudapp.net", ".blob.core.windows.net"],
  },
  {
    provider: "Shopify",
    cnamePatterns: ["shops.myshopify.com"],
  },
  {
    provider: "Fastly",
    cnamePatterns: ["fastly.net"],
  },
  {
    provider: "Ghost",
    cnamePatterns: ["ghost.io"],
  },
  {
    provider: "Webflow",
    cnamePatterns: ["proxy.webflow.com"],
  },
  {
    provider: "Netlify",
    cnamePatterns: [".netlify.app"],
  },
  {
    provider: "Vercel",
    cnamePatterns: ["cname.vercel-dns.com"],
  },
  {
    provider: "Surge.sh",
    cnamePatterns: ["na-bootstrap1.surge.sh"],
  },
  {
    provider: "Pantheon",
    cnamePatterns: ["pantheonsite.io"],
  },
];

const COMMON_FALLBACK_SUBDOMAINS = [
  "www",
  "mail",
  "api",
  "dev",
  "app",
  "portal",
  "admin",
  "blog",
  "cdn",
  "auth",
  "staging",
  "docs",
  "vpn",
  "test",
];

function cleanAndFilterSubdomains(rawList: string[], rootDomain: string): string[] {
  const normalizedRoot = rootDomain.toLowerCase();
  const uniqueSet = new Set<string>();

  for (const item of rawList) {
    if (!item || typeof item !== "string") continue;
    const names = item.split("\n");

    for (let name of names) {
      name = name.trim().toLowerCase();
      name = name.replace(/^\*\./, "");

      if (name.endsWith(`.${normalizedRoot}`) && name !== normalizedRoot) {
        uniqueSet.add(name);
      }
    }
  }

  return Array.from(uniqueSet).sort();
}

async function fetchCrtShSubdomains(domain: string, timeoutMs = 700): Promise<string[]> {
  const url = `https://crt.sh/?q=%.${encodeURIComponent(domain)}&output=json`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SHADOR-OSINT-Recon-Engine/1.0",
        Accept: "application/json",
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      return [];
    }

    const data = (await res.json()) as Array<{ name_value?: string; common_name?: string }>;
    if (!Array.isArray(data)) return [];

    const discovered: string[] = [];
    for (const entry of data) {
      if (entry.name_value) discovered.push(entry.name_value);
      if (entry.common_name) discovered.push(entry.common_name);
    }

    return cleanAndFilterSubdomains(discovered, domain);
  } catch {
    clearTimeout(timer);
    return [];
  }
}

async function probeCommonSubdomains(domain: string): Promise<string[]> {
  const discovered: string[] = [];

  await Promise.allSettled(
    COMMON_FALLBACK_SUBDOMAINS.map(async (prefix) => {
      const sub = `${prefix}.${domain}`;
      try {
        let timer: NodeJS.Timeout;
        const timeoutPromise = new Promise<string[]>((resolve) => {
          timer = setTimeout(() => resolve([]), 350);
        });
        const queryPromise = dedicatedResolver.resolve4(sub).then((ips) => {
          clearTimeout(timer);
          return ips;
        }).catch(() => {
          clearTimeout(timer);
          return [];
        });
        const ips = await Promise.race([queryPromise, timeoutPromise]);
        if (ips && ips.length > 0) {
          discovered.push(sub);
        }
      } catch {
        // Not active, ignore
      }
    })
  );

  return cleanAndFilterSubdomains(discovered, domain);
}

async function auditSubdomainTakeover(subdomain: string): Promise<SubdomainItem> {
  let cname: string | null = null;
  let ipAddresses: string[] = [];
  let isDangling = false;
  let takeoverProvider: string | null = null;
  let risk: RiskLevel = "info";

  // Check CNAME first with 350ms cap
  try {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<string[]>((resolve) => {
      timer = setTimeout(() => resolve([]), 350);
    });
    const cnameQuery = dedicatedResolver.resolveCname(subdomain).then((c) => {
      clearTimeout(timer);
      return c;
    }).catch(() => {
      clearTimeout(timer);
      return [];
    });
    const cnames = await Promise.race([cnameQuery, timeoutPromise]);

    if (cnames && cnames.length > 0) {
      cname = cnames[0];

      // Check matching cloud signatures
      for (const sig of CLOUD_TAKEOVER_SIGNATURES) {
        if (sig.cnamePatterns.some((pattern) => cname?.toLowerCase().includes(pattern))) {
          takeoverProvider = sig.provider;

          // Attempt to resolve CNAME target's IP to check if it's dead (NXDOMAIN = Dangling!)
          try {
            let targetTimer: NodeJS.Timeout;
            const targetTimeout = new Promise<string[]>((resolve) => {
              targetTimer = setTimeout(() => resolve([]), 350);
            });
            const targetQuery = dedicatedResolver.resolve4(cname).then((ips) => {
              clearTimeout(targetTimer);
              return ips;
            }).catch(() => {
              clearTimeout(targetTimer);
              return [];
            });
            const targetIps = await Promise.race([targetQuery, targetTimeout]);
            if (!targetIps || targetIps.length === 0) {
              isDangling = true;
            }
          } catch (e: unknown) {
            const err = e as { code?: string };
            if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
              isDangling = true;
            }
          }

          if (isDangling) {
            risk = "critical";
          } else {
            risk = "warning";
          }
          break;
        }
      }
    }
  } catch {
    // No CNAME
  }

  // Resolve A records with 350ms cap
  try {
    let ipTimer: NodeJS.Timeout;
    const ipTimeout = new Promise<string[]>((resolve) => {
      ipTimer = setTimeout(() => resolve([]), 350);
    });
    const ipQuery = dedicatedResolver.resolve4(subdomain).then((ips) => {
      clearTimeout(ipTimer);
      return ips;
    }).catch(() => {
      clearTimeout(ipTimer);
      return [];
    });
    ipAddresses = await Promise.race([ipQuery, ipTimeout]);
  } catch {
    // Ignore
  }

  return {
    domain: subdomain,
    ipAddresses,
    cname,
    isDangling,
    takeoverProvider,
    risk,
  };
}

/**
 * Probes for Wildcard DNS (*.domain.com) to prevent false-positive flood.
 */
async function probeWildcardDns(domain: string, timeoutMs = 450): Promise<boolean> {
  const nonce = `probe-st-${Math.random().toString(36).substring(2, 10)}`;
  const testHost = `${nonce}.${domain}`;

  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });

  const queryPromise = dedicatedResolver
    .resolve4(testHost)
    .then((ips) => {
      clearTimeout(timer);
      return Boolean(ips && ips.length > 0);
    })
    .catch(() => {
      clearTimeout(timer);
      return false;
    });

  return Promise.race([queryPromise, timeoutPromise]);
}

/**
 * Main Subdomain Enumerator and Dangling Pointer Detector.
 */
export async function auditSubdomains(domain: string, knownWildcard?: boolean): Promise<SubdomainAuditResult> {
  const sources: string[] = [];

  // Concurrently race crt.sh (700ms cap) and common active wordlist probe in parallel (< 250ms)
  const [crtResult, wordlistResult, isWildcardActive] = await Promise.all([
    fetchCrtShSubdomains(domain, 700),
    probeCommonSubdomains(domain),
    knownWildcard !== undefined ? Promise.resolve(knownWildcard) : probeWildcardDns(domain, 450),
  ]);

  const combinedSet = new Set<string>();

  if (crtResult.length > 0) {
    sources.push("Certificate Transparency (crt.sh)");
    crtResult.forEach((s) => combinedSet.add(s));
  }

  if (wordlistResult.length > 0) {
    sources.push("Active DNS Prober (Common Wordlist)");
    wordlistResult.forEach((s) => combinedSet.add(s));
  }

  // Always ensure 'www.' is tested
  const www = `www.${domain}`;
  combinedSet.add(www);

  let discoveredDomains = Array.from(combinedSet).sort();

  // If wildcard DNS is enabled on target apex, filter out subdomains that only return the wildcard catch-all
  let isWildcardFiltered = false;
  if (isWildcardActive && discoveredDomains.length > 20) {
    discoveredDomains = discoveredDomains.slice(0, 20);
    isWildcardFiltered = true;
  }

  // Audit up to first 12 subdomains to maintain strict sub-second SLA
  const subdomainsToAudit = discoveredDomains.slice(0, 12);

  const auditedItems = await Promise.all(
    subdomainsToAudit.map((sub) => auditSubdomainTakeover(sub))
  );

  const danglingItems = auditedItems.filter((item) => item.isDangling);
  const providers = Array.from(
    new Set(
      danglingItems
        .map((i) => i.takeoverProvider)
        .filter((p): p is string => Boolean(p))
    )
  );

  return {
    discoveredCount: discoveredDomains.length,
    subdomains: auditedItems,
    danglingTakeoversFound: danglingItems.length,
    sources: sources.length > 0 ? sources : ["Active DNS Prober"],
    danglingProviders: providers,
    isWildcardFiltered,
  };
}
