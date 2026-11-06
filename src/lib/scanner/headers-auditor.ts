/**
 * ShadowTrace - HTTP Edge Defense & Security Headers Scanner (FR-5)
 * Safe non-destructive HTTP header auditor with OWASP Top 10, CVSS vulnerability mappings,
 * HTTP -> HTTPS redirection enforcement check, and RFC 9116 security.txt posture audit.
 */

import type { HeadersAuditResult, HeaderAuditItem, RiskLevel } from "../types/scanner";

interface HeaderRule {
  headerName: string;
  evaluator: (value: string | null) => {
    present: boolean;
    compliant: boolean;
    risk: RiskLevel;
    recommendation: string;
  };
  description: string;
  owaspMapping: string;
}

const SECURITY_HEADER_RULES: HeaderRule[] = [
  {
    headerName: "strict-transport-security",
    description: "Forces HTTPS connections, preventing SSL stripping and Man-in-the-Middle attacks (RFC 6797).",
    owaspMapping: "A05:2021 - Security Misconfiguration / CWE-319",
    evaluator: (value) => {
      if (!value) {
        return {
          present: false,
          compliant: false,
          risk: "critical",
          recommendation:
            "Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
        };
      }
      const valLower = value.toLowerCase();
      const maxAgeMatch = valLower.match(/max-age=(\d+)/);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      const hasSubdomains = valLower.includes("includesubdomains");

      if (maxAge < 15552000) {
        return {
          present: true,
          compliant: false,
          risk: "warning",
          recommendation: "Increase HSTS max-age to at least 31536000 (1 year) and include includeSubDomains.",
        };
      }
      if (!hasSubdomains) {
        return {
          present: true,
          compliant: true,
          risk: "info",
          recommendation: "Consider adding 'includeSubDomains' and 'preload' for complete perimeter HSTS protection.",
        };
      }
      return {
        present: true,
        compliant: true,
        risk: "secure",
        recommendation: "HSTS is properly configured with long max-age and subdomain coverage.",
      };
    },
  },
  {
    headerName: "content-security-policy",
    description: "Restricts execution of unauthorized scripts, preventing Cross-Site Scripting (XSS) and data injection.",
    owaspMapping: "A03:2021 - Injection / CWE-79",
    evaluator: (value) => {
      if (!value) {
        return {
          present: false,
          compliant: false,
          risk: "critical",
          recommendation:
            "Implement a strict Content-Security-Policy (CSP) restricting script-src, object-src, and default-src.",
        };
      }
      const valLower = value.toLowerCase();
      if (valLower.includes("'unsafe-inline'") || valLower.includes("'unsafe-eval'")) {
        return {
          present: true,
          compliant: false,
          risk: "warning",
          recommendation:
            "CSP contains 'unsafe-inline' or 'unsafe-eval' directives which weaken defense against XSS exploitation.",
        };
      }
      return {
        present: true,
        compliant: true,
        risk: "secure",
        recommendation: "Strict CSP directives detected.",
      };
    },
  },
  {
    headerName: "x-frame-options",
    description: "Controls whether the site can be embedded in <frame>, <iframe>, or <embed> elements, mitigating UI Redressing / Clickjacking.",
    owaspMapping: "A05:2021 - Security Misconfiguration / CWE-1021",
    evaluator: (value) => {
      if (!value) {
        return {
          present: false,
          compliant: false,
          risk: "warning",
          recommendation: "Set X-Frame-Options: DENY or X-Frame-Options: SAMEORIGIN to prevent Clickjacking.",
        };
      }
      const valUpper = value.trim().toUpperCase();
      if (valUpper === "DENY" || valUpper === "SAMEORIGIN") {
        return {
          present: true,
          compliant: true,
          risk: "secure",
          recommendation: `Frame restriction active: ${valUpper}.`,
        };
      }
      return {
        present: true,
        compliant: false,
        risk: "warning",
        recommendation: `Value '${value}' may be non-standard or deprecated. Prefer DENY or SAMEORIGIN.`,
      };
    },
  },
  {
    headerName: "x-content-type-options",
    description: "Prevents MIME-type sniffing where browsers execute files masquerading as harmless types.",
    owaspMapping: "A05:2021 - Security Misconfiguration / CWE-430",
    evaluator: (value) => {
      if (!value) {
        return {
          present: false,
          compliant: false,
          risk: "warning",
          recommendation: "Set X-Content-Type-Options: nosniff to stop MIME confusion attacks.",
        };
      }
      if (value.toLowerCase().includes("nosniff")) {
        return {
          present: true,
          compliant: true,
          risk: "secure",
          recommendation: "MIME sniffing protection enabled (nosniff).",
        };
      }
      return {
        present: true,
        compliant: false,
        risk: "warning",
        recommendation: "Invalid X-Content-Type-Options value. Must be 'nosniff'.",
      };
    },
  },
  {
    headerName: "referrer-policy",
    description: "Governs how much referrer information (URL parameters, paths) is included with requests.",
    owaspMapping: "A01:2021 - Broken Access Control / CWE-200",
    evaluator: (value) => {
      if (!value) {
        return {
          present: false,
          compliant: false,
          risk: "info",
          recommendation: "Set Referrer-Policy: strict-origin-when-cross-origin to prevent leakage of internal query parameters.",
        };
      }
      const valLower = value.toLowerCase();
      if (valLower.includes("unsafe-url")) {
        return {
          present: true,
          compliant: false,
          risk: "warning",
          recommendation: "Unsafe-url leaks full URL paths and parameters across origins. Change to strict-origin-when-cross-origin.",
        };
      }
      return {
        present: true,
        compliant: true,
        risk: "secure",
        recommendation: `Referrer policy '${value}' is active.`,
      };
    },
  },
  {
    headerName: "permissions-policy",
    description: "Enables or disables browser features and APIs (camera, microphone, geolocation) to minimize target exploitation surface.",
    owaspMapping: "A05:2021 - Security Misconfiguration / CWE-16",
    evaluator: (value) => {
      if (!value) {
        return {
          present: false,
          compliant: false,
          risk: "info",
          recommendation: "Define Permissions-Policy to explicitly disallow sensitive client APIs (e.g., camera=(), microphone=(), geolocation=()).",
        };
      }
      return {
        present: true,
        compliant: true,
        risk: "secure",
        recommendation: "Permissions-Policy is active.",
      };
    },
  },
];

/**
 * Probes whether plaintext HTTP is automatically redirected to secure HTTPS (RFC 6797).
 */
async function checkHttpsRedirect(domain: string, timeoutMs = 650): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`http://${domain}`, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "SHADOR-OSINT-Recon-Engine/1.0",
      },
    });

    clearTimeout(timer);
    const location = res.headers.get("location");
    const status = res.status;

    if ([301, 302, 307, 308].includes(status) && location && location.toLowerCase().startsWith("https://")) {
      return true;
    }
    return false;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

/**
 * Passively probes RFC 9116 /.well-known/security.txt for coordinated vulnerability disclosure.
 */
async function checkSecurityTxt(domain: string, timeoutMs = 650): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`https://${domain}/.well-known/security.txt`, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "SHADOR-OSINT-Recon-Engine/1.0",
        Accept: "text/plain,*/*",
      },
    });

    clearTimeout(timer);
    if (!res.ok) return false;

    const text = await res.text();
    // RFC 9116 mandatory field is Contact:
    return text.toLowerCase().includes("contact:");
  } catch {
    clearTimeout(timer);
    return false;
  }
}

/**
 * Audits HTTP response headers of the target edge.
 */
export async function auditHeaders(domain: string, timeoutMs = 800): Promise<HeadersAuditResult> {
  const auditedHeaders: Record<string, HeaderAuditItem> = {};
  const criticalMissing: string[] = [];

  let rawHeaders: Record<string, string> = {};

  // Concurrently dispatch primary header fetch, HTTPS redirect check, and RFC 9116 security.txt probe
  const [headerFetchPromise, httpsRedirectPromise, securityTxtPromise] = await Promise.allSettled([
    (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 600);
      try {
        const response = await fetch(`https://${domain}`, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          headers: {
            "User-Agent": "SHADOR-OSINT-Recon-Engine/1.0",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        clearTimeout(timer);
        const headersMap: Record<string, string> = {};
        response.headers.forEach((val, key) => {
          headersMap[key.toLowerCase()] = val;
        });
        return headersMap;
      } catch {
        clearTimeout(timer);
        return {};
      }
    })(),
    checkHttpsRedirect(domain, 650),
    checkSecurityTxt(domain, 650),
  ]);

  if (headerFetchPromise.status === "fulfilled") {
    rawHeaders = headerFetchPromise.value;
  }

  const forcesHttpsRedirect =
    httpsRedirectPromise.status === "fulfilled" ? httpsRedirectPromise.value : false;
  const hasSecurityTxt =
    securityTxtPromise.status === "fulfilled" ? securityTxtPromise.value : false;

  let totalScore = 100;

  for (const rule of SECURITY_HEADER_RULES) {
    const headerValue = rawHeaders[rule.headerName] || null;
    const evaluation = rule.evaluator(headerValue);

    auditedHeaders[rule.headerName] = {
      name: rule.headerName,
      value: headerValue,
      present: evaluation.present,
      compliant: evaluation.compliant,
      description: rule.description,
      owaspMapping: rule.owaspMapping,
      recommendation: evaluation.recommendation,
      risk: evaluation.risk,
    };

    if (!evaluation.present) {
      if (evaluation.risk === "critical") {
        totalScore -= 25;
        criticalMissing.push(rule.headerName);
      } else if (evaluation.risk === "warning") {
        totalScore -= 15;
      } else {
        totalScore -= 5;
      }
    } else if (!evaluation.compliant) {
      if (evaluation.risk === "warning") {
        totalScore -= 10;
      }
    }
  }

  // Deduct points if HTTP does not automatically force redirect to HTTPS
  if (!forcesHttpsRedirect) {
    totalScore -= 10;
  }

  const finalScore = Math.max(0, Math.min(100, totalScore));
  let status: RiskLevel = "secure";

  if (finalScore < 50 || criticalMissing.length >= 2) {
    status = "critical";
  } else if (finalScore < 80 || criticalMissing.length === 1) {
    status = "warning";
  }

  return {
    score: finalScore,
    status,
    auditedHeaders,
    rawHeaders,
    missingCount: Object.values(auditedHeaders).filter((h) => !h.present).length,
    criticalMissing,
    hasSecurityTxt,
    forcesHttpsRedirect,
  };
}
