/**
 * ShadowTrace - Type Definitions for Reconnaissance & Attack Surface Engine
 * Standard Compliance: IEEE Std 830-1998
 */

export type RiskLevel = "secure" | "info" | "warning" | "critical";
export type LetterGrade = "A" | "B" | "C" | "D" | "F";
export type LogLevel = "info" | "warn" | "error" | "success";

export interface DiagnosticLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: "SSRF" | "DNS" | "EMAIL" | "SUBDOMAINS" | "TLS" | "HEADERS" | "CORE" | "AI" | "INTEL" | "SYNTH";
  message: string;
  durationMs?: number;
}

export interface DnsRecordData {
  a: string[];
  aaaa: string[];
  mx: { exchange: string; priority: number }[];
  txt: string[];
  ns: string[];
  soa?: {
    nsname: string;
    hostmaster: string;
    serial: number;
    refresh: number;
    retry: number;
    expire: number;
    minttl: number;
  } | null;
  cname?: string[];
  hasWildcardDns: boolean;
}

export interface SpfAnalysis {
  raw: string | null;
  mechanism: "+all" | "-all" | "~all" | "?all" | "missing" | "invalid";
  status: RiskLevel;
  isHardened: boolean;
  lookupCount: number;
  exceedsLookupLimit: boolean; // RFC 7208 10-lookup PermError
  explanation: string;
}

export interface DmarcAnalysis {
  raw: string | null;
  policy: "reject" | "quarantine" | "none" | "missing" | "invalid";
  subdomainPolicy?: string;
  percentage?: number;
  reportingAddresses?: string[];
  status: RiskLevel;
  explanation: string;
}

export interface EmailSpoofability {
  score: number; // 0 (Fully Hardened) to 100 (Extremely Spoofable)
  status: RiskLevel;
  spf: SpfAnalysis;
  dmarc: DmarcAnalysis;
  hasMtaSts: boolean;
  hasBimi: boolean;
  summary: string;
  canSpoofDirectly: boolean;
}

export interface SubdomainItem {
  domain: string;
  ipAddresses: string[];
  cname?: string | null;
  isDangling: boolean;
  takeoverProvider?: string | null;
  risk: RiskLevel;
}

export interface SubdomainAuditResult {
  discoveredCount: number;
  subdomains: SubdomainItem[];
  danglingTakeoversFound: number;
  sources: string[];
  danglingProviders: string[];
  isWildcardFiltered: boolean;
}

export interface X509CertNode {
  level: "leaf" | "intermediate" | "root";
  subjectCn: string;
  subjectOrg?: string;
  issuerCn: string;
  issuerOrg?: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  serialNumber?: string;
  fingerprintSha256?: string;
  keyAlgorithm?: string;
  keySizeBits?: number;
  signatureAlgorithm?: string;
  isCa: boolean;
  trusted: boolean;
}

export interface TlsAuditResult {
  hasTls: boolean;
  commonName: string | null;
  alternativeNames: string[];
  issuer: {
    org?: string;
    commonName?: string;
  } | null;
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // <= 14 days
  protocol: string | null;
  cipherSuite: string | null;
  isSelfSigned: boolean;
  status: RiskLevel;
  vulnerabilities: string[];
  certChain?: X509CertNode[];
  ocspStapling?: boolean;
  alpnProtocols?: string[];
  rawPem?: string;
}

export interface HeaderAuditItem {
  name: string;
  value: string | null;
  present: boolean;
  compliant: boolean;
  description: string;
  owaspMapping: string;
  recommendation: string;
  risk: RiskLevel;
}

export interface HeadersAuditResult {
  score: number; // 0 to 100
  status: RiskLevel;
  auditedHeaders: Record<string, HeaderAuditItem>;
  rawHeaders?: Record<string, string>;
  missingCount: number;
  criticalMissing: string[];
  hasSecurityTxt: boolean;
  forcesHttpsRedirect: boolean;
}

export interface CompositeRiskScore {
  score: number; // 0 (Most Secure) to 100 (Critical Risk)
  letterGrade: LetterGrade;
  title: string;
  summary: string;
  categoryScores: {
    dns: number;
    emailSpoof: number;
    subdomains: number;
    tls: number;
    headers: number;
  };
}

export interface RemediationPlan {
  id: string;
  title: string;
  category: "DNS" | "EMAIL" | "TLS" | "HEADERS" | "SUBDOMAINS";
  riskLevel: RiskLevel;
  language: "nginx" | "dns" | "bash" | "markdown";
  codeSnippet: string;
  instructions: string;
}

export interface AiThreatAnalysis {
  executiveSummary: string;
  postureGrade: LetterGrade;
  attackChainNarrative: string;
  keyFindings: string[];
  remediationPlans: RemediationPlan[];
  isFallback: boolean;
  engineUsed: string;
}

export interface BgpTransitHop {
  asn: string;
  name: string;
  type: "Tier-1 Transit" | "Internet Exchange" | "Anycast Edge" | "Origin Subnet";
  country: string;
  role: string;
}

export interface AsnInfo {
  asn: string; // e.g. "AS13335"
  organization: string; // e.g. "Cloudflare, Inc."
  countryCode: string; // e.g. "US"
  countryName: string; // e.g. "United States"
  cidr: string; // e.g. "104.16.0.0/12"
  registry: "ARIN" | "RIPE" | "APNIC" | "LACNIC" | "AFRINIC" | "IANA";
  allocatedDate?: string;
  rpkiStatus?: "VALID" | "UNKNOWN" | "INVALID";
  bgpTier?: string;
  peeringExchangeCount?: number;
  isAnycast?: boolean;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  flagEmoji?: string;
  timezone?: string;
}

export interface GeoIpLocation {
  ip: string;
  countryName: string;
  countryCode: string;
  flagEmoji: string;
  regionName: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  org: string;
  asn: string;
}

export interface WhoisAuditResult {
  domain: string;
  registrar: string;
  ianaId?: string;
  createdDate: string | null;
  updatedDate: string | null;
  expiresDate: string | null;
  ageYears: number | null;
  ageHuman: string;
  daysUntilExpiry: number | null;
  expiryRisk: "critical" | "warning" | "secure" | "unknown";
  isNewDomain: boolean;
  isExpiringSoon: boolean;
  statusFlags: string[];
  dnssecReported: boolean;
  nameServers: string[];
  whoisServer?: string;
  riskSummary: string;
}

export interface IpPerimeterNode {
  ip: string;
  version: "IPv4" | "IPv6";
  ptr: string | null;
  asn: AsnInfo;
  isAnycast: boolean;
  providerType: "CDN/Anycast" | "Public Cloud" | "Datacenter/Hosting" | "Enterprise Dedicated";
  riskLevel: RiskLevel;
  routingStatus: "optimal" | "warning" | "exposed";
}

export interface NetworkPerimeterResult {
  primaryIps: IpPerimeterNode[];
  totalIpsDetected: number;
  hasDualStackIpv6: boolean;
  isAnycastProtected: boolean;
  primaryAsn: AsnInfo | null;
  infrastructureClassification: string; // e.g., "Anycast Multi-POP CDN Edge"
  routingSecurityScore: number; // 0 to 100
  status: RiskLevel;
  summary: string;
  rpkiValidation?: "VALID" | "UNKNOWN" | "INVALID";
  bgpHopEstimate?: number;
  upstreamTransits?: string[];
  sovereigntyJurisdiction?: string;
  complianceTags?: string[];
  bgpRoutingPath?: BgpTransitHop[];
  geoLocations?: GeoIpLocation[];
}

export interface InfrastructureDrift {
  previousScanId: string;
  previousScanTimestamp: string;
  hasDrift: boolean;
  newSubdomains: string[];
  decommissionedSubdomains: string[];
  dnsChanges: string[];
  sslDaysDelta: number;
  riskScoreDelta: number;
  summary: string;
  previousGrade?: string;
  currentGrade?: string;
  previousRiskScore?: number;
  currentRiskScore?: number;
  ipShifts?: { ip: string; status: "added" | "removed" | "retained" }[];
  techStackMutations?: string[];
  securityTrajectory?: "improved" | "degraded" | "stable";
}

// Origin IP & WAF Bypass Radar Types
export interface OriginCandidate {
  ip: string;
  source: "subdomain_leak" | "spf_record" | "mx_record" | "active_probe" | "historical_dns";
  sourceDetail: string;
  asn?: AsnInfo;
  confidence: "high" | "medium" | "low";
  wafBypassed: boolean;
  validationCommand: string;
  validationCommandHttp: string;
  nmapCommand: string;
}

export interface HistoricalDnsTool {
  id: string;
  name: string;
  description: string;
  category: "historical_dns" | "ssl_transparency" | "shodan_censys" | "web_archive";
  url: string;
  badge: string;
  iconType: string;
}

export interface OriginBypassResult {
  isBehindWaf: boolean;
  wafProvider: string | null;
  wafEvidence: string[];
  edgeIps: string[];
  candidates: OriginCandidate[];
  historicalTools: HistoricalDnsTool[];
  bypassRiskLevel: RiskLevel;
  summary: string;
  remediationAdvice: {
    title: string;
    description: string;
    codeSnippet?: string;
    language?: "bash" | "nginx" | "markdown";
  }[];
}

// Graph Topology for @xyflow/react
export interface TopologyNodeData {
  [key: string]: unknown;
  label: string;
  type: "root" | "subdomain" | "dns" | "ip" | "mx" | "ns" | "tls" | "vulnerability";
  severity: RiskLevel;
  subtitle?: string;
  isDriftNew?: boolean;
  isSimulated?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TopologyNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: TopologyNodeData;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: Record<string, string | number>;
}

// Red vs Blue Kill-Chain Simulation Types
export interface KillChainStep {
  stage: "Reconnaissance" | "Weaponization" | "Delivery" | "Exploitation" | "Action on Objectives";
  mitreId: string;
  mitreTactic: string;
  redTeamTitle: string;
  redTeamAction: string;
  redTeamCommand: string;
  blueTeamCountermeasure: string;
  blueTeamDetectionRule: string;
  blueTeamRemediationSnippet?: string;
  cvssScore: number;
  severity: RiskLevel;
}

export interface NodeAttackSimulation {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  killChain: KillChainStep[];
}

// ShadowWatch Target Asset Watchlist Types
export interface WatchlistTarget {
  id: string;
  domain: string;
  addedAt: string;
  lastScannedAt?: string;
  lastScanId?: string;
  lastGrade?: LetterGrade;
  lastScore?: number;
  subdomainCount?: number;
  danglingTakeovers?: number;
  wafProvider?: string;
  notes?: string;
  tags?: string[];
  autoAlert: boolean;
}

// Webhook & Tactical Alert Dispatcher Types
export interface WebhookConfig {
  id: string;
  type: "discord" | "slack" | "generic";
  url: string;
  name: string;
  enabled: boolean;
  events: ("critical_alert" | "scan_complete" | "asset_drift")[];
  createdAt: string;
}

// Breach & Credential Exposure Radar Types
export interface HistoricalBreach {
  name: string;
  year: number;
  records: string;
  impact: string;
  cveOrCategory: string;
}

export interface BreachOsintPivot {
  id: string;
  name: string;
  url: string;
  badge: string;
  description: string;
}

export interface BreachExposureResult {
  domain: string;
  exposureRiskLevel: RiskLevel;
  commonEmailPatterns: string[];
  historicalBreaches: HistoricalBreach[];
  osintPivots: BreachOsintPivot[];
  defensiveRecommendations: string[];
  summary: string;
}

// Global Satellite DNS & Propagation Radar Types (FR-11)
export interface SatelliteNodeResult {
  resolverId: string;
  providerName: string;
  resolverIp: string;
  region: string;
  location: string;
  flag: string;
  latencyMs: number;
  status: "synced" | "divergent" | "timeout";
  resolvedIps: string[];
  command: string;
}

export interface SatelliteRadarResult {
  domain: string;
  auditedAt: string;
  totalResolvers: number;
  syncedResolvers: number;
  averageLatencyMs: number;
  propagationStatus: "fully_propagated" | "propagating" | "regional_geodns" | "degraded";
  isGeoDnsActive: boolean;
  propagationPercentage: number;
  nodes: SatelliteNodeResult[];
  summary: string;
}

// Authoritative DNS, DNSSEC (RFC 4035) & AXFR Zone Transfer (FR-12)
export interface DnssecAuditResult {
  isEnabled: boolean;
  hasDsRecord: boolean;
  hasDnskey: boolean;
  algorithm?: string;
  keyTag?: number;
  digestType?: string;
  chainOfTrustStatus: "secure" | "insecure" | "bogus" | "indeterminate";
  summary: string;
}

export interface NameserverAuditItem {
  host: string;
  ips: string[];
  asn?: string;
  organization?: string;
  axfrStatus: "restricted" | "vulnerable" | "unknown";
  testCommand: string;
}

export interface AuthoritativeDnsAuditResult {
  nameservers: NameserverAuditItem[];
  primaryMaster: string | null;
  soaSerial: number | null;
  asnDiversityCount: number;
  hasSinglePointOfFailure: boolean;
  dnssec: DnssecAuditResult;
  status: RiskLevel;
  summary: string;
}

// --- 1. Passive Technology Stack Fingerprint (FR-13) ---
export interface TechStackItem {
  name: string;
  category: "Web Server" | "CMS" | "Backend Framework" | "CDN & Edge Proxy" | "JavaScript Library" | "Security & WAF" | "Analytics / Telemetry";
  version?: string | null;
  confidence: number; // 0 to 100
  iconName: string;
  source: string; // "header" | "html-meta" | "cookie" | "script" | "dns"
  description: string;
}

export interface ThreatHorizonItem {
  component: string;
  versionDisclosed: string | null;
  cveId: string;
  cvss: number;
  severity: "critical" | "high" | "medium" | "low";
  cisaKev: boolean;
  attackVector: string;
  title: string;
  description: string;
  passiveRemediation: string;
}

export interface TechStackResult {
  detectedTechnologies: TechStackItem[];
  primaryServer: string | null;
  primaryCms: string | null;
  primaryFramework: string | null;
  cdnProvider: string | null;
  totalIdentified: number;
  summary: string;
  threatHorizon?: {
    exposureScore: number;
    exposureGrade: "A" | "B" | "C" | "D" | "F";
    vulnerabilities: ThreatHorizonItem[];
    versionDisclosureCount: number;
    hardenedCount: number;
  };
}

// --- 2. Reputation & Threat Intelligence Radar (FR-14) ---
export interface BlacklistCheckItem {
  engineName: string;
  category: "Malware" | "Spam" | "Botnet C2" | "Phishing" | "Tor Relay" | "Cryptomining";
  isFlagged: boolean;
  threatLevel: "clean" | "suspicious" | "toxic";
  details: string;
}

export interface ThreatReputationResult {
  targetIp: string;
  toxicityScore: number; // 0 (Clean) to 100 (Extremely Malicious)
  threatClassification: "CLEAN" | "LOW_RISK" | "SUSPICIOUS" | "TOXIC";
  totalBlacklistsChecked: number;
  blacklistsFlagged: number;
  checks: BlacklistCheckItem[];
  isTorExitNode: boolean;
  isBogonIp: boolean;
  summary: string;
}

// --- 3. Public Secret Exposure & Code Dork Radar (FR-15) ---
export interface SecretDorkItem {
  id: string;
  title: string;
  platform: "GitHub" | "GitLab" | "Pastebin" | "Shodan";
  category: "API Keys & Tokens" | "Cloud Credentials" | "Private Keys" | "Database URIs" | "Environment Configs";
  query: string;
  searchUrl: string;
  severity: "critical" | "high" | "medium";
  riskDescription: string;
  remediation: string;
}

export interface SecretDorkResult {
  domain: string;
  totalVectors: number;
  criticalVectors: number;
  dorks: SecretDorkItem[];
  summary: string;
}

export interface GraphTopology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export interface CompleteScanResult {
  id: string;
  targetDomain: string;
  sanitizedAt: string;
  executionTimeMs: number;
  dns: {
    records: DnsRecordData;
    status: RiskLevel;
  };
  emailSpoof: EmailSpoofability;
  subdomains: SubdomainAuditResult;
  tls: TlsAuditResult;
  headers: HeadersAuditResult;
  score: CompositeRiskScore;
  aiAnalysis: AiThreatAnalysis;
  topology: GraphTopology;
  logs: DiagnosticLog[];
  drift?: InfrastructureDrift | null;
  network?: NetworkPerimeterResult;
  originBypass?: OriginBypassResult;
  breachRadar?: BreachExposureResult;
  satelliteRadar?: SatelliteRadarResult;
  authoritativeDns?: AuthoritativeDnsAuditResult;
  techStack?: TechStackResult;
  threatReputation?: ThreatReputationResult;
  secretDorks?: SecretDorkResult;
  whois?: WhoisAuditResult;
  geoIp?: GeoIpLocation[];
}
