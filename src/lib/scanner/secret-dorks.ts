/**
 * ShadowTrace - Public Secret Exposure & Code Dork Radar (FR-15)
 * Standard: IEEE Std 830-1998 Tactical OSINT & Bug Bounty Reconnaissance
 * 
 * Synthesizes weaponized passive search dorks across GitHub, GitLab, Pastebin,
 * and Shodan to identify leaked API keys, .env credentials, and hardcoded private tokens.
 */

import type { SecretDorkItem, SecretDorkResult } from "../types/scanner";

export function generateSecretDorks(domain: string): SecretDorkResult {
  const cleanDomain = domain.toLowerCase().trim();

  const dorkTemplates: Omit<SecretDorkItem, "searchUrl">[] = [
    {
      id: "dork-env",
      title: "Leaked Environment Credentials (.env)",
      platform: "GitHub",
      category: "Environment Configs",
      query: `"${cleanDomain}" filename:.env DB_PASSWORD`,
      severity: "critical",
      riskDescription: "Publicly committed environment configuration files containing active database credentials.",
      remediation: "Immediately revoke exposed database credentials and add .env to .gitignore repository rules.",
    },
    {
      id: "dork-aws",
      title: "AWS Root & IAM Access Key IDs",
      platform: "GitHub",
      category: "Cloud Credentials",
      query: `"${cleanDomain}" "AKIA"`,
      severity: "critical",
      riskDescription: "Hardcoded 20-character AWS Access Key ID prefixes (AKIA...) giving administrative cloud access.",
      remediation: "Deactivate and delete the exposed IAM access key in the AWS IAM Console and audit CloudTrail logs.",
    },
    {
      id: "dork-rsa",
      title: "Cryptographic RSA & SSH Private Keys",
      platform: "GitHub",
      category: "Private Keys",
      query: `"${cleanDomain}" "BEGIN RSA PRIVATE KEY"`,
      severity: "critical",
      riskDescription: "Raw unencrypted private key material allowing SSH server compromise or SSL MITM decryption.",
      remediation: "Regenerate the key pair immediately, rotate SSH authorized_keys across all production fleet servers.",
    },
    {
      id: "dork-db-uri",
      title: "Database Connection URIs (MongoDB / Postgres)",
      platform: "GitHub",
      category: "Database URIs",
      query: `"${cleanDomain}" "mongodb+srv://" OR "postgres://"`,
      severity: "critical",
      riskDescription: "Full database connection string including user, password, cluster endpoint and DB name.",
      remediation: "Rotate master database password, restrict VPC network firewall peering to authorized IP subnets only.",
    },
    {
      id: "dork-stripe",
      title: "Stripe Live Secret Payment Keys",
      platform: "GitHub",
      category: "API Keys & Tokens",
      query: `"${cleanDomain}" "sk_live_"`,
      severity: "critical",
      riskDescription: "Production live Stripe secret key allowing unauthorized charges, refunds, and financial data exfiltration.",
      remediation: "Roll the compromised secret API key in the Stripe Dashboard immediately and restrict API permissions.",
    },
    {
      id: "dork-sendgrid",
      title: "SendGrid & Mailgun SMTP Mailer Tokens",
      platform: "GitHub",
      category: "API Keys & Tokens",
      query: `"${cleanDomain}" "SG." OR "key-"`,
      severity: "high",
      riskDescription: "High-reputation transactional email API keys enabling weaponized phishing from company sender domains.",
      remediation: "Revoke SendGrid API key, review sent mail activity in SendGrid Activity Feed for unauthorized broadcasts.",
    },
    {
      id: "dork-webhook",
      title: "Slack & Discord Incoming Webhook URLs",
      platform: "GitHub",
      category: "API Keys & Tokens",
      query: `"${cleanDomain}" "hooks.slack.com/services/"`,
      severity: "high",
      riskDescription: "Direct internal channel webhook endpoints allowing unauthenticated message broadcasting.",
      remediation: "Delete the webhook in Slack App Directory / Integrations and generate a new private webhook URL.",
    },
    {
      id: "dork-gh-pat",
      title: "GitHub Personal Access Tokens (PAT)",
      platform: "GitHub",
      category: "API Keys & Tokens",
      query: `"${cleanDomain}" "ghp_"`,
      severity: "critical",
      riskDescription: "Active developer personal access token providing full read/write access to internal code repositories.",
      remediation: "Revoke the PAT in GitHub Developer Settings and audit organization repository clone activity.",
    },
    {
      id: "dork-jwt",
      title: "Hardcoded JWT Secret & HMAC Signature Salt",
      platform: "GitHub",
      category: "API Keys & Tokens",
      query: `"${cleanDomain}" "jwt_secret" OR "SECRET_KEY"`,
      severity: "high",
      riskDescription: "Static secret string used to sign JSON Web Tokens, allowing attackers to forge arbitrary admin claims.",
      remediation: "Rotate JWT signature secret in production environment variables and invalidate active user sessions.",
    },
    {
      id: "dork-s3",
      title: "Amazon S3 Storage Bucket Disclosures",
      platform: "GitHub",
      category: "Cloud Credentials",
      query: `"${cleanDomain}" "s3.amazonaws.com"`,
      severity: "medium",
      riskDescription: "Publicly referenced S3 bucket names that may have permissive or misconfigured ACL write permissions.",
      remediation: "Enable AWS S3 Block Public Access at the account level and audit bucket access policies.",
    },
    {
      id: "dork-docker",
      title: "Docker Compose Hardcoded Root Passwords",
      platform: "GitHub",
      category: "Environment Configs",
      query: `"${cleanDomain}" filename:docker-compose.yml "MYSQL_ROOT_PASSWORD"`,
      severity: "high",
      riskDescription: "Production or staging container configuration files with default or hardcoded root passwords.",
      remediation: "Inject credentials via Docker secrets or secure environment variables rather than plaintext compose files.",
    },
    {
      id: "dork-vpn",
      title: "WireGuard & OpenVPN Client Profiles",
      platform: "GitHub",
      category: "Private Keys",
      query: `"${cleanDomain}" filename:.conf "PrivateKey"`,
      severity: "critical",
      riskDescription: "Corporate VPN tunnel configuration profiles containing private keys and internal gateway IP addresses.",
      remediation: "Revoke the client certificate or public key on the VPN gateway and regenerate peer credentials.",
    },
    {
      id: "dork-pastebin",
      title: "Pastebin Corporate Credential Dumps",
      platform: "Pastebin",
      category: "Environment Configs",
      query: `site:pastebin.com "${cleanDomain}"`,
      severity: "medium",
      riskDescription: "Anonymous public text paste dumps mentioning target domain credentials, logs, or server configs.",
      remediation: "Issue DMCA takedown requests to Pastebin and rotate any credentials or tokens referenced in pastes.",
    },
    {
      id: "dork-gitlab",
      title: "GitLab Public Code Snippet Exposures",
      platform: "GitLab",
      category: "API Keys & Tokens",
      query: `"${cleanDomain}" "api_key"`,
      severity: "high",
      riskDescription: "Open GitLab repository snippets and public issues leaking corporate API keys.",
      remediation: "Audit public GitLab repository permissions and convert proprietary repositories to internal/private visibility.",
    },
    {
      id: "dork-shodan",
      title: "Shodan Exposed Vulnerable Services",
      platform: "Shodan",
      category: "Cloud Credentials",
      query: `ssl:"${cleanDomain}" has_vuln:true`,
      severity: "high",
      riskDescription: "Perimeter services identified on Shodan with verified known unpatched CVE vulnerabilities.",
      remediation: "Patch vulnerable server daemon versions or place behind an encrypted Zero Trust access tunnel.",
    },
    {
      id: "dork-google",
      title: "Google Cloud Service Account JSON Keys",
      platform: "GitHub",
      category: "Cloud Credentials",
      query: `"${cleanDomain}" "private_key_id" "client_email"`,
      severity: "critical",
      riskDescription: "Full GCP Service Account JSON key credentials enabling automated Google Cloud resource hijacking.",
      remediation: "Delete the service account key in the GCP Cloud Console and review IAM roles granted to the identity.",
    },
  ];

  const dorks: SecretDorkItem[] = dorkTemplates.map((item) => {
    let searchUrl = "";
    if (item.platform === "GitHub") {
      searchUrl = `https://github.com/search?q=${encodeURIComponent(item.query)}&type=code`;
    } else if (item.platform === "GitLab") {
      searchUrl = `https://gitlab.com/search?search=${encodeURIComponent(item.query)}`;
    } else if (item.platform === "Pastebin") {
      searchUrl = `https://www.google.com/search?q=${encodeURIComponent(item.query)}`;
    } else if (item.platform === "Shodan") {
      searchUrl = `https://www.shodan.io/search?query=${encodeURIComponent(item.query)}`;
    }

    return {
      ...item,
      searchUrl,
    };
  });

  const criticalCount = dorks.filter((d) => d.severity === "critical").length;

  return {
    domain: cleanDomain,
    totalVectors: dorks.length,
    criticalVectors: criticalCount,
    dorks,
    summary: `Synthesized ${dorks.length} high-impact passive secret reconnaissance vectors (${criticalCount} critical) across GitHub, GitLab, and Pastebin.`,
  };
}
