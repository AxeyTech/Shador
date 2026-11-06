import { NextRequest, NextResponse } from "next/server";
import { executeShadowTraceRecon } from "@/lib/scanner/orchestrator";

// ANSI Terminal Color Codes
const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
  bgBlack: "\x1b[40m",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain") || searchParams.get("d") || searchParams.get("target");

  if (!domain) {
    const usage = `
${ANSI.cyan}${ANSI.bold}╔═══════════════════════════════════════════════════════════════╗
║                          SHADOR CLI                           ║
║        Interactive Attack Surface & OSINT Recon Engine        ║
╚═══════════════════════════════════════════════════════════════╝${ANSI.reset}

${ANSI.yellow}Usage:${ANSI.reset}
  curl -s "${req.nextUrl.origin}/api/cli?domain=target.com"
  curl -s "${req.nextUrl.origin}/api/cli?d=example.com"

${ANSI.magenta}Features:${ANSI.reset}
  • Sub-second autonomous RFC perimeter DNS & SPF/DMARC auditing
  • Certificate Transparency & Dangling CNAME takeover discovery
  • TLS 1.3 socket handshake & cipher resilience inspection
  • Autonomous BGP ASN detection & Cloudflare origin bypass radar
`;
    return new NextResponse(usage, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const scan = await executeShadowTraceRecon(domain);

    const gradeColor =
      scan.score.letterGrade === "A"
        ? ANSI.green
        : scan.score.letterGrade === "B"
        ? ANSI.cyan
        : scan.score.letterGrade === "C"
        ? ANSI.yellow
        : ANSI.red;

    const banner = `
${ANSI.cyan}${ANSI.bold}   _____ __  _____     ____  ____  ____ 
  / ___// / / /   |   / __ \\/ __ \\/ __ \\
  \\__ \\/ /_/ / /| |  / / / / / / / /_/ /
 ___/ / __  / ___ | / /_/ / /_/ / _, _/ 
/____/_/ /_/_/  |_|/_____/\\____/_/ |_|  ${ANSI.reset}
${ANSI.dim}         Autonomous Attack Surface & Reconnaissance Engine        ${ANSI.reset}
─────────────────────────────────────────────────────────────────
${ANSI.bold}TARGET DOMAIN:${ANSI.reset}   ${ANSI.cyan}${scan.targetDomain}${ANSI.reset}
${ANSI.bold}POSTURE GRADE:${ANSI.reset}   ${gradeColor}[${scan.score.letterGrade}] (Risk Index: ${scan.score.score}/100)${ANSI.reset}
${ANSI.bold}STATUS TITLE:${ANSI.reset}    ${scan.score.title}
${ANSI.bold}EXECUTION TIME:${ANSI.reset}  ${scan.executionTimeMs}ms
─────────────────────────────────────────────────────────────────

${ANSI.bold}${ANSI.magenta}[+] EMAIL AUTHENTICATION & SPOOFING (RFC 7208 / 7489)${ANSI.reset}
  • SPF Mechanism:       ${scan.emailSpoof.spf?.mechanism || "None"} (${scan.emailSpoof.spf?.isHardened ? ANSI.green + "Hardened" : ANSI.red + "Vulnerable"}${ANSI.reset})
  • DMARC Policy:        ${scan.emailSpoof.dmarc?.policy || "Missing"} (${scan.emailSpoof.dmarc?.policy === "reject" ? ANSI.green + "Strict Rejection" : ANSI.yellow + "Non-Enforcing"}${ANSI.reset})
  • Direct Spoofability: ${scan.emailSpoof.canSpoofDirectly ? ANSI.red + "YES - HIGH RISK" : ANSI.green + "PROTECTED"}${ANSI.reset}

${ANSI.bold}${ANSI.cyan}[+] CRYPTOGRAPHIC TLS POSTURE${ANSI.reset}
  • Protocol & Cipher:   ${scan.tls.protocol || "Unknown"} / ${scan.tls.cipherSuite || "Unknown"}
  • Certificate Expiry:  ${scan.tls.daysRemaining} days remaining (${scan.tls.validTo || "N/A"})
  • Trust Chain Status:  ${scan.tls.isExpired ? ANSI.red + "EXPIRED" : scan.tls.isSelfSigned ? ANSI.yellow + "SELF-SIGNED" : ANSI.green + "VALID & TRUSTED"}${ANSI.reset}

${ANSI.bold}${ANSI.yellow}[+] SUBDOMAIN & TAKEOVER INTELLIGENCE${ANSI.reset}
  • Discovered Assets:   ${scan.subdomains.discoveredCount} subdomains
  • Dangling Takeovers:  ${scan.subdomains.danglingTakeoversFound > 0 ? ANSI.red + scan.subdomains.danglingTakeoversFound + " CRITICAL TAKE-OVERS FOUND" : ANSI.green + "0 Dangling Aliases"}${ANSI.reset}

${ANSI.bold}${ANSI.blue}[+] NETWORK PERIMETER & WAF RADAR${ANSI.reset}
  • Primary BGP ASN:     ${scan.network?.primaryAsn?.asn || "AS-Unknown"} (${scan.network?.primaryAsn?.organization || "Unknown"})
  • Anycast Protection:  ${scan.network?.isAnycastProtected ? ANSI.green + "Active Anycast Edge" : ANSI.yellow + "Unicast Direct Ingress"}${ANSI.reset}
  • WAF / Reverse Proxy: ${scan.originBypass?.isBehindWaf ? ANSI.cyan + scan.originBypass.wafProvider : ANSI.yellow + "Direct Origin (No WAF)"}${ANSI.reset}
  • Leaked Origin IPs:   ${scan.originBypass?.candidates && scan.originBypass.candidates.length > 0 ? ANSI.red + scan.originBypass.candidates.length + " Candidate IPs" : ANSI.green + "None Detected"}${ANSI.reset}

${ANSI.bold}${ANSI.green}[+] EXECUTIVE DOSSIER PERMALINK${ANSI.reset}
  ${req.nextUrl.origin}/report/${scan.id}

─────────────────────────────────────────────────────────────────
${ANSI.dim}Generated by SHADOR • IEEE Std 830-1998 Tactical Telemetry${ANSI.reset}
`;

    return new NextResponse(banner, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    const errorMsg = `
${ANSI.red}[!] Scan Failed:${ANSI.reset} ${error instanceof Error ? error.message : "Internal reconnaissance engine exception"}
`;
    return new NextResponse(errorMsg, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
