/**
 * ShadowTrace - Master Reconnaissance Orchestrator (FR-2 - FR-7)
 * Concurrent native auditing pipeline (< 3.5s SLA), risk scoring matrix, AI threat synthesis, and topology generator.
 */

import { setDefaultResultOrder } from "node:dns";
import { validateAndInspectDomain } from "./ssrf-guard";

try {
  setDefaultResultOrder?.("ipv4first");
} catch {
  // Ignore in restricted environments
}
import { auditDnsAndEmail } from "./dns-auditor";
import { auditSubdomains } from "./subdomain-auditor";
import { auditTls } from "./tls-auditor";
import { auditHeaders } from "./headers-auditor";
import { auditNetworkPerimeter } from "./network-auditor";
import { auditOriginBypass } from "./origin-detector";
import { auditBreachExposure } from "./breach-radar";
import { auditGlobalSatelliteDns } from "./satellite-resolver";
import { auditAuthoritativeDns } from "./dnssec-auditor";
import { auditTechStack } from "./tech-fingerprinter";
import { auditThreatReputation } from "./reputation-auditor";
import { generateSecretDorks } from "./secret-dorks";
import { auditWhois } from "./whois-auditor";
import { synthesizeThreatIntelligence } from "../ai/gemini-engine";
import type {
  CompleteScanResult,
  CompositeRiskScore,
  DiagnosticLog,
  GraphTopology,
  LetterGrade,
  RiskLevel,
  TopologyEdge,
  TopologyNode,
} from "../types/scanner";

function createLog(
  category: DiagnosticLog["category"],
  level: DiagnosticLog["level"],
  message: string,
  startTime: number
): DiagnosticLog {
  return {
    id: `log-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    category,
    level,
    message,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Calculates Composite Risk Score (0 = Secure, 100 = Critical Vulnerability) and Letter Grade.
 */
function calculateCompositeRisk(
  dnsStatus: RiskLevel,
  emailSpoofScore: number,
  subdomainCount: number,
  danglingTakeovers: number,
  tlsResult: { status: RiskLevel; isExpired: boolean; isSelfSigned: boolean },
  headersScore: number
): CompositeRiskScore {
  let riskScore = 0;

  // 1. Email Spoofability (Weight: 35%)
  const emailWeight = 0.35;
  const emailContribution = emailSpoofScore * emailWeight;
  riskScore += emailContribution;

  // 2. Dangling Subdomain Takeovers (Weight: 25%)
  let subdomainsRisk = 0;
  if (danglingTakeovers > 0) {
    subdomainsRisk = 100; // Critical danger
  } else if (subdomainCount > 15) {
    subdomainsRisk = 20; // Wide attack surface
  } else if (subdomainCount > 5) {
    subdomainsRisk = 10;
  }
  riskScore += subdomainsRisk * 0.25;

  // 3. Cryptographic TLS Posture (Weight: 20%)
  let tlsRisk = 0;
  if (tlsResult.isExpired || tlsResult.isSelfSigned || tlsResult.status === "critical") {
    tlsRisk = 100;
  } else if (tlsResult.status === "warning") {
    tlsRisk = 45;
  } else {
    tlsRisk = 5;
  }
  riskScore += tlsRisk * 0.2;

  // 4. HTTP Edge Security Headers (Weight: 20%)
  const headerRisk = 100 - headersScore;
  riskScore += headerRisk * 0.2;

  // Final rounded score
  const finalRisk = Math.min(100, Math.max(0, Math.round(riskScore)));

  let letterGrade: LetterGrade = "A";
  let title = "Hardened Perimeter";
  let summary = "Strong defensive posture with verified cryptographic standards and email enforcement.";

  if (finalRisk <= 20) {
    letterGrade = "A";
    title = "Hardened Enterprise Perimeter";
    summary = "Superior security posture. Strict email spoofing defense, hardened TLS, and robust defensive edge headers.";
  } else if (finalRisk <= 40) {
    letterGrade = "B";
    title = "Adequate Defensive Posture";
    summary = "Reliable edge security with minor hygiene gaps in secondary defensive headers or partial DMARC enforcement.";
  } else if (finalRisk <= 60) {
    letterGrade = "C";
    title = "Elevated Attack Surface Exposure";
    summary = "Moderate risk posture. DMARC policy is either missing or non-enforcing, with multiple missing edge headers.";
  } else if (finalRisk <= 80) {
    letterGrade = "D";
    title = "High Attack Susceptibility";
    summary = "Dangerous vulnerabilities detected. Domain is prone to direct spoofing campaigns and lack of core perimeter protections.";
  } else {
    letterGrade = "F";
    title = "Critical Security Compromise Vector";
    summary = "Urgent remediation required. Dangling CNAME takeovers, expired certificates, or catastrophic email spoofability detected.";
  }

  return {
    score: finalRisk,
    letterGrade,
    title,
    summary,
    categoryScores: {
      dns: dnsStatus === "critical" ? 85 : dnsStatus === "warning" ? 40 : 10,
      emailSpoof: emailSpoofScore,
      subdomains: subdomainsRisk,
      tls: tlsRisk,
      headers: headerRisk,
    },
  };
}

/**
 * Builds pre-computed topological graph coordinates (nodes & edges) for @xyflow/react.
 * Optimized for mobile touch, low memory consumption, and 60+ FPS rendering.
 */
function buildTopologyGraph(
  domain: string,
  scanId: string,
  resolvedIps: string[],
  subdomains: string[],
  danglingSubdomains: string[],
  mxExchanges: string[],
  nsServers: string[],
  hasTls: boolean,
  tlsStatus: RiskLevel,
  spoofStatus: RiskLevel
): GraphTopology {
  const nodes: TopologyNode[] = [];
  const edges: TopologyEdge[] = [];

  // Root Node (Center)
  const rootId = `root-${domain}`;
  nodes.push({
    id: rootId,
    type: "root",
    position: { x: 400, y: 300 },
    data: {
      label: domain,
      type: "root",
      severity: spoofStatus === "critical" ? "critical" : "secure",
      subtitle: "Target FQDN",
    },
  });

  let currentAngle = 0;
  const radiusLevel1 = 220;

  // Level 1: Subdomains
  const displaySubs = subdomains.slice(0, 8);
  const totalL1 = displaySubs.length + Math.min(2, mxExchanges.length) + Math.min(2, nsServers.length) + (hasTls ? 1 : 0);
  const angleStep = (2 * Math.PI) / Math.max(1, totalL1);

  displaySubs.forEach((sub, i) => {
    const isDangling = danglingSubdomains.includes(sub);
    const subId = `sub-${i}`;
    const x = Math.round(400 + radiusLevel1 * Math.cos(currentAngle));
    const y = Math.round(300 + radiusLevel1 * Math.sin(currentAngle));
    currentAngle += angleStep;

    nodes.push({
      id: subId,
      type: "subdomain",
      position: { x, y },
      data: {
        label: sub.replace(`.${domain}`, ""),
        type: "subdomain",
        severity: isDangling ? "critical" : "info",
        subtitle: isDangling ? "Dangling CNAME!" : "Subdomain",
      },
    });

    edges.push({
      id: `edge-${rootId}-${subId}`,
      source: rootId,
      target: subId,
      animated: isDangling,
      style: { stroke: isDangling ? "#f43f5e" : "#c084fc", strokeWidth: 1.8 },
    });
  });

  // Level 1: Mail Exchanger (MX)
  mxExchanges.slice(0, 2).forEach((mx, i) => {
    const mxId = `mx-${i}`;
    const x = Math.round(400 + radiusLevel1 * Math.cos(currentAngle));
    const y = Math.round(300 + radiusLevel1 * Math.sin(currentAngle));
    currentAngle += angleStep;

    nodes.push({
      id: mxId,
      type: "mx",
      position: { x, y },
      data: {
        label: mx.split(".")[0] || "Mail",
        type: "mx",
        severity: spoofStatus,
        subtitle: "Mail Gateway",
      },
    });

    edges.push({
      id: `edge-${rootId}-${mxId}`,
      source: rootId,
      target: mxId,
      style: { stroke: spoofStatus === "critical" ? "#f43f5e" : "#38bdf8", strokeWidth: 1.8 },
    });
  });

  // Level 1: Nameservers (NS)
  nsServers.slice(0, 2).forEach((ns, i) => {
    const nsId = `ns-${i}`;
    const x = Math.round(400 + radiusLevel1 * Math.cos(currentAngle));
    const y = Math.round(300 + radiusLevel1 * Math.sin(currentAngle));
    currentAngle += angleStep;

    nodes.push({
      id: nsId,
      type: "ns",
      position: { x, y },
      data: {
        label: ns.split(".")[0] || "DNS",
        type: "ns",
        severity: "info",
        subtitle: "Authoritative NS",
      },
    });

    edges.push({
      id: `edge-${rootId}-${nsId}`,
      source: rootId,
      target: nsId,
      style: { stroke: "#818cf8", strokeWidth: 1.8 },
    });
  });

  // Level 1: TLS Cryptographic Node
  if (hasTls) {
    const tlsId = `tls-${scanId}`;
    const x = Math.round(400 + radiusLevel1 * Math.cos(currentAngle));
    const y = Math.round(300 + radiusLevel1 * Math.sin(currentAngle));
    currentAngle += angleStep;

    nodes.push({
      id: tlsId,
      type: "tls",
      position: { x, y },
      data: {
        label: "TLS / Port 443",
        type: "tls",
        severity: tlsStatus,
        subtitle: "Edge Certificate",
      },
    });

    edges.push({
      id: `edge-${rootId}-${tlsId}`,
      source: rootId,
      target: tlsId,
      style: { stroke: tlsStatus === "critical" ? "#f43f5e" : "#10b981", strokeWidth: 1.8 },
    });
  }

  // Level 2: Primary IP Nodes
  resolvedIps.slice(0, 3).forEach((ip, i) => {
    const ipId = `ip-${i}`;
    const x = 400 + (i === 0 ? 0 : i === 1 ? -120 : 120);
    const y = 480;

    nodes.push({
      id: ipId,
      type: "ip",
      position: { x, y },
      data: {
        label: ip,
        type: "ip",
        severity: "info",
        subtitle: "A Record",
      },
    });

    edges.push({
      id: `edge-${rootId}-${ipId}`,
      source: rootId,
      target: ipId,
      style: { stroke: "#f59e0b", strokeWidth: 1.5 },
    });
  });

  return { nodes, edges };
}

/**
 * Executes the entire reconnaissance pipeline concurrently adhering to < 3.5s SLA.
 */
export async function executeShadowTraceRecon(rawDomainInput: string): Promise<CompleteScanResult> {
  const startTime = Date.now();
  const logs: DiagnosticLog[] = [];
  const scanId = `st-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

  logs.push(createLog("CORE", "info", "Initializing SHADOR reconnaissance engine...", startTime));

  // FR-1: Domain Ingestion & SSRF Pre-flight
  logs.push(createLog("SSRF", "info", `Validating domain input and checking RFC 1035 compliance...`, startTime));
  const { sanitizedDomain, resolvedIps } = await validateAndInspectDomain(rawDomainInput);
  logs.push(createLog("SSRF", "success", `Domain validated: '${sanitizedDomain}'. SSRF check passed.`, startTime));

  // Concurrently dispatch all protocol auditors using Promise.allSettled
  logs.push(createLog("CORE", "info", "Dispatching concurrent auditors (DNS, Subdomains, TLS, Headers, Network, Satellite, Authoritative)...", startTime));

  const [
    dnsResultPromise,
    subdomainsResultPromise,
    tlsResultPromise,
    headersResultPromise,
    networkResultPromise,
    satelliteResultPromise,
    authoritativeResultPromise,
    whoisResultPromise,
  ] = await Promise.allSettled([
    auditDnsAndEmail(sanitizedDomain),
    auditSubdomains(sanitizedDomain),
    auditTls(sanitizedDomain),
    auditHeaders(sanitizedDomain),
    auditNetworkPerimeter(sanitizedDomain, resolvedIps),
    auditGlobalSatelliteDns(sanitizedDomain, resolvedIps),
    auditAuthoritativeDns(sanitizedDomain),
    auditWhois(sanitizedDomain),
  ]);

  // Extract DNS & Email
  const dnsData =
    dnsResultPromise.status === "fulfilled"
      ? dnsResultPromise.value
      : {
          records: { a: resolvedIps, aaaa: [], mx: [], txt: [], ns: [], soa: null, hasWildcardDns: false },
          emailSpoof: {
            score: 75,
            status: "critical" as RiskLevel,
            spf: { raw: null, mechanism: "missing" as const, status: "critical" as RiskLevel, isHardened: false, lookupCount: 0, exceedsLookupLimit: false, explanation: "Query timeout" },
            dmarc: { raw: null, policy: "missing" as const, status: "critical" as RiskLevel, explanation: "Query timeout" },
            hasMtaSts: false,
            hasBimi: false,
            summary: "DNS evaluation timed out.",
            canSpoofDirectly: true,
          },
          overallStatus: "warning" as RiskLevel,
        };

  // Resilient multi-tier backfill: Ensure A and NS records are never empty if pre-flight or authoritative DNS identified them
  if (dnsData.records.a.length === 0 && resolvedIps.length > 0) {
    dnsData.records.a = resolvedIps;
  }

  logs.push(
    createLog(
      "DNS",
      "success",
      `DNS resolution completed: ${dnsData.records.a.length} A records, ${dnsData.records.mx.length} MX records. Wildcard DNS: ${dnsData.records.hasWildcardDns ? "ACTIVE" : "NONE"}.`,
      startTime
    )
  );
  logs.push(
    createLog(
      "EMAIL",
      dnsData.emailSpoof.status === "critical" ? "warn" : "success",
      `Email Posture: ${dnsData.emailSpoof.status.toUpperCase()} (Spoof Score: ${dnsData.emailSpoof.score}/100, SPF lookups: ${dnsData.emailSpoof.spf.lookupCount}/10, DMARC: ${dnsData.emailSpoof.dmarc.policy}, MTA-STS: ${dnsData.emailSpoof.hasMtaSts ? "YES" : "NO"}, BIMI: ${dnsData.emailSpoof.hasBimi ? "YES" : "NO"}).`,
      startTime
    )
  );

  // Extract Subdomains
  const subdomainsData =
    subdomainsResultPromise.status === "fulfilled"
      ? subdomainsResultPromise.value
      : {
          discoveredCount: 0,
          subdomains: [],
          danglingTakeoversFound: 0,
          sources: [],
          danglingProviders: [],
          isWildcardFiltered: false,
        };

  logs.push(
    createLog(
      "SUBDOMAINS",
      subdomainsData.danglingTakeoversFound > 0 ? "warn" : "success",
      `Subdomain enumeration finished: ${subdomainsData.discoveredCount} indexed, ${subdomainsData.danglingTakeoversFound} dangling takeover vectors detected. (Wildcard filtered: ${subdomainsData.isWildcardFiltered ? "YES" : "NO"}).`,
      startTime
    )
  );

  // Extract TLS
  const tlsData =
    tlsResultPromise.status === "fulfilled"
      ? tlsResultPromise.value
      : {
          hasTls: false,
          commonName: null,
          alternativeNames: [],
          issuer: null,
          validFrom: null,
          validTo: null,
          daysRemaining: 0,
          isExpired: false,
          isExpiringSoon: false,
          protocol: null,
          cipherSuite: null,
          isSelfSigned: false,
          status: "critical" as RiskLevel,
          vulnerabilities: ["TLS handshake failed or timed out"],
        };

  logs.push(
    createLog(
      "TLS",
      tlsData.status === "critical" ? "error" : "success",
      tlsData.hasTls
        ? `TLS Handshake successful: ${tlsData.protocol} (${tlsData.cipherSuite || "Unknown"}), ${tlsData.daysRemaining} days remaining.`
        : `TLS Audit: ${tlsData.vulnerabilities[0] || "Insecure"}`,
      startTime
    )
  );

  // Extract Headers
  const headersData =
    headersResultPromise.status === "fulfilled"
      ? headersResultPromise.value
      : {
          score: 30,
          status: "critical" as RiskLevel,
          auditedHeaders: {},
          missingCount: 6,
          criticalMissing: ["strict-transport-security", "content-security-policy"],
          hasSecurityTxt: false,
          forcesHttpsRedirect: false,
        };

  logs.push(
    createLog(
      "HEADERS",
      headersData.status === "critical" ? "warn" : "success",
      `Edge Defense Audit: Posture score ${headersData.score}/100 (${headersData.missingCount} missing headers, HTTPS redirect: ${headersData.forcesHttpsRedirect ? "FORCED" : "UNENFORCED"}, security.txt: ${headersData.hasSecurityTxt ? "PRESENT" : "MISSING"}).`,
      startTime
    )
  );

  // Network Perimeter & Autonomous BGP ASN Audit
  const targetIps = dnsData.records.a.length > 0 ? [...dnsData.records.a, ...dnsData.records.aaaa] : resolvedIps;
  const subdomainIps = subdomainsData.subdomains.flatMap((s) => s.ipAddresses);
  const networkData =
    networkResultPromise.status === "fulfilled"
      ? networkResultPromise.value
      : await auditNetworkPerimeter(sanitizedDomain, targetIps, subdomainIps);

  logs.push(
    createLog(
      "CORE",
      networkData.status === "critical" ? "warn" : "success",
      `Network Perimeter Audit: ${networkData.primaryAsn?.asn || "AS-Unknown"} (${networkData.primaryAsn?.organization || "Unknown"}) · ${networkData.infrastructureClassification}. Resilience: ${networkData.routingSecurityScore}/100.`,
      startTime
    )
  );

  // Cloudflare Origin IP Finder & WAF Bypass Radar
  const originBypass = await auditOriginBypass(
    sanitizedDomain,
    dnsData,
    subdomainsData,
    headersData,
    networkData
  );

  logs.push(
    createLog(
      "INTEL",
      originBypass.bypassRiskLevel === "critical" ? "warn" : "success",
      `Origin & WAF Radar: ${originBypass.wafProvider}. (${originBypass.candidates.length} direct origin candidate server IPs identified).`,
      startTime
    )
  );

  // Dark Web & Compromised Credential Breach Exposure Radar
  const breachRadar = auditBreachExposure(sanitizedDomain);
  logs.push(
    createLog(
      "INTEL",
      "info",
      `Breach Exposure Radar: ${breachRadar.historicalBreaches.length} mega-dump correlations & password spray models analyzed.`,
      startTime
    )
  );

  // Global Multi-Resolver Satellite DNS & Anycast Propagation Radar
  const satelliteRadar =
    satelliteResultPromise.status === "fulfilled"
      ? satelliteResultPromise.value
      : await auditGlobalSatelliteDns(sanitizedDomain, resolvedIps);

  logs.push(
    createLog(
      "INTEL",
      satelliteRadar.propagationStatus === "degraded" ? "warn" : "success",
      `Global Satellite DNS: ${satelliteRadar.propagationPercentage}% synchronized across ${satelliteRadar.syncedResolvers}/${satelliteRadar.totalResolvers} worldwide backbones (${satelliteRadar.averageLatencyMs}ms avg latency).`,
      startTime
    )
  );

  // Authoritative DNS, DNSSEC (RFC 4035) & AXFR Zone Transfer Security Radar
  const authoritativeDns =
    authoritativeResultPromise.status === "fulfilled"
      ? authoritativeResultPromise.value
      : await auditAuthoritativeDns(sanitizedDomain, dnsData.records.ns);

  if (dnsData.records.ns.length === 0 && authoritativeDns.nameservers.length > 0) {
    dnsData.records.ns = authoritativeDns.nameservers.map((n) => n.host);
  }
  logs.push(
    createLog(
      "INTEL",
      authoritativeDns.status === "critical" ? "warn" : "success",
      `Authoritative DNS & DNSSEC: ${authoritativeDns.nameservers.length} NS records, DNSSEC: ${authoritativeDns.dnssec.isEnabled ? "ACTIVE" : "INACTIVE"}.`,
      startTime
    )
  );

  // Passive Technology Stack Fingerprint (FR-13)
  const techStack = auditTechStack(headersData, dnsData.records);
  logs.push(
    createLog(
      "INTEL",
      "success",
      `Passive Tech Fingerprint: ${techStack.totalIdentified} components identified. (Server: ${techStack.primaryServer || "Hardened"}, CMS: ${techStack.primaryCms || "None"}, CDN: ${techStack.cdnProvider || "Direct"}).`,
      startTime
    )
  );

  // Reputation & Threat Intelligence Radar (FR-14)
  const threatReputation = auditThreatReputation(
    sanitizedDomain,
    dnsData.records.a.length > 0 ? dnsData.records.a : resolvedIps
  );
  logs.push(
    createLog(
      "INTEL",
      threatReputation.threatClassification === "CLEAN" ? "success" : "warn",
      `Threat Reputation Radar: IP ${threatReputation.targetIp} is ${threatReputation.threatClassification} (Toxicity: ${threatReputation.toxicityScore}/100, Blacklists Flagged: ${threatReputation.blacklistsFlagged}/${threatReputation.totalBlacklistsChecked}).`,
      startTime
    )
  );

  // Public Secret Exposure & Code Dork Radar (FR-15)
  const secretDorks = generateSecretDorks(sanitizedDomain);
  logs.push(
    createLog(
      "INTEL",
      "info",
      `Secret Dork Radar: Synthesized ${secretDorks.totalVectors} weaponized search vectors (${secretDorks.criticalVectors} critical) for public credential leak detection.`,
      startTime
    )
  );

  // Autonomous RDAP / WHOIS Lifecycle Intelligence & Expiry Threat Radar
  const whoisData =
    whoisResultPromise.status === "fulfilled"
      ? whoisResultPromise.value
      : null;

  if (whoisData) {
    logs.push(
      createLog(
        "INTEL",
        whoisData.expiryRisk === "critical" ? "warn" : "success",
        `WHOIS / RDAP: Registrar '${whoisData.registrar}' | Age: ${whoisData.ageHuman} | Expiry: ${whoisData.daysUntilExpiry !== null ? whoisData.daysUntilExpiry + " days" : "Undisclosed"}.`,
        startTime
      )
    );
  }

  // Calculate Composite Risk Score & Grade
  const compositeScore = calculateCompositeRisk(
    dnsData.overallStatus,
    dnsData.emailSpoof.score,
    subdomainsData.discoveredCount,
    subdomainsData.danglingTakeoversFound,
    tlsData,
    headersData.score
  );

  logs.push(
    createLog(
      "CORE",
      "success",
      `Audit completed. Final Grade: [${compositeScore.letterGrade}] (Risk Index: ${compositeScore.score}/100).`,
      startTime
    )
  );

  // FR-7: Synthesize AI Threat Intelligence (Gemini 2.0 Flash with Heuristic Fallback)
  logs.push(createLog("AI", "info", "Dispatching telemetry to cognitive threat synthesizer...", startTime));
  const aiAnalysis = await synthesizeThreatIntelligence({
    domain: sanitizedDomain,
    dns: { records: dnsData.records },
    emailSpoof: dnsData.emailSpoof,
    subdomains: subdomainsData,
    tls: tlsData,
    headers: headersData,
    score: compositeScore,
  });

  logs.push(
    createLog(
      "AI",
      aiAnalysis.isFallback ? "info" : "success",
      `Threat intelligence synthesized via ${aiAnalysis.engineUsed}.`,
      startTime
    )
  );

  // Build Topological Graph
  const topology = buildTopologyGraph(
    sanitizedDomain,
    scanId,
    dnsData.records.a.length > 0 ? dnsData.records.a : resolvedIps,
    subdomainsData.subdomains.map((s) => s.domain),
    subdomainsData.subdomains.filter((s) => s.isDangling).map((s) => s.domain),
    dnsData.records.mx.map((m) => m.exchange),
    dnsData.records.ns,
    tlsData.hasTls,
    tlsData.status,
    dnsData.emailSpoof.status
  );

  const totalDuration = Date.now() - startTime;

  return {
    id: scanId,
    targetDomain: sanitizedDomain,
    sanitizedAt: new Date().toISOString(),
    executionTimeMs: totalDuration,
    dns: {
      records: dnsData.records,
      status: dnsData.overallStatus,
    },
    emailSpoof: dnsData.emailSpoof,
    subdomains: subdomainsData,
    tls: tlsData,
    headers: headersData,
    score: compositeScore,
    aiAnalysis,
    topology,
    logs,
    network: networkData,
    originBypass,
    breachRadar,
    satelliteRadar,
    authoritativeDns,
    techStack,
    threatReputation,
    secretDorks,
    whois: whoisData || undefined,
    geoIp: networkData?.geoLocations || undefined,
  };
}

export const executeShadorRecon = executeShadowTraceRecon;
