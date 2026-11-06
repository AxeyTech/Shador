/**
 * ShadowTrace - DNS & Email Spoofability Auditor (FR-2)
 * Fable 5.1 Caliber: Native asynchronous parallel DNS resolver, Wildcard DNS probe,
 * RFC 7208 SPF PermError 10-lookup depth analyzer, DMARC policy classifier, MTA-STS, and BIMI inspection.
 */

import { promises as dnsPromises } from "node:dns";
import type {
  DnsRecordData,
  SpfAnalysis,
  DmarcAnalysis,
  EmailSpoofability,
  RiskLevel,
} from "../types/scanner";

// Dedicated recursive resolver anchored to ultra-fast Anycast backbones
const dedicatedResolver = new dnsPromises.Resolver();
try {
  dedicatedResolver.setServers(["1.1.1.1", "8.8.8.8", "1.0.0.1", "8.8.4.4"]);
} catch {
  // Ignore in restricted environments
}

// Timeout wrapper ensuring DNS queries never hang beyond threshold
async function resolveWithTimeout<T>(promise: Promise<T>, timeoutMs = 450, fallback: T): Promise<T> {
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

/**
 * Probes for Wildcard DNS (*.domain.com) to eradicate false-positive subdomains.
 */
async function probeWildcardDns(domain: string): Promise<boolean> {
  const nonce = `probe-st-${Math.random().toString(36).substring(2, 10)}`;
  const testHost = `${nonce}.${domain}`;

  return resolveWithTimeout(
    dedicatedResolver.resolve4(testHost).then((ips) => Boolean(ips && ips.length > 0)),
    450,
    false
  );
}

/**
 * Analyzes SPF policy and counts DNS mechanisms against the RFC 7208 10-lookup limit.
 */
export function analyzeSpf(txtRecords: string[]): SpfAnalysis {
  const spfRecord = txtRecords.find((r) => r.toLowerCase().startsWith("v=spf1"));

  if (!spfRecord) {
    return {
      raw: null,
      mechanism: "missing",
      status: "critical",
      isHardened: false,
      lookupCount: 0,
      exceedsLookupLimit: false,
      explanation:
        "CRITICAL: No SPF record configured. Any malicious actor can forge outbound emails appearing to originate from your domain.",
    };
  }

  const rawLower = spfRecord.toLowerCase();

  // Count mechanisms triggering DNS lookups (RFC 7208 section 4.6.4: max 10 lookups)
  const lookupMatches = rawLower.match(/(include:|a:|mx:|ptr:|exists:|redirect=)/g);
  const lookupCount = lookupMatches ? lookupMatches.length : 0;
  const exceedsLookupLimit = lookupCount > 10;

  if (exceedsLookupLimit) {
    return {
      raw: spfRecord,
      mechanism: rawLower.includes("-all") ? "-all" : rawLower.includes("~all") ? "~all" : "invalid",
      status: "critical",
      isHardened: false,
      lookupCount,
      exceedsLookupLimit: true,
      explanation: `CRITICAL PERMERROR: SPF record exceeds the RFC 7208 limit of 10 DNS lookups (${lookupCount} detected). Receiving mail servers will discard this SPF policy as PermError.`,
    };
  }

  if (rawLower.includes("-all")) {
    return {
      raw: spfRecord,
      mechanism: "-all",
      status: "secure",
      isHardened: true,
      lookupCount,
      exceedsLookupLimit: false,
      explanation:
        "SECURE: Hard-fail (-all) mechanism strictly instructs receiving MTAs to reject unauthorized sender IP addresses.",
    };
  }

  if (rawLower.includes("~all")) {
    return {
      raw: spfRecord,
      mechanism: "~all",
      status: "warning",
      isHardened: false,
      lookupCount,
      exceedsLookupLimit: false,
      explanation:
        "MODERATE RISK: Soft-fail (~all) mechanism instructs receiving MTAs to accept unlisted mail but mark as suspicious, often bypassed by modern phishers.",
    };
  }

  if (rawLower.includes("?all")) {
    return {
      raw: spfRecord,
      mechanism: "?all",
      status: "warning",
      isHardened: false,
      lookupCount,
      exceedsLookupLimit: false,
      explanation:
        "HIGH RISK: Neutral (?all) mechanism provides zero enforcement, stating no policy exists regarding unauthorized senders.",
    };
  }

  if (rawLower.includes("+all")) {
    return {
      raw: spfRecord,
      mechanism: "+all",
      status: "critical",
      isHardened: false,
      lookupCount,
      exceedsLookupLimit: false,
      explanation:
        "CRITICAL VULNERABILITY: Allow-all (+all) mechanism explicitly authorizes every IP address on the global internet to send mail on behalf of your domain.",
    };
  }

  return {
    raw: spfRecord,
    mechanism: "invalid",
    status: "warning",
    isHardened: false,
    lookupCount,
    exceedsLookupLimit: false,
    explanation:
      "WARNING: SPF record found but standard default mechanism was not recognized.",
  };
}

/**
 * Analyzes DMARC policy from _dmarc.<domain> TXT records.
 */
export function analyzeDmarc(dmarcTxtRecords: string[]): DmarcAnalysis {
  const dmarcRecord = dmarcTxtRecords.find((r) => r.toLowerCase().startsWith("v=dmarc1"));

  if (!dmarcRecord) {
    return {
      raw: null,
      policy: "missing",
      status: "critical",
      explanation:
        "CRITICAL: No DMARC record configured at _dmarc.<domain>. Spoofed messages can bypass inbox security controls directly.",
    };
  }

  const raw = dmarcRecord;
  const policyMatch = raw.match(/p\s*=\s*(reject|quarantine|none)/i);
  const policy = policyMatch ? (policyMatch[1].toLowerCase() as "reject" | "quarantine" | "none") : "invalid";

  const spMatch = raw.match(/sp\s*=\s*(reject|quarantine|none)/i);
  const subdomainPolicy = spMatch ? spMatch[1].toLowerCase() : undefined;

  const pctMatch = raw.match(/pct\s*=\s*(\d+)/i);
  const percentage = pctMatch ? parseInt(pctMatch[1], 10) : 100;

  const ruaMatch = raw.match(/rua\s*=\s*([^;]+)/i);
  const reportingAddresses = ruaMatch
    ? ruaMatch[1].split(",").map((s) => s.trim().replace(/^mailto:/i, ""))
    : undefined;

  if (policy === "reject") {
    return {
      raw,
      policy: "reject",
      subdomainPolicy,
      percentage,
      reportingAddresses,
      status: "secure",
      explanation:
        "FULLY HARDENED: DMARC 'p=reject' instructs mail servers to immediately drop fraudulent emails failing SPF/DKIM alignment.",
    };
  }

  if (policy === "quarantine") {
    return {
      raw,
      policy: "quarantine",
      subdomainPolicy,
      percentage,
      reportingAddresses,
      status: "warning",
      explanation:
        "ENFORCING (MODERATE): DMARC 'p=quarantine' diverts unaligned emails to the recipient spam/junk folder rather than dropping them.",
    };
  }

  if (policy === "none") {
    return {
      raw,
      policy: "none",
      subdomainPolicy,
      percentage,
      reportingAddresses,
      status: "critical",
      explanation:
        "INSECURE (MONITORING ONLY): DMARC 'p=none' provides zero protective filtering; spoofed messages are delivered straight into the user inbox.",
    };
  }

  return {
    raw,
    policy: "invalid",
    status: "warning",
    explanation: "WARNING: DMARC record detected but policy syntax is non-compliant or unrecognized.",
  };
}

/**
 * Calculates Email Spoofability Index (0 = Fully Protected, 100 = Extremely Spoofable)
 */
export function calculateSpoofability(
  spf: SpfAnalysis,
  dmarc: DmarcAnalysis,
  hasMtaSts: boolean,
  hasBimi: boolean
): EmailSpoofability {
  let score = 0;
  let canSpoofDirectly = false;
  let status: RiskLevel = "secure";

  // DMARC weight is 55% of score
  if (dmarc.policy === "missing") {
    score += 55;
  } else if (dmarc.policy === "none") {
    score += 45;
  } else if (dmarc.policy === "quarantine") {
    score += 15;
    if (dmarc.percentage && dmarc.percentage < 100) {
      score += (100 - dmarc.percentage) * 0.2;
    }
  }

  // SPF weight is 35% of score
  if (spf.mechanism === "missing" || spf.mechanism === "+all" || spf.exceedsLookupLimit) {
    score += 35;
  } else if (spf.mechanism === "?all") {
    score += 25;
  } else if (spf.mechanism === "~all") {
    score += 15;
  }

  // Secondary email security (MTA-STS & BIMI - 10% weight)
  if (!hasMtaSts) score += 5;
  if (!hasBimi) score += 5;

  score = Math.min(100, Math.max(0, Math.round(score)));

  if (score >= 60 || dmarc.policy === "missing" || dmarc.policy === "none") {
    status = "critical";
    canSpoofDirectly = true;
  } else if (score >= 30) {
    status = "warning";
    canSpoofDirectly = false;
  } else {
    status = "secure";
    canSpoofDirectly = false;
  }

  let summary = "";
  if (canSpoofDirectly) {
    summary =
      "CRITICAL: Domain is vulnerable to direct brand spoofing and BEC phishing. Threat actors can send fraudulent mail as @your-domain with high inbox delivery likelihood.";
  } else if (status === "warning") {
    summary =
      "MODERATE EXPOSURE: Domain has partial mail protection (soft-fail or quarantine), but lack of strict rejection permits opportunistic spoofing.";
  } else {
    summary =
      "PROTECTED: Enterprise mail infrastructure is hardened with strict SPF and DMARC enforcement policies.";
  }

  return {
    score,
    status,
    spf,
    dmarc,
    hasMtaSts,
    hasBimi,
    summary,
    canSpoofDirectly,
  };
}

/**
 * Executes concurrent asynchronous DNS queries across all record types,
 * including Wildcard DNS detection, MTA-STS, and BIMI.
 */
export async function auditDnsAndEmail(domain: string): Promise<{
  records: DnsRecordData;
  emailSpoof: EmailSpoofability;
  overallStatus: RiskLevel;
}> {
  const [
    aRecords,
    aaaaRecords,
    mxRecords,
    txtRecordsRaw,
    nsRecords,
    soaRecord,
    dmarcTxtRaw,
    hasWildcardDns,
    mtaStsRaw,
    bimiRaw,
  ] = await Promise.all([
    resolveWithTimeout(dedicatedResolver.resolve4(domain), 450, [] as string[]),
    resolveWithTimeout(dedicatedResolver.resolve6(domain), 450, [] as string[]),
    resolveWithTimeout(
      dedicatedResolver.resolveMx(domain).then((mx) =>
        mx.map((m) => ({ exchange: m.exchange, priority: m.priority }))
      ),
      450,
      []
    ),
    resolveWithTimeout(
      dedicatedResolver.resolveTxt(domain).then((txt) => txt.map((t) => t.join(""))),
      450,
      [] as string[]
    ),
    resolveWithTimeout(dedicatedResolver.resolveNs(domain), 450, [] as string[]),
    resolveWithTimeout(
      dedicatedResolver.resolveSoa(domain).then((s) => ({
        nsname: s.nsname,
        hostmaster: s.hostmaster,
        serial: s.serial,
        refresh: s.refresh,
        retry: s.retry,
        expire: s.expire,
        minttl: s.minttl,
      })),
      450,
      null
    ),
    resolveWithTimeout(
      dedicatedResolver.resolveTxt(`_dmarc.${domain}`).then((txt) => txt.map((t) => t.join(""))),
      450,
      [] as string[]
    ),
    probeWildcardDns(domain),
    resolveWithTimeout(
      dedicatedResolver.resolveTxt(`_mta-sts.${domain}`).then((txt) => txt.map((t) => t.join(""))),
      350,
      [] as string[]
    ),
    resolveWithTimeout(
      dedicatedResolver.resolveTxt(`default._bimi.${domain}`).then((txt) => txt.map((t) => t.join(""))),
      350,
      [] as string[]
    ),
  ]);

  const spfAnalysis = analyzeSpf(txtRecordsRaw);
  const dmarcAnalysis = analyzeDmarc(dmarcTxtRaw);
  const hasMtaSts = mtaStsRaw.some((t) => t.toLowerCase().startsWith("v=stsv1"));
  const hasBimi = bimiRaw.some((t) => t.toLowerCase().startsWith("v=bimi1"));

  const emailSpoof = calculateSpoofability(spfAnalysis, dmarcAnalysis, hasMtaSts, hasBimi);

  const records: DnsRecordData = {
    a: aRecords,
    aaaa: aaaaRecords,
    mx: mxRecords,
    txt: txtRecordsRaw,
    ns: nsRecords,
    soa: soaRecord,
    hasWildcardDns,
  };

  let overallStatus: RiskLevel = "secure";
  if (emailSpoof.status === "critical" || aRecords.length === 0) {
    overallStatus = "critical";
  } else if (emailSpoof.status === "warning") {
    overallStatus = "warning";
  }

  return {
    records,
    emailSpoof,
    overallStatus,
  };
}
