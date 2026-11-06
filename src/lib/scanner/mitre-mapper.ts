/**
 * ShadowTrace - MITRE ATT&CK Enterprise Matrix & Replay Studio Engine
 * Standard: IEEE Std 830-1998 Tactical Security Blueprint
 * Maps discovered attack surface vectors to official MITRE ATT&CK Enterprise Tactics
 * and generates 1-click terminal verification commands (cURL, dig, openssl, nmap).
 */

import type { CompleteScanResult } from "../types/scanner";

export interface VerificationCommand {
  tool: "cURL" | "dig" | "openssl" | "nmap";
  command: string;
  description: string;
}

export interface MitreAttackTechnique {
  id: string; // e.g., "T1566.002"
  tactic: string; // e.g., "Initial Access (TA0001)"
  name: string; // e.g., "Spearphishing Link / Domain Impersonation"
  category: "EMAIL" | "SUBDOMAINS" | "HEADERS" | "TLS" | "NETWORK";
  severity: "critical" | "warning" | "info" | "secure";
  status: "ACTIVE_VULNERABILITY" | "MITIGATED" | "ELEVATED_EXPOSURE";
  explanation: string;
  mitigationGuide: string;
  verificationCommands: VerificationCommand[];
}

export interface MitreMatrixResult {
  techniques: MitreAttackTechnique[];
  totalAssessed: number;
  activeExposures: number;
  hardenedCount: number;
  topThreatTactic: string;
}

export function computeMitreMatrix(scan: CompleteScanResult): MitreMatrixResult {
  const techniques: MitreAttackTechnique[] = [];
  const target = scan.targetDomain;

  // 1. T1566.002 - Phishing / Domain Impersonation (Email Spoofability)
  const isEmailVulnerable = scan.emailSpoof.canSpoofDirectly || scan.emailSpoof.status === "critical";
  techniques.push({
    id: "T1566.002",
    tactic: "Initial Access (TA0001)",
    name: "Phishing: Spearphishing Link / Email Spoofing",
    category: "EMAIL",
    severity: isEmailVulnerable ? "critical" : scan.emailSpoof.status === "warning" ? "warning" : "secure",
    status: isEmailVulnerable ? "ACTIVE_VULNERABILITY" : scan.emailSpoof.status === "warning" ? "ELEVATED_EXPOSURE" : "MITIGATED",
    explanation: isEmailVulnerable
      ? `Permissive SPF mechanism (${scan.emailSpoof.spf.mechanism}) and unenforced DMARC (${scan.emailSpoof.dmarc.policy}) permit threat actors to forge executive emails from @${target}.`
      : `Email authentication is hardened with strict SPF/DMARC declarations, preventing unauthorized domain spoofing.`,
    mitigationGuide: `Set DMARC policy to 'p=reject' and SPF mechanism to '-all' with verified mail servers.`,
    verificationCommands: [
      {
        tool: "dig",
        command: `dig TXT _dmarc.${target} +short`,
        description: "Inspect live DMARC policy enforcement record",
      },
      {
        tool: "dig",
        command: `dig TXT ${target} +short | grep "v=spf1"`,
        description: "Verify SPF mechanism and authorized sending IP ranges",
      },
    ],
  });

  // 2. T1584.004 - Compromise Infrastructure: Subdomain Takeover
  const hasDanglingTakeover = scan.subdomains.danglingTakeoversFound > 0;
  techniques.push({
    id: "T1584.004",
    tactic: "Resource Development (TA0042)",
    name: "Compromise Infrastructure: Subdomain Takeover",
    category: "SUBDOMAINS",
    severity: hasDanglingTakeover ? "critical" : "secure",
    status: hasDanglingTakeover ? "ACTIVE_VULNERABILITY" : "MITIGATED",
    explanation: hasDanglingTakeover
      ? `${scan.subdomains.danglingTakeoversFound} dangling DNS CNAME records point to decommissioned cloud providers (${scan.subdomains.danglingProviders.join(", ")}), enabling instant takeover.`
      : `Zero dangling CNAME takeover vectors detected across ${scan.subdomains.discoveredCount} enumerated subdomains.`,
    mitigationGuide: `Deprovision or repoint orphaned CNAME DNS records to active endpoints immediately.`,
    verificationCommands: [
      {
        tool: "dig",
        command: `dig CNAME *.${target} +trace`,
        description: "Trace CNAME alias delegation across DNS authoritative roots",
      },
      {
        tool: "cURL",
        command: `curl -I https://${target} -H "Host: ${target}"`,
        description: "Check for unclaimed cloud bucket error pages (e.g. S3, GitHub Pages)",
      },
    ],
  });

  // 3. T1190 - Exploit Public-Facing Application (Edge Headers)
  const isHeadersWeak = scan.headers.score < 50;
  techniques.push({
    id: "T1190",
    tactic: "Initial Access (TA0001)",
    name: "Exploit Public-Facing Application: Insecure Edge Headers",
    category: "HEADERS",
    severity: isHeadersWeak ? "warning" : "secure",
    status: isHeadersWeak ? "ELEVATED_EXPOSURE" : "MITIGATED",
    explanation: isHeadersWeak
      ? `Missing critical edge security headers (${scan.headers.criticalMissing.join(", ")}). Web application exposed to Clickjacking, MIME-confusion, and XSS injection.`
      : `Defensive edge headers (HSTS, X-Frame-Options, CSP, nosniff) enforce browser-level containment.`,
    mitigationGuide: `Configure Strict-Transport-Security, Content-Security-Policy, and X-Content-Type-Options in edge reverse proxy.`,
    verificationCommands: [
      {
        tool: "cURL",
        command: `curl -s -D - -o /dev/null https://${target}/ | grep -iE "strict-transport-security|content-security-policy|x-frame-options|x-content-type-options"`,
        description: "Audit HTTP response headers for missing OWASP edge security flags",
      },
    ],
  });

  // 4. T1557.002 - Adversary-in-the-Middle: SSL/TLS Cryptographic Downgrade
  const isTlsWeak = !scan.tls.hasTls || scan.tls.isExpired || scan.tls.isSelfSigned;
  techniques.push({
    id: "T1557.002",
    tactic: "Credential Access (TA0006)",
    name: "Adversary-in-the-Middle: SSL/TLS Downgrade & Eavesdropping",
    category: "TLS",
    severity: isTlsWeak ? "critical" : scan.tls.isExpiringSoon ? "warning" : "secure",
    status: isTlsWeak ? "ACTIVE_VULNERABILITY" : scan.tls.isExpiringSoon ? "ELEVATED_EXPOSURE" : "MITIGATED",
    explanation: isTlsWeak
      ? `Cryptographic posture compromised: ${scan.tls.vulnerabilities.join("; ")}.`
      : `Valid TLS certificate active (${scan.tls.daysRemaining} days remaining) with modern cipher suite (${scan.tls.cipherSuite || "Modern TLS"}).`,
    mitigationGuide: `Enforce TLS 1.3/1.2 modern ciphers, disable legacy CBC/RC4, and automate certificate renewal via ACME.`,
    verificationCommands: [
      {
        tool: "openssl",
        command: `openssl s_client -connect ${target}:443 -servername ${target} -brief`,
        description: "Perform raw TLS handshake to verify SNI, protocol version, and cipher negotiation",
      },
      {
        tool: "nmap",
        command: `nmap --script ssl-enum-ciphers -p 443 ${target}`,
        description: "Enumerate supported TLS ciphers and verify absence of weak legacy suites",
      },
    ],
  });

  // 5. T1498 - Network Denial of Service (BGP Anycast & Routing Resilience)
  const isAnycast = Boolean(scan.network?.isAnycastProtected);
  techniques.push({
    id: "T1498",
    tactic: "Impact (TA0040)",
    name: "Network Denial of Service: BGP Anycast & Resilience",
    category: "NETWORK",
    severity: isAnycast ? "secure" : "warning",
    status: isAnycast ? "MITIGATED" : "ELEVATED_EXPOSURE",
    explanation: isAnycast
      ? `Perimeter protected by ${scan.network?.primaryAsn?.organization || "Anycast"} distributed routing fabric. Volumetric floods absorbed across distributed POPs.`
      : `Unicast routing detected without Anycast shielding. Direct origin exposure increases susceptibility to L3/L4 volumetric saturation.`,
    mitigationGuide: `Deploy Anycast CDN reverse proxy (Cloudflare, AWS CloudFront, Fastly) to distribute inbound routing load.`,
    verificationCommands: [
      {
        tool: "cURL",
        command: `curl -s -w "\\nLookup: %{time_namelookup}s | Connect: %{time_connect}s | TLS: %{time_appconnect}s\\n" -o /dev/null https://${target}`,
        description: "Benchmark edge latency and connect times across global routing hubs",
      },
    ],
  });

  const totalAssessed = techniques.length;
  const activeExposures = techniques.filter(
    (t) => t.status === "ACTIVE_VULNERABILITY" || t.status === "ELEVATED_EXPOSURE"
  ).length;
  const hardenedCount = techniques.filter((t) => t.status === "MITIGATED").length;

  let topThreatTactic = "Defensive Baseline Maintained";
  if (hasDanglingTakeover) {
    topThreatTactic = "Resource Development (TA0042) - Subdomain Takeover";
  } else if (isEmailVulnerable) {
    topThreatTactic = "Initial Access (TA0001) - Phishing & Spoofing";
  } else if (isTlsWeak) {
    topThreatTactic = "Credential Access (TA0006) - Cryptographic Downgrade";
  }

  return {
    techniques,
    totalAssessed,
    activeExposures,
    hardenedCount,
    topThreatTactic,
  };
}
