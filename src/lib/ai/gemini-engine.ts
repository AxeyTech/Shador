/**
 * ShadowTrace - Cognitive AI Threat Synthesizer (FR-7)
 * Powered by Google Gemini (@google/genai) with automated deterministic local fallback.
 */

import { GoogleGenAI } from "@google/genai";
import { generateLocalHeuristicAnalysis } from "./local-heuristic";
import type {
  AiThreatAnalysis,
  DnsRecordData,
  EmailSpoofability,
  HeadersAuditResult,
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

export async function synthesizeThreatIntelligence(ctx: ReconContext): Promise<AiThreatAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If no API key provided or key is too short,
  // immediately execute the deterministic local heuristic engine with 0ms latency.
  if (!apiKey || apiKey.length < 20) {
    return generateLocalHeuristicAnalysis(ctx);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are the primary cognitive threat intelligence engine for SHADOR, an enterprise External Attack Surface Management (EASM) and OSINT platform.
Analyze the following passive reconnaissance findings for the target domain: "${ctx.domain}".

=== RECONNAISSANCE TELEMETRY ===
- Target Domain: ${ctx.domain}
- Calculated Composite Risk Score: ${ctx.score.score}/100 (Preliminary Grade: ${ctx.score.letterGrade})
- Wildcard DNS: ${ctx.dns.records.hasWildcardDns ? "ACTIVE (*.domain resolves)" : "NONE"}
- Email Spoofability:
  * SPF Mechanism: ${ctx.emailSpoof.spf.mechanism} (Raw: ${ctx.emailSpoof.spf.raw || "None"})
  * SPF DNS Lookups: ${ctx.emailSpoof.spf.lookupCount}/10 (RFC 7208 PermError: ${ctx.emailSpoof.spf.exceedsLookupLimit ? "YES - Invalidated" : "NO"})
  * DMARC Policy: ${ctx.emailSpoof.dmarc.policy} (Raw: ${ctx.emailSpoof.dmarc.raw || "None"})
  * MTA-STS (RFC 8461): ${ctx.emailSpoof.hasMtaSts ? "ACTIVE" : "UNCONFIGURED"}
  * BIMI (RFC 8617): ${ctx.emailSpoof.hasBimi ? "CONFIGURED" : "UNCONFIGURED"}
  * Direct Spoofing Possible: ${ctx.emailSpoof.canSpoofDirectly ? "YES - Critical Threat" : "NO"}
- Subdomain Attack Surface:
  * Total Discovered: ${ctx.subdomains.discoveredCount} (Wildcard Filtered: ${ctx.subdomains.isWildcardFiltered ? "YES" : "NO"})
  * Dangling CNAME Takeovers: ${ctx.subdomains.danglingTakeoversFound}
  * Dangling Details: ${JSON.stringify(ctx.subdomains.subdomains.filter((s) => s.isDangling))}
- SSL/TLS Cryptographic Posture:
  * Protocol: ${ctx.tls.protocol || "None"}
  * Days Remaining: ${ctx.tls.daysRemaining} days
  * Cipher Suite: ${ctx.tls.cipherSuite || "None"}
  * Expired: ${ctx.tls.isExpired} | Expiring Soon: ${ctx.tls.isExpiringSoon} | Self-Signed: ${ctx.tls.isSelfSigned}
- HTTP Edge Security Headers:
  * Score: ${ctx.headers.score}/100
  * HTTPS Redirection Enforced: ${ctx.headers.forcesHttpsRedirect ? "YES (Strict 301/308)" : "NO - Insecure Plaintext HTTP Accessible"}
  * RFC 9116 security.txt Present: ${ctx.headers.hasSecurityTxt ? "YES" : "NO - Missing Coordinated Disclosure"}
  * Missing Count: ${ctx.headers.missingCount}
  * Critical Missing: ${ctx.headers.criticalMissing.join(", ") || "None"}

=== REQUIRED OUTPUT FORMAT ===
You MUST return ONLY valid JSON (no surrounding markdown code blocks, no other text). All text fields must be clean natural text (NEVER use markdown asterisks ** or heading hashtags ###). The JSON must match this exact schema:
{
  "executiveSummary": "2-3 sentences summarizing the enterprise attack surface and defensive posture in clean plain text.",
  "postureGrade": "A" | "B" | "C" | "D" | "F",
  "attackChainNarrative": "A detailed 3 to 4-step attack narrative illustrating how an adversary could chain these specific vulnerabilities (e.g. Step 1: Reconnaissance - Details. Step 2: Weaponization - Details. Step 3: Delivery - Details. Step 4: Exploitation - Details). Output clean text without markdown asterisks.",
  "keyFindings": ["string bullet point 1", "string bullet point 2", "string bullet point 3"],
  "remediationPlans": [
    {
      "id": "rem-1",
      "title": "Clear action title",
      "category": "DNS" | "EMAIL" | "TLS" | "HEADERS" | "SUBDOMAINS",
      "riskLevel": "critical" | "warning" | "info",
      "language": "nginx" | "dns" | "bash" | "markdown",
      "codeSnippet": "Ready to copy-paste configuration block",
      "instructions": "Clear step-by-step guidance for system administrators"
    }
  ]
}
`;

    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("Gemini AI synthesis timeout")), 20000);
    });

    // Call Google Gemini 2.5 Flash model with 20s race timeout and zero-latency thinking budget
    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
          temperature: 0.1,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
      timeoutPromise,
    ]);

    clearTimeout(timer!);

    const text = response.text || "";
    let parsed: Record<string, unknown> = {};

    try {
      const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        parsed = JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } else {
        throw new Error("Unable to parse structured cognitive response from AI");
      }
    }

    return {
      executiveSummary: typeof parsed.executiveSummary === "string" ? parsed.executiveSummary : ctx.score.summary,
      postureGrade:
        typeof parsed.postureGrade === "string" && ["A", "B", "C", "D", "F"].includes(parsed.postureGrade)
          ? (parsed.postureGrade as "A" | "B" | "C" | "D" | "F")
          : ctx.score.letterGrade,
      attackChainNarrative:
        typeof parsed.attackChainNarrative === "string" ? parsed.attackChainNarrative : "Threat modeling complete.",
      keyFindings: Array.isArray(parsed.keyFindings) ? (parsed.keyFindings as string[]) : [],
      remediationPlans: Array.isArray(parsed.remediationPlans) ? (parsed.remediationPlans as unknown as AiThreatAnalysis["remediationPlans"]) : [],
      isFallback: false,
      engineUsed: "Threat Intelligence Engine",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Gemini AI Synthesis Error]:", errorMsg);
    return generateLocalHeuristicAnalysis(ctx);
  }
}
