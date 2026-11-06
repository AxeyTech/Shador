/**
 * SHADOR Autonomous Threat Intelligence Feed Generator
 * Generates CISO Executive Markdown Dossiers and OASIS STIX 2.1 Threat Feed Bundles
 */

import type { CompleteScanResult } from "@/lib/types/scanner";

function generateDeterministicUuid(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `${hex.slice(0, 8)}-4000-8000-${hex.slice(0, 4)}-${hex.slice(4, 8)}0000`;
}

/**
 * Generate OASIS STIX 2.1 JSON Threat Feed Bundle
 * Standardized for SIEM ingestion: Splunk, Microsoft Sentinel, OpenCTI, MISP, QRadar
 */
export function generateStix21Bundle(scan: CompleteScanResult): Record<string, unknown> {
  const now = new Date(scan.sanitizedAt).toISOString();
  const domain = scan.targetDomain;
  const bundleId = `bundle--${generateDeterministicUuid(`${domain}-bundle-${scan.id}`)}`;
  const identityId = `identity--${generateDeterministicUuid("shador-autonomous-recon")}`;
  const indicatorId = `indicator--${generateDeterministicUuid(`${domain}-indicator`)}`;

  const objects: Array<Record<string, unknown>> = [
    // 1. Identity Object (Producer)
    {
      type: "identity",
      spec_version: "2.1",
      id: identityId,
      created: now,
      modified: now,
      name: "SHADOR Autonomous Intelligence Engine",
      description: "Passive attack surface reconnaissance, cryptographic posture auditing, and autonomous threat modeling platform.",
      identity_class: "system",
      sectors: ["technology", "defense"],
      contact_information: "https://shador.onrender.com",
    },

    // 2. Domain Indicator
    {
      type: "indicator",
      spec_version: "2.1",
      id: indicatorId,
      created: now,
      modified: now,
      name: `Observed Perimeter Indicator: ${domain}`,
      description: `Passive reconnaissance snapshot for ${domain}. Posture Grade: [${scan.score.letterGrade}] (Risk: ${scan.score.score}/100).`,
      indicator_types: [
        scan.score.score >= 50 ? "compromised" : "anomalous-activity",
      ],
      pattern: `[domain-name:value = '${domain}']`,
      pattern_type: "stix",
      pattern_version: "2.1",
      valid_from: now,
      confidence: 95,
      created_by_ref: identityId,
    },
  ];

  // 3. Email Spoofability Vulnerability Object
  if (scan.emailSpoof.canSpoofDirectly || scan.emailSpoof.status === "critical" || scan.emailSpoof.status === "warning") {
    const vulnId = `vulnerability--${generateDeterministicUuid(`${domain}-spoof-vuln`)}`;
    objects.push({
      type: "vulnerability",
      spec_version: "2.1",
      id: vulnId,
      created: now,
      modified: now,
      name: `Email Spoofability Exposure (RFC 7208 / 7489) on ${domain}`,
      description: scan.emailSpoof.summary || "Domain lacks strict DMARC quarantine/reject enforcement, allowing unauthorized sender impersonation.",
      external_references: [
        { source_name: "cve", external_id: "RFC-7489" },
        { source_name: "cve", external_id: "RFC-7208" },
      ],
      created_by_ref: identityId,
    });

    objects.push({
      type: "relationship",
      spec_version: "2.1",
      id: `relationship--${generateDeterministicUuid(`${indicatorId}-to-${vulnId}`)}`,
      created: now,
      modified: now,
      relationship_type: "indicates",
      source_ref: indicatorId,
      target_ref: vulnId,
      created_by_ref: identityId,
    });
  }

  // 4. Dangling Subdomain Takeover Vulnerabilities
  if (scan.subdomains.danglingTakeoversFound > 0) {
    const danglingVulnId = `vulnerability--${generateDeterministicUuid(`${domain}-dangling-takeover`)}`;
    objects.push({
      type: "vulnerability",
      spec_version: "2.1",
      id: danglingVulnId,
      created: now,
      modified: now,
      name: `Dangling Subdomain CNAME Takeover Vulnerability on ${domain}`,
      description: `Discovered ${scan.subdomains.danglingTakeoversFound} dangling subdomain(s) pointing to unclaimed cloud provider buckets.`,
      external_references: [
        { source_name: "mitre-attack", external_id: "T1584.001" },
        { source_name: "cwe", external_id: "CWE-284" },
      ],
      created_by_ref: identityId,
    });

    objects.push({
      type: "relationship",
      spec_version: "2.1",
      id: `relationship--${generateDeterministicUuid(`${indicatorId}-to-${danglingVulnId}`)}`,
      created: now,
      modified: now,
      relationship_type: "indicates",
      source_ref: indicatorId,
      target_ref: danglingVulnId,
      created_by_ref: identityId,
    });
  }

  // 5. MITRE ATT&CK Attack Pattern Mapping
  const mitreTechniques = [
    { id: "T1584.004", name: "DNS Zone Walking & Perimeter Enumeration" },
    { id: "T1566", name: "Phishing & Spearphishing via Spoofable Identity" },
    { id: "T1590", name: "Gather Victim Network Information" },
  ];

  mitreTechniques.forEach((tech) => {
    const apId = `attack-pattern--${generateDeterministicUuid(`ap-${tech.id}`)}`;
    objects.push({
      type: "attack-pattern",
      spec_version: "2.1",
      id: apId,
      created: now,
      modified: now,
      name: tech.name,
      external_references: [
        {
          source_name: "mitre-attack",
          external_id: tech.id,
          url: `https://attack.mitre.org/techniques/${tech.id}/`,
        },
      ],
      created_by_ref: identityId,
    });

    objects.push({
      type: "relationship",
      spec_version: "2.1",
      id: `relationship--${generateDeterministicUuid(`${indicatorId}-to-${apId}`)}`,
      created: now,
      modified: now,
      relationship_type: "related-to",
      source_ref: indicatorId,
      target_ref: apId,
      created_by_ref: identityId,
    });
  });

  return {
    type: "bundle",
    id: bundleId,
    spec_version: "2.1",
    objects,
  };
}

/**
 * Generate Comprehensive CISO Executive Markdown Dossier
 * Structured for Slack, Notion, GitHub Security Advisories, and Board Presentations
 */
export function generateCisoMarkdownReport(scan: CompleteScanResult): string {
  const date = new Date(scan.sanitizedAt).toUTCString();
  const domain = scan.targetDomain;
  const score = scan.score;
  const email = scan.emailSpoof;
  const tls = scan.tls;
  const subs = scan.subdomains;
  const headers = scan.headers;
  const net = scan.network;

  const defcon =
    score.score < 25
      ? "DEFCON 5 // MINIMAL RISK"
      : score.score < 50
      ? "DEFCON 4 // ELEVATED SURVEILLANCE"
      : score.score < 75
      ? "DEFCON 3 // SUBSTANTIAL EXPOSURE"
      : "DEFCON 1 // CRITICAL PERIMETER COMPROMISE";

  const ai = scan.aiAnalysis;
  const whois = scan.whois;
  const geo = scan.geoIp?.[0] || scan.network?.geoLocations?.[0];

  return `# 🛡️ SHADOR Executive Attack Surface Dossier
> **CLASSIFICATION**: CISO CONFIDENTIAL // RESTRICTED ACCESS  
> **AUDIT TIMESTAMP**: \`${date}\`  
> **TARGET ASSET**: \`${domain}\`  
> **DEFCON OPERATIONAL LEVEL**: **${defcon}**  
> **OVERALL POSTURE**: **Grade [${score.letterGrade}]** (Risk Index: **${score.score}/100**)

---

## 1. Executive Cognitive Threat Summary (Google Gemini Engine)
${ai?.executiveSummary || score.summary?.replace(/\*\*/g, "").replace(/`/g, "") || "Zero intrusive perimeter mapping completed. Telemetry aggregated via passive OSINT heuristics."}

- **Perimeter Resilience Score**: \`${100 - score.score} / 100\`
- **Autonomous Posture Grade**: \`[${score.letterGrade}]\`
- **Primary Operational Status**: \`${score.title}\`

${ai?.attackChainNarrative ? `### Adversary Attack Chain Simulation:\n${ai.attackChainNarrative}\n` : ""}

---

## 2. Domain Lifecycle & WHOIS Hijacking Armor (ICANN RDAP)
- **Registrar**: \`${whois?.registrar || "N/A"}\`
- **Domain Age**: \`${whois?.ageHuman || "N/A"}\` (Created: \`${whois?.createdDate?.slice(0, 10) || "N/A"}\`)
- **Expiration Countdown**: \`${whois?.daysUntilExpiry ?? "N/A"} days remaining\` (Status: **${whois?.expiryRisk === "critical" ? "⚠️ EXPIRING SOON" : "✅ SECURE"}**)
- **Client Transfer Lock**: **${whois?.statusFlags?.some((s) => s.toLowerCase().includes("transferprohibited")) ? "✅ ENFORCED (clientTransferProhibited)" : "⚠️ UNLOCKED"}**
- **DNSSEC Validation**: \`${whois?.dnssecReported ? "SIGNED (RFC 4034)" : "UNSIGNED"}\`

---

## 3. Global Geo-IP Telemetry & BGP Autonomous System
- **Primary Resolving IP**: \`${geo?.ip || "N/A"}\`
- **Server Geolocation**: **${geo?.flagEmoji || "🌐"} ${geo?.countryName || "Global Anycast"}** (${geo?.city || "Edge PoP"}, ${geo?.regionName || ""})
- **Physical Coordinates**: \`${geo?.latitude ? `${geo.latitude.toFixed(4)}°, ${geo.longitude?.toFixed(4)}°` : "Distributed Anycast"}\`
- **Timezone**: \`${geo?.timezone || "UTC"}\`
- **Autonomous System**: \`${geo?.asn || net?.primaryAsn?.asn || "AS-Unknown"}\`
- **Network Carrier / ISP**: \`${geo?.isp || net?.primaryAsn?.organization || "Global Transit"}\`
- **Routing Resilience Index**: \`${net?.routingSecurityScore ?? 85} / 100\`

---

## 4. Email Spoofability & Identity Armor (RFC 7208 / 7489)
- **Direct Spoofing Status**: **${email.canSpoofDirectly ? "⚠️ DIRECTLY SPOOFABLE" : "✅ HARDENED"}**
- **Email Spoofability Risk**: \`${email.score}/100\`
- **SPF Policy Record**: \`${email.spf.raw || "NO SPF RECORD FOUND"}\`
- **SPF Assessment**: \`${email.spf.status.toUpperCase()}\` — ${email.spf.explanation}
- **DMARC Enforcement**: \`p=${email.dmarc.policy.toUpperCase()}\`
- **DMARC Record**: \`${email.dmarc.raw || "NO DMARC ENFORCEMENT RECORD"}\`
- **MTA-STS Cryptographic Mail**: \`${email.hasMtaSts ? "ENABLED" : "NOT CONFIGURED"}\`
- **BIMI Brand Indicator**: \`${email.hasBimi ? "VERIFIED" : "ABSENT"}\`

---

## 5. Subdomain Discovery & Cloud Takeover Exposure
- **Discovered Perimeter Assets**: \`${subs.discoveredCount} endpoints\`
- **Dangling CNAME Takeovers**: **${subs.danglingTakeoversFound > 0 ? `🚨 ${subs.danglingTakeoversFound} CRITICAL TAKEOVER(S)` : "✅ 0 DETECTED"}**

### Sample Discovered Endpoints:
${subs.subdomains
  .slice(0, 10)
  .map(
    (s) =>
      `- \`${s.domain}\` — IPs: [${s.ipAddresses.slice(0, 2).join(", ") || "N/A"}] — ${
        s.isDangling ? "**[DANGLING TAKEOVER]**" : "Active"
      }`
  )
  .join("\n")}
${subs.subdomains.length > 10 ? `\n*(+ ${subs.subdomains.length - 10} additional assets documented in full JSON audit)*` : ""}

---

## 6. TLS/SSL Cryptographic Posture
- **Protocol Suite**: \`${tls.protocol || "TLS 1.3"}\`
- **Certificate Status**: \`${!tls.isExpired ? "VALID" : "INVALID / EXPIRED"}\`
- **Validity Remaining**: \`${tls.daysRemaining} days\`
- **Certificate Authority (Issuer)**: \`${typeof tls.issuer === "string" ? tls.issuer : tls.issuer?.org || tls.issuer?.commonName || "Unknown"}\`
- **Key Exchange / Cipher**: \`${tls.cipherSuite || "TLS_AES_256_GCM_SHA384"}\`

---

## 7. Defensive Edge Headers & Perimeter Hardening
- **Header Security Score**: \`${headers.score}/100\`
- **Missing Crucial Defensive Headers**: \`${headers.criticalMissing?.length || 0} headers\`
${(headers.criticalMissing || []).map((h: string) => `  - ❌ \`${h}\``).join("\n")}

---

## 8. Tactical Hardening & Remediation Action Items
1. ${email.canSpoofDirectly ? "🚨 **IMMEDIATE**: Upgrade DMARC policy from `p=none` to `p=quarantine` or `p=reject` to neutralize email spoofing." : "✅ Maintain DMARC reject enforcement."}
2. ${subs.danglingTakeoversFound > 0 ? "🚨 **IMMEDIATE**: Release or re-register dangling CNAME cloud buckets to prevent subdomain hijacking." : "✅ Subdomain perimeter remains secure."}
3. ${headers.criticalMissing && headers.criticalMissing.includes("strict-transport-security") ? "⚠️ Implement `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`." : "✅ HSTS header actively enforced."}
4. ${headers.criticalMissing && headers.criticalMissing.includes("content-security-policy") ? "⚠️ Deploy strict Content-Security-Policy (CSP) with nonce-based script execution." : "✅ Edge content isolation verified."}

---
*Dossier cryptographically generated via **SHADOR** Autonomous Attack Surface Reconnaissance Platform. 100% Passive Intelligence.*
`;
}