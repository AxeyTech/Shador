/**
 * ShadowTrace - Deterministic Heuristic Fallback Threat Engine (FR-7.3)
 * Generates enterprise threat modeling, multi-stage attack narratives, and copy-paste remediation scripts.
 * Executes instantly with zero dependencies and zero network flakiness.
 */

import type {
  AiThreatAnalysis,
  DnsRecordData,
  EmailSpoofability,
  HeadersAuditResult,
  RemediationPlan,
  SubdomainAuditResult,
  TlsAuditResult,
  CompositeRiskScore,
} from "../types/scanner";

interface ReconContext {
  domain: string;
  dns: { records: DnsRecordData };
  emailSpoof: EmailSpoofability;
  subdomains: SubdomainAuditResult;
  tls: TlsAuditResult;
  headers: HeadersAuditResult;
  score: CompositeRiskScore;
}

export function generateLocalHeuristicAnalysis(ctx: ReconContext): AiThreatAnalysis {
  const { domain, emailSpoof, subdomains, tls, headers, score } = ctx;
  const keyFindings: string[] = [];
  const remediationPlans: RemediationPlan[] = [];

  // 1. Analyze Email Spoofing Posture
  if (emailSpoof.spf.exceedsLookupLimit) {
    keyFindings.push(
      `RFC 7208 SPF PermError: SPF record triggers ${emailSpoof.spf.lookupCount} DNS lookups, exceeding the protocol limit of 10. Receiving mail servers treat this SPF record as non-existent/PermError.`
    );

    remediationPlans.push({
      id: "rem-spf-permerror",
      title: "SPF Flattening & Mechanism Consolidation",
      category: "EMAIL",
      riskLevel: "critical",
      language: "dns",
      instructions: `Flatten nested 'include:' mechanisms into direct 'ip4:' and 'ip6:' ranges to reduce the DNS query count below 10 lookups.`,
      codeSnippet: `; Host: ${domain}
; Type: TXT
; Flatten nested includes into direct CIDR prefixes:
v=spf1 ip4:192.0.2.0/24 include:_spf.google.com -all`,
    });
  }

  if (emailSpoof.canSpoofDirectly || emailSpoof.status === "critical") {
    keyFindings.push(
      `Email Infrastructure Spoofable: DMARC policy is '${emailSpoof.dmarc.policy}' and SPF mechanism is '${emailSpoof.spf.mechanism}', enabling unauthenticated phishing campaigns.`
    );

    remediationPlans.push({
      id: "rem-email-dmarc",
      title: "Hardened DMARC Record Deployment",
      category: "EMAIL",
      riskLevel: "critical",
      language: "dns",
      instructions: `Add an authoritative TXT record at host '_dmarc.${domain}' with a 3600s TTL. Enforce 'p=reject' to drop fraudulent emails globally.`,
      codeSnippet: `; Host: _dmarc.${domain}
; Type: TXT
; Value:
v=DMARC1; p=reject; sp=reject; pct=100; rua=mailto:dmarc-reports@${domain}; ruf=mailto:dmarc-forensics@${domain}; fo=1`,
    });

    remediationPlans.push({
      id: "rem-email-spf",
      title: "Strict SPF (-all) Policy Configuration",
      category: "EMAIL",
      riskLevel: "critical",
      language: "dns",
      instructions: `Update or publish the root TXT record for '${domain}' ending with hard-fail '-all'. Replace authorized IP/includes with your genuine mail providers.`,
      codeSnippet: `; Host: ${domain} (or @)
; Type: TXT
; Value:
v=spf1 mx a include:_spf.google.com ~all
; Replace with -all once all legitimate sending relays are inventoried:
; v=spf1 mx a include:_spf.google.com -all`,
    });
  } else if (emailSpoof.status === "warning") {
    keyFindings.push(
      `Permissive Email Policy: DMARC is set to '${emailSpoof.dmarc.policy}', routing spoofed mail to spam instead of dropping it.`
    );
  }

  if (!emailSpoof.hasMtaSts) {
    keyFindings.push(
      `MTA-STS (RFC 8461) Inactive: SMTP connections are vulnerable to opportunistic TLS downgrade attacks (STARTTLS stripping).`
    );
  }

  // 2. Analyze Dangling Subdomains & Takeover Vectors
  const danglingItems = subdomains.subdomains.filter((s) => s.isDangling);
  if (danglingItems.length > 0) {
    const list = danglingItems.map((d) => `${d.domain} (${d.takeoverProvider || "Cloud Provider"})`).join(", ");
    keyFindings.push(`Subdomain Takeover Vulnerability: ${danglingItems.length} dangling CNAME pointer(s) detected: ${list}.`);

    remediationPlans.push({
      id: "rem-subdomain-takeover",
      title: "Decommission Dangling Cloud CNAME Records",
      category: "SUBDOMAINS",
      riskLevel: "critical",
      language: "dns",
      instructions: `Remove the obsolete CNAME records immediately from your authoritative DNS zone to prevent adversaries from claiming the orphaned cloud storage/hosting bucket.`,
      codeSnippet: danglingItems
        .map(
          (d) =>
            `; ACTION: DELETE this stale record from DNS:\n; ${d.domain} IN CNAME ${d.cname || "orphaned-target"}`
        )
        .join("\n\n"),
    });
  } else if (subdomains.discoveredCount > 10) {
    keyFindings.push(`Broad Attack Surface: Discovered ${subdomains.discoveredCount} public subdomains indexed via Certificate Transparency.`);
  }

  // 3. Analyze Cryptographic Posture
  if (tls.isExpired) {
    keyFindings.push(`Expired SSL/TLS Certificate: Certificate expired ${Math.abs(tls.daysRemaining)} days ago.`);
  } else if (tls.isExpiringSoon) {
    keyFindings.push(`Imminent Certificate Expiry: SSL certificate expires in ${tls.daysRemaining} days (≤ 14 days renewal window).`);
  } else if (tls.isSelfSigned) {
    keyFindings.push("Untrusted / Self-Signed SSL Certificate: Browser security warnings triggered for all visitors.");
  }

  if (tls.isExpired || tls.isExpiringSoon || tls.isSelfSigned) {
    remediationPlans.push({
      id: "rem-tls-renewal",
      title: "Automated Let's Encrypt TLS Certificate Provisioning",
      category: "TLS",
      riskLevel: tls.isExpired || tls.isSelfSigned ? "critical" : "warning",
      language: "bash",
      instructions: "Issue a globally trusted ACME certificate with automatic renewal via Certbot.",
      codeSnippet: `# 1. Install Certbot
sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx

# 2. Issue certificate for apex domain and wildcard/subdomains
sudo certbot --nginx -d ${domain} -d www.${domain} --agree-tos --redirect

# 3. Verify auto-renewal timer
sudo systemctl status certbot.timer`,
    });
  }

  // 4. Analyze HTTP Edge Defensive Headers
  const missingCriticalHeaders = headers.criticalMissing || [];
  if (missingCriticalHeaders.length > 0 || headers.missingCount >= 2) {
    keyFindings.push(
      `Missing Edge Defense Headers: Perimeter lacks ${headers.missingCount} defensive response headers (${missingCriticalHeaders.join(", ") || "HSTS, CSP, X-Frame-Options"}).`
    );

    remediationPlans.push({
      id: "rem-nginx-headers",
      title: "Hardened Nginx Edge Defense Configuration",
      category: "HEADERS",
      riskLevel: missingCriticalHeaders.includes("strict-transport-security") ? "critical" : "warning",
      language: "nginx",
      instructions: `Place these security headers inside your Nginx 'server { ... }' configuration block to eliminate Clickjacking, MIME sniffing, and SSL downgrade vectors.`,
      codeSnippet: `# Nginx Server Configuration Block for ${domain}
server {
    listen 443 ssl http2;
    server_name ${domain} www.${domain};

    # RFC 6797: Strict Transport Security (HSTS) - 2 Years with subdomains and preload
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # OWASP Clickjacking Mitigation
    add_header X-Frame-Options "DENY" always;

    # Prevent MIME confusion attacks
    add_header X-Content-Type-Options "nosniff" always;

    # Restrict referrer leakage
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Restrict unneeded browser device APIs
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;

    # Content Security Policy (Adjust domains to match your CDN/API needs)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' https:; frame-ancestors 'none';" always;
}`,
    });
  }

  // 5. Analyze HTTP -> HTTPS Redirection Enforcement
  if (!headers.forcesHttpsRedirect) {
    keyFindings.push(
      `Insecure Plaintext HTTP Allowed: Traffic directed to 'http://${domain}' is not automatically upgraded to encrypted HTTPS via 301/308 redirects.`
    );

    remediationPlans.push({
      id: "rem-nginx-https-redirect",
      title: "Enforce HTTPS Permanent Redirection (Port 80 -> 443)",
      category: "HEADERS",
      riskLevel: "warning",
      language: "nginx",
      instructions: `Configure your edge proxy / Nginx port 80 listener to immediately issue an HTTP 301 Permanent Redirect to HTTPS.`,
      codeSnippet: `server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};

    # Force immediate HTTPS redirect
    return 301 https://$host$request_uri;
}`,
    });
  }

  // 6. Analyze RFC 9116 security.txt
  if (!headers.hasSecurityTxt) {
    keyFindings.push(
      `Missing RFC 9116 security.txt: Ethical researchers lack a standard coordinated vulnerability disclosure channel.`
    );

    remediationPlans.push({
      id: "rem-security-txt",
      title: "Publish Standardized RFC 9116 security.txt Policy",
      category: "HEADERS",
      riskLevel: "info",
      language: "markdown",
      instructions: `Place a plain-text file at 'https://${domain}/.well-known/security.txt' with your security contact email and expiration timestamp.`,
      codeSnippet: `Contact: mailto:security@${domain}
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://${domain}/.well-known/security.txt`,
    });
  }

  // Synthesize Attack Vector Narrative
  let attackNarrative = "";
  if (emailSpoof.canSpoofDirectly && danglingItems.length > 0) {
    attackNarrative = `Adversary Attack Simulation: Chained Subdomain Hijack & Phishing
1. Reconnaissance: The threat actor identifies dangling CNAME pointer ${danglingItems[0].domain} pointing to an unallocated ${danglingItems[0].takeoverProvider} resource.
2. Takeover Execution: The adversary registers the orphaned bucket, achieving full control over arbitrary web content and scripts hosted under your trusted domain.
3. Domain Spoofing: Leveraging non-enforcing DMARC (p=${emailSpoof.dmarc.policy}), the attacker sends spear-phishing emails claiming to be the ${domain} IT department, directing employees to the hijacked subdomain.
4. Credential Harvesting: Because cookies scoped to .${domain} are transmitted to the hijacked host, the attacker intercepts session tokens and internal credentials with zero detection from standard edge firewalls.`;
  } else if (emailSpoof.canSpoofDirectly) {
    attackNarrative = `Adversary Attack Simulation: Direct Brand Impersonation & BEC
1. Reconnaissance: Scanning discovers that ${domain} maintains an insecure DMARC policy (p=${emailSpoof.dmarc.policy}) with SPF ${emailSpoof.spf.mechanism}.
2. Mail Forgery: Adversary utilizes an open relay or custom SMTP server to forge outbound emails with From: security@${domain}.
3. Delivery: Major email gateways (Google Workspace, Microsoft 365) evaluate the policy. Since p=${emailSpoof.dmarc.policy} instructs monitors only, the email lands directly in the victim's primary inbox.
4. Execution: The employee complies with fraudulent wire instructions or password reset prompts, believing it is an authentic internal message.`;
  } else if (danglingItems.length > 0) {
    attackNarrative = `Adversary Attack Simulation: Perimeter Subdomain Takeover
1. Perimeter Audit: Threat actor crawls CT logs and resolves DNS records for ${domain}, locating ${danglingItems[0].domain} pointing to an abandoned cloud instance.
2. Host Acquisition: By provisioning an asset with the matching name on ${danglingItems[0].takeoverProvider}, the attacker establishes an active web server under your genuine corporate domain.
3. Payload Distribution: Malicious payloads, OAuth credential stealers, or watering hole attacks are served under the legitimate brand name, bypassing enterprise content filters.`;
  } else {
    attackNarrative = `Threat Modeling: Edge Hygiene & Information Leakage
The perimeter for ${domain} exhibits strong foundational hardening. Current minor exposures revolve around missing edge security headers (${headers.missingCount} omitted). While direct exploitation is constrained, missing CSP and X-Frame-Options leaves client browsers susceptible to opportunistic clickjacking and MIME manipulation if secondary application-layer vulnerabilities emerge.`;
  }

  const executiveSummary = `Attack surface analysis of ${domain} completed with an overall Posture Grade of [${score.letterGrade}] (Risk Index: ${score.score}/100). ${score.summary} ${
    emailSpoof.canSpoofDirectly
      ? "Immediate mitigation is required to close critical email spoofability vectors."
      : "Email defense parameters demonstrate hardened operational policies."
  }`;

  return {
    executiveSummary,
    postureGrade: score.letterGrade,
    attackChainNarrative: attackNarrative,
    keyFindings,
    remediationPlans,
    isFallback: true,
    engineUsed: "Autonomous Threat Intelligence Engine",
  };
}
