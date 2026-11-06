/**
 * ShadowTrace - Passive Technology Stack Fingerprint Engine (FR-13)
 * Standard: IEEE Std 830-1998 Tactical OSINT & Web Application Profiling
 * 
 * Inspects passive HTTP response telemetry, server tokens, custom proxy headers,
 * cookie signatures, and DNS delegations without sending invasive requests.
 */

import type { DnsRecordData, HeadersAuditResult, TechStackItem, TechStackResult, ThreatHorizonItem } from "../types/scanner";

interface SignatureRule {
  name: string;
  category: TechStackItem["category"];
  source: TechStackItem["source"];
  description: string;
  matcher: (headers: Record<string, string>, dns: DnsRecordData) => { detected: boolean; version?: string | null; confidence: number };
}

const SIGNATURE_REGISTRY: SignatureRule[] = [
  // --- WEB SERVERS ---
  {
    name: "Nginx",
    category: "Web Server",
    source: "header",
    description: "High-performance asynchronous HTTP reverse proxy & edge server.",
    matcher: (headers) => {
      const server = headers["server"] || "";
      if (/nginx/i.test(server)) {
        const match = server.match(/nginx\/([0-9.]+)/i);
        return { detected: true, version: match ? match[1] : null, confidence: 98 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Apache HTTP Server",
    category: "Web Server",
    source: "header",
    description: "Modular Unix/Linux open-source web daemon (httpd).",
    matcher: (headers) => {
      const server = headers["server"] || "";
      if (/apache/i.test(server)) {
        const match = server.match(/apache\/([0-9.]+)/i);
        return { detected: true, version: match ? match[1] : null, confidence: 95 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "LiteSpeed Web Server",
    category: "Web Server",
    source: "header",
    description: "High-throughput drop-in Apache replacement optimized for caching.",
    matcher: (headers) => {
      const server = headers["server"] || "";
      if (/litespeed/i.test(server)) {
        return { detected: true, version: null, confidence: 95 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Microsoft IIS",
    category: "Web Server",
    source: "header",
    description: "Microsoft Internet Information Services enterprise Windows web server.",
    matcher: (headers) => {
      const server = headers["server"] || "";
      if (/microsoft-iis/i.test(server)) {
        const match = server.match(/microsoft-iis\/([0-9.]+)/i);
        return { detected: true, version: match ? match[1] : null, confidence: 99 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Caddy",
    category: "Web Server",
    source: "header",
    description: "Modern Go-based web server with automatic TLS certificate automation.",
    matcher: (headers) => {
      const server = headers["server"] || "";
      if (/caddy/i.test(server)) {
        return { detected: true, version: null, confidence: 95 };
      }
      return { detected: false, confidence: 0 };
    },
  },

  // --- CDN & REVERSE PROXIES ---
  {
    name: "Cloudflare Edge",
    category: "CDN & Edge Proxy",
    source: "header",
    description: "Global Anycast reverse proxy, DDoS mitigation, and edge compute fabric.",
    matcher: (headers) => {
      const hasCfRay = Boolean(headers["cf-ray"]);
      const hasCfCache = Boolean(headers["cf-cache-status"]);
      const server = headers["server"] || "";
      if (hasCfRay || hasCfCache || /cloudflare/i.test(server)) {
        return { detected: true, version: "Edge v4", confidence: 100 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Amazon CloudFront",
    category: "CDN & Edge Proxy",
    source: "header",
    description: "AWS low-latency content delivery network with integrated Shield DDoS protection.",
    matcher: (headers) => {
      const hasAmzCf = Boolean(headers["x-amz-cf-id"]) || Boolean(headers["x-amz-cf-pop"]);
      const via = headers["via"] || "";
      if (hasAmzCf || /cloudfront/i.test(via)) {
        return { detected: true, version: "AWS Global Edge", confidence: 98 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Fastly Edge Cloud",
    category: "CDN & Edge Proxy",
    source: "header",
    description: "Real-time edge cloud CDN powered by Varnish Cache architecture.",
    matcher: (headers) => {
      const hasFastly = Boolean(headers["x-fastly-request-id"]) || Boolean(headers["fastly-restarts"]);
      if (hasFastly) {
        return { detected: true, version: "Varnish Edge", confidence: 99 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Akamai EdgeSuite",
    category: "CDN & Edge Proxy",
    source: "header",
    description: "Distributed intelligent enterprise content delivery and security perimeter.",
    matcher: (headers) => {
      const server = headers["server"] || "";
      const hasAkamai = Boolean(headers["x-akamai-transformed"]) || /akamaighost/i.test(server);
      if (hasAkamai) {
        return { detected: true, version: "Ghost", confidence: 98 };
      }
      return { detected: false, confidence: 0 };
    },
  },

  // --- CMS & PLATFORMS ---
  {
    name: "WordPress",
    category: "CMS",
    source: "header",
    description: "Open-source PHP-based content management and blogging ecosystem.",
    matcher: (headers) => {
      const generator = headers["x-generator"] || headers["generator"] || "";
      const cookie = headers["set-cookie"] || "";
      const link = headers["link"] || "";
      if (/wordpress/i.test(generator) || /wp-json/i.test(link) || /wp-settings/i.test(cookie)) {
        const match = generator.match(/wordpress\s*([0-9.]+)/i);
        return { detected: true, version: match ? match[1] : null, confidence: 95 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Shopify",
    category: "CMS",
    source: "header",
    description: "Cloud-hosted multi-tenant global e-commerce platform.",
    matcher: (headers, dns) => {
      const server = headers["server"] || "";
      const xShop = Boolean(headers["x-shopid"]) || Boolean(headers["x-shardid"]);
      const cnameMatch = (dns.cname || []).some((c) => /myshopify\.com/i.test(c));
      if (/shopify/i.test(server) || xShop || cnameMatch) {
        return { detected: true, version: "Cloud Hosted", confidence: 100 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Drupal",
    category: "CMS",
    source: "header",
    description: "Modular enterprise open-source web content management framework.",
    matcher: (headers) => {
      const drupalCache = headers["x-drupal-cache"] || headers["x-drupal-dynamic-cache"];
      const generator = headers["x-generator"] || "";
      if (drupalCache || /drupal/i.test(generator)) {
        const match = generator.match(/drupal\s*([0-9.]+)/i);
        return { detected: true, version: match ? match[1] : null, confidence: 96 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Ghost",
    category: "CMS",
    source: "header",
    description: "Headless Node.js publishing platform tailored for online creators.",
    matcher: (headers) => {
      const ghost = headers["x-ghost-cache-status"];
      const generator = headers["x-generator"] || "";
      if (ghost || /ghost/i.test(generator)) {
        return { detected: true, version: null, confidence: 92 };
      }
      return { detected: false, confidence: 0 };
    },
  },

  // --- BACKEND RUNTIMES & FRAMEWORKS ---
  {
    name: "PHP",
    category: "Backend Framework",
    source: "header",
    description: "Server-side scripting engine executing dynamic web applications.",
    matcher: (headers) => {
      const powered = headers["x-powered-by"] || "";
      const cookie = headers["set-cookie"] || "";
      if (/php/i.test(powered) || /phpsessid/i.test(cookie)) {
        const match = powered.match(/php\/([0-9.]+)/i);
        return { detected: true, version: match ? match[1] : null, confidence: 95 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "ASP.NET",
    category: "Backend Framework",
    source: "header",
    description: "Microsoft open-source server-side web application framework.",
    matcher: (headers) => {
      const powered = headers["x-powered-by"] || "";
      const aspnet = headers["x-aspnet-version"] || headers["x-aspnetmvc-version"];
      if (/asp\.net/i.test(powered) || aspnet) {
        return { detected: true, version: aspnet || null, confidence: 97 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Node.js Express",
    category: "Backend Framework",
    source: "header",
    description: "Minimalist asynchronous web server framework for Node.js.",
    matcher: (headers) => {
      const powered = headers["x-powered-by"] || "";
      const cookie = headers["set-cookie"] || "";
      if (/express/i.test(powered) || /connect\.sid/i.test(cookie)) {
        return { detected: true, version: null, confidence: 90 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Django / Python",
    category: "Backend Framework",
    source: "cookie",
    description: "High-level Python web framework encouraging rapid clean design.",
    matcher: (headers) => {
      const cookie = headers["set-cookie"] || "";
      if (/csrftoken/i.test(cookie) || /sessionid/i.test(cookie)) {
        return { detected: true, version: "Python WSGI", confidence: 80 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Laravel / PHP",
    category: "Backend Framework",
    source: "cookie",
    description: "Modern expressive PHP web framework with MVC architecture.",
    matcher: (headers) => {
      const cookie = headers["set-cookie"] || "";
      if (/laravel_session/i.test(cookie) || /xsrf-token/i.test(cookie)) {
        return { detected: true, version: null, confidence: 88 };
      }
      return { detected: false, confidence: 0 };
    },
  },

  // --- MODERN WEB RUNTIMES & FULL-STACK FRAMEWORKS ---
  {
    name: "Next.js",
    category: "Backend Framework",
    source: "header",
    description: "Production hybrid React framework for static generation and server-side rendering.",
    matcher: (headers) => {
      const powered = headers["x-powered-by"] || "";
      const matchedPath = headers["x-matched-path"] || "";
      const vercel = headers["x-vercel-id"] || "";
      if (/next\.js/i.test(powered) || matchedPath || /nextjs/i.test(vercel)) {
        return { detected: true, version: "React SSR / RSC", confidence: 98 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Nuxt.js",
    category: "Backend Framework",
    source: "header",
    description: "Intuitive Vue.js hybrid framework for universal and static applications.",
    matcher: (headers) => {
      const powered = headers["x-powered-by"] || "";
      if (/nuxt/i.test(powered)) {
        return { detected: true, version: "Vue SSR", confidence: 95 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Ruby on Rails",
    category: "Backend Framework",
    source: "cookie",
    description: "Full-stack server-side web application framework in Ruby adhering to CoC.",
    matcher: (headers) => {
      const cookie = headers["set-cookie"] || "";
      const rack = headers["x-rack-cache"] || headers["x-runtime"] || "";
      if (/_session_id/i.test(cookie) || rack) {
        return { detected: true, version: "Ruby Rack", confidence: 88 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Spring Boot / Java",
    category: "Backend Framework",
    source: "cookie",
    description: "Enterprise Java microservice framework with standalone production-grade runtime.",
    matcher: (headers) => {
      const cookie = headers["set-cookie"] || "";
      const server = headers["server"] || "";
      if (/jsessionid/i.test(cookie) || /tomcat|jetty/i.test(server)) {
        return { detected: true, version: "Java JVM", confidence: 90 };
      }
      return { detected: false, confidence: 0 };
    },
  },

  // --- ENTERPRISE PROXIES & INGRESS CONTROLLERS ---
  {
    name: "HAProxy",
    category: "CDN & Edge Proxy",
    source: "header",
    description: "High-performance TCP/HTTP load balancer and reverse proxy engine.",
    matcher: (headers) => {
      const server = headers["server"] || "";
      const via = headers["via"] || "";
      if (/haproxy/i.test(server) || /haproxy/i.test(via)) {
        return { detected: true, version: "Layer 7 Ingress", confidence: 96 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Envoy Proxy",
    category: "CDN & Edge Proxy",
    source: "header",
    description: "Cloud-native high-performance edge and service proxy designed for microservices.",
    matcher: (headers) => {
      const server = headers["server"] || "";
      const hasEnvoy = Boolean(headers["x-envoy-upstream-service-time"]) || Boolean(headers["x-envoy-decorator-operation"]);
      if (/envoy/i.test(server) || hasEnvoy) {
        return { detected: true, version: "Cloud Native Mesh", confidence: 98 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Traefik Proxy",
    category: "CDN & Edge Proxy",
    source: "header",
    description: "Cloud-native HTTP reverse proxy and ingress controller written in Go.",
    matcher: (headers) => {
      const server = headers["server"] || "";
      if (/traefik/i.test(server)) {
        return { detected: true, version: "Dynamic Ingress", confidence: 95 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "F5 BIG-IP",
    category: "Security & WAF",
    source: "cookie",
    description: "Enterprise application delivery controller, hardware SSL offloader, and advanced WAF.",
    matcher: (headers) => {
      const cookie = headers["set-cookie"] || "";
      const server = headers["server"] || "";
      if (/bigipserver|ts[a-z0-9]{6,}/i.test(cookie) || /big-ip/i.test(server)) {
        return { detected: true, version: "ADC / ASM", confidence: 99 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Varnish Cache",
    category: "CDN & Edge Proxy",
    source: "header",
    description: "High-speed HTTP accelerator and reverse proxy caching architecture.",
    matcher: (headers) => {
      const varnish = headers["x-varnish"] || "";
      const via = headers["via"] || "";
      if (varnish || /varnish/i.test(via)) {
        return { detected: true, version: "VCL Engine", confidence: 98 };
      }
      return { detected: false, confidence: 0 };
    },
  },

  // --- SERVERLESS & HYPERSCALE PLATFORMS ---
  {
    name: "Vercel Edge Network",
    category: "CDN & Edge Proxy",
    source: "header",
    description: "Global serverless edge network optimized for Next.js frontend deployments.",
    matcher: (headers) => {
      const hasVercel = Boolean(headers["x-vercel-id"]) || Boolean(headers["x-vercel-cache"]);
      const server = headers["server"] || "";
      if (hasVercel || /vercel/i.test(server)) {
        return { detected: true, version: "Global Edge", confidence: 100 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Netlify Edge",
    category: "CDN & Edge Proxy",
    source: "header",
    description: "Cloud platform for composable web architectures and automated CI/CD edge functions.",
    matcher: (headers) => {
      const hasNf = Boolean(headers["x-nf-request-id"]);
      const server = headers["server"] || "";
      if (hasNf || /netlify/i.test(server)) {
        return { detected: true, version: "Edge Mesh", confidence: 99 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Webflow",
    category: "CMS",
    source: "header",
    description: "Visual web development platform producing semantic HTML/CSS code.",
    matcher: (headers, dns) => {
      const server = headers["server"] || "";
      const isWf = Boolean(headers["x-wf-page"]) || (dns.cname || []).some((c) => /webflow/i.test(c));
      if (isWf) {
        return { detected: true, version: "Hosted Cloud", confidence: 98 };
      }
      return { detected: false, confidence: 0 };
    },
  },

  // --- SECURITY CONTROLS & WAF ---
  {
    name: "HSTS Protocol Active",
    category: "Security & WAF",
    source: "header",
    description: "Strict Transport Security enforcing cryptographic HTTPS communication.",
    matcher: (headers) => {
      if (headers["strict-transport-security"]) {
        return { detected: true, version: "RFC 6797", confidence: 100 };
      }
      return { detected: false, confidence: 0 };
    },
  },
  {
    name: "Content Security Policy (CSP)",
    category: "Security & WAF",
    source: "header",
    description: "Browser defense mechanism restricting untrusted script injections & XSS.",
    matcher: (headers) => {
      if (headers["content-security-policy"] || headers["content-security-policy-report-only"]) {
        return { detected: true, version: "W3C Level 2", confidence: 100 };
      }
      return { detected: false, confidence: 0 };
    },
  },
];

/**
 * Correlates passive technology stack telemetry against known CVE classes and CISA KEV threat indicators.
 */
function correlateThreatHorizon(detectedTechnologies: TechStackItem[]): TechStackResult["threatHorizon"] {
  const vulnerabilities: ThreatHorizonItem[] = [];
  let versionDisclosureCount = 0;
  let hardenedCount = 0;

  for (const item of detectedTechnologies) {
    const ver = item.version || "";
    const nameLower = item.name.toLowerCase();

    // Track explicit version disclosure vs hardened/masked tokens
    if (ver && !ver.includes("Cloud") && !ver.includes("RFC") && !ver.includes("W3C") && !ver.includes("Edge") && !ver.includes("Mesh")) {
      versionDisclosureCount++;
    } else {
      hardenedCount++;
    }

    // Nginx
    if (nameLower.includes("nginx")) {
      if (ver) {
        vulnerabilities.push({
          component: `Nginx (${ver})`,
          versionDisclosed: ver,
          cveId: "CVE-2021-23017",
          cvss: 7.7,
          severity: "high",
          cisaKev: false,
          attackVector: "Network / 1-Byte Heap Overflow",
          title: "Nginx Resolver 1-Byte Memory Overwrite & Crash Risk",
          description: "A 1-byte memory overwrite flaw in the resolver module allows remote attackers to crash workers or achieve denial of service via forged DNS responses.",
          passiveRemediation: "Upgrade to Nginx >= 1.20.1 and strip server tokens using 'server_tokens off;' in nginx.conf.",
        });
      } else {
        vulnerabilities.push({
          component: "Nginx (Hardened)",
          versionDisclosed: null,
          cveId: "CVE-GENERIC-NGINX",
          cvss: 3.5,
          severity: "low",
          cisaKev: false,
          attackVector: "Generic Web Server Attack Surface",
          title: "Version Obfuscated - Proactive Defense Active",
          description: "Server version tokens are masked. Direct unauthenticated automated version-targeted exploits are thwarted.",
          passiveRemediation: "Maintain current patch baseline and keep 'server_tokens off;' enforced.",
        });
      }
    }

    // Apache HTTP Server
    if (nameLower.includes("apache")) {
      if (ver) {
        vulnerabilities.push({
          component: `Apache (${ver})`,
          versionDisclosed: ver,
          cveId: "CVE-2021-41773",
          cvss: 9.8,
          severity: "critical",
          cisaKev: true,
          attackVector: "Network / Path Traversal & Remote Code Execution",
          title: "Apache HTTP Server Path Traversal & RCE (CISA KEV Listed)",
          description: "Flaw in path normalization allows remote unauthenticated actors to traverse directories and read arbitrary files or execute CGI binaries.",
          passiveRemediation: "Ensure Apache is patched >= 2.4.51 and set 'ServerTokens Prod' and 'ServerSignature Off' in httpd.conf.",
        });
      } else {
        vulnerabilities.push({
          component: "Apache (Hardened)",
          versionDisclosed: null,
          cveId: "CVE-GENERIC-HTTPD",
          cvss: 3.2,
          severity: "low",
          cisaKev: false,
          attackVector: "Generic Daemon Attack Surface",
          title: "Version Obfuscated - ServerTokens Prod Enforced",
          description: "Apache version headers are masked, mitigating opportunistic automated version scanners.",
          passiveRemediation: "Maintain latest upstream security patches.",
        });
      }
    }

    // PHP
    if (nameLower.includes("php")) {
      if (ver) {
        vulnerabilities.push({
          component: `PHP Engine (${ver})`,
          versionDisclosed: ver,
          cveId: "CVE-2024-4577",
          cvss: 9.8,
          severity: "critical",
          cisaKev: true,
          attackVector: "Network / CGI Argument Injection RCE",
          title: "PHP CGI Argument Injection Remote Code Execution",
          description: "Bypass of CVE-2012-1823 in Windows/Apache setups allows attackers to pass command line arguments to php.exe and achieve remote code execution.",
          passiveRemediation: "Upgrade PHP to >= 8.1.29 / 8.2.20 / 8.3.8 and set 'expose_php = Off' in php.ini.",
        });
      } else {
        vulnerabilities.push({
          component: "PHP (Hardened)",
          versionDisclosed: null,
          cveId: "CVE-GENERIC-PHP",
          cvss: 4.0,
          severity: "medium",
          cisaKev: false,
          attackVector: "Dynamic Scripting Surface",
          title: "PHP Version Masked ('expose_php = Off')",
          description: "PHP version disclosure headers are suppressed, preventing immediate framework reconnaissance.",
          passiveRemediation: "Keep PHP runtime updated and sanitize dynamic script entry points.",
        });
      }
    }

    // Microsoft IIS / ASP.NET
    if (nameLower.includes("iis") || nameLower.includes("asp.net")) {
      vulnerabilities.push({
        component: item.name,
        versionDisclosed: ver || null,
        cveId: "CVE-2023-38180",
        cvss: 7.5,
        severity: "high",
        cisaKev: true,
        attackVector: "Network / HTTP Protocol Parsing DoS & Smuggling",
        title: ".NET and Visual Studio Remote Denial of Service (CISA KEV Listed)",
        description: "A vulnerability in .NET runtime Kestrel and IIS processing allows unauthenticated network actors to cause high CPU or crash web pools.",
        passiveRemediation: "Apply latest cumulative Windows Server / .NET security updates and remove 'X-Powered-By' and 'X-AspNet-Version' headers in web.config.",
      });
    }

    // WordPress
    if (nameLower.includes("wordpress")) {
      vulnerabilities.push({
        component: `WordPress ${ver || "CMS"}`,
        versionDisclosed: ver || null,
        cveId: "CVE-2023-2732",
        cvss: 7.2,
        severity: "high",
        cisaKev: false,
        attackVector: "Network / REST API & Plugin Ingress Surface",
        title: "WordPress REST API User Enumeration & Attack Surface Exposure",
        description: "Public exposure of wp-json endpoints and plugin metadata allows automated enumeration of administrative usernames and vulnerable installed extensions.",
        passiveRemediation: "Disable standard author query enumeration, remove WordPress generator meta tags, and keep all plugins strictly updated.",
      });
    }

    // F5 BIG-IP
    if (nameLower.includes("big-ip")) {
      vulnerabilities.push({
        component: "F5 BIG-IP ADC",
        versionDisclosed: ver || null,
        cveId: "CVE-2022-1388",
        cvss: 9.8,
        severity: "critical",
        cisaKev: true,
        attackVector: "Network / iControl REST Auth Bypass",
        title: "F5 BIG-IP iControl REST Remote Command Execution (CISA KEV Listed)",
        description: "Missing authentication verification in iControl REST endpoint allows unauthenticated network attackers to execute arbitrary system commands.",
        passiveRemediation: "Restrict iControl REST access to internal management networks and block external port 443 management access.",
      });
    }

    // Spring Boot / Java
    if (nameLower.includes("spring")) {
      vulnerabilities.push({
        component: "Spring Framework Runtime",
        versionDisclosed: ver || null,
        cveId: "CVE-2022-22965",
        cvss: 9.8,
        severity: "critical",
        cisaKev: true,
        attackVector: "Network / Spring4Shell DataBinder RCE",
        title: "Spring Framework RCE via Data Binding (Spring4Shell)",
        description: "Allows remote attackers to execute arbitrary code via specialized HTTP request parameters that bind into JVM classLoader objects.",
        passiveRemediation: "Ensure Spring Framework is upgraded >= 5.3.18 or 5.2.20 and Java runtime >= 17.",
      });
    }
  }

  // Calculate Threat Horizon Exposure Score (0 to 100)
  // Higher = safer (less exposure).
  let exposureScore = 95;

  for (const vuln of vulnerabilities) {
    if (vuln.severity === "critical") exposureScore -= 20;
    else if (vuln.severity === "high") exposureScore -= 12;
    else if (vuln.severity === "medium") exposureScore -= 5;
    else if (vuln.severity === "low") exposureScore -= 1;
  }

  if (versionDisclosureCount > 0) {
    exposureScore -= versionDisclosureCount * 6;
  } else {
    exposureScore += 5; // Bonus for complete version stripping
  }

  exposureScore = Math.min(100, Math.max(15, exposureScore));

  const exposureGrade: "A" | "B" | "C" | "D" | "F" =
    exposureScore >= 85 ? "A" : exposureScore >= 70 ? "B" : exposureScore >= 55 ? "C" : exposureScore >= 40 ? "D" : "F";

  return {
    exposureScore,
    exposureGrade,
    vulnerabilities,
    versionDisclosureCount,
    hardenedCount,
  };
}

export function auditTechStack(
  headersResult: HeadersAuditResult,
  dnsData: DnsRecordData
): TechStackResult {
  const normalizedHeaders: Record<string, string> = {};
  for (const [key, val] of Object.entries(headersResult.rawHeaders || {})) {
    normalizedHeaders[key.toLowerCase()] = String(val);
  }
  for (const [key, item] of Object.entries(headersResult.auditedHeaders || {})) {
    if (item.value && !normalizedHeaders[key.toLowerCase()]) {
      normalizedHeaders[key.toLowerCase()] = String(item.value);
    }
  }

  const detected: TechStackItem[] = [];

  for (const rule of SIGNATURE_REGISTRY) {
    const outcome = rule.matcher(normalizedHeaders, dnsData);
    if (outcome.detected) {
      detected.push({
        name: rule.name,
        category: rule.category,
        version: outcome.version || null,
        confidence: outcome.confidence,
        iconName: rule.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
        source: rule.source,
        description: rule.description,
      });
    }
  }

  // Find primary web server
  const serverItem = detected.find((d) => d.category === "Web Server");
  const cmsItem = detected.find((d) => d.category === "CMS");
  const frameworkItem = detected.find((d) => d.category === "Backend Framework");
  const cdnItem = detected.find((d) => d.category === "CDN & Edge Proxy");

  const summary = detected.length > 0
    ? `Discovered ${detected.length} perimeter technology layers across ${serverItem?.name || "unidentified server"}, ${cmsItem ? `CMS: ${cmsItem.name}, ` : ""}${cdnItem ? `CDN: ${cdnItem.name}` : "direct origin"}.`
    : "Perimeter server tokens are hardened and stripped of standard fingerprint disclosures.";

  const threatHorizon = correlateThreatHorizon(detected);

  return {
    detectedTechnologies: detected,
    primaryServer: serverItem ? (serverItem.version ? `${serverItem.name} ${serverItem.version}` : serverItem.name) : null,
    primaryCms: cmsItem ? (cmsItem.version ? `${cmsItem.name} ${cmsItem.version}` : cmsItem.name) : null,
    primaryFramework: frameworkItem ? frameworkItem.name : null,
    cdnProvider: cdnItem ? cdnItem.name : null,
    totalIdentified: detected.length,
    summary,
    threatHorizon,
  };
}
