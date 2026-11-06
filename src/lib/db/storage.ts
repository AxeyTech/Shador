/**
 * ShadowTrace - Unified Resilient Storage Manager (FR-9 & FR-10)
 * Dual-Mode persistence: Persists to Supabase PostgreSQL (with RLS) when configured,
 * or falls back to high-speed in-memory repository for zero-dependency local execution.
 */

import { getServiceRoleClient } from "../supabase/server";
import { computeInfrastructureDrift } from "../drift/drift-engine";
import type { CompleteScanResult, InfrastructureDrift } from "../types/scanner";

// In-Memory store for offline/local resilience across server requests
interface MemoryStore {
  scans: Map<string, CompleteScanResult>;
  domainIndex: Map<string, string[]>; // domain -> scanIds sorted by time
}

declare global {
  // eslint-disable-next-line no-var
  var __shadorStore: MemoryStore | undefined;
  // eslint-disable-next-line no-var
  var __shadowTraceStore: MemoryStore | undefined;
}

if (!globalThis.__shadorStore) {
  globalThis.__shadorStore = globalThis.__shadowTraceStore || {
    scans: new Map<string, CompleteScanResult>(),
    domainIndex: new Map<string, string[]>(),
  };
  globalThis.__shadowTraceStore = globalThis.__shadorStore;
}

const memoryStore = globalThis.__shadorStore;

/**
 * Persists completed reconnaissance audit snapshot.
 */
export async function saveScanRecord(
  scan: CompleteScanResult,
  userId?: string | null
): Promise<{ scan: CompleteScanResult; drift: InfrastructureDrift | null }> {
  // 1. Check for prior snapshot of same domain to compute infrastructure drift (FR-10)
  const priorScan = await getLatestScanForDomain(scan.targetDomain);
  let drift: InfrastructureDrift | null = null;

  if (priorScan && priorScan.id !== scan.id) {
    drift = computeInfrastructureDrift(scan, priorScan);
    scan.drift = drift;

    // Highlight newly surfaced subdomains on topology nodes with dynamic indicator
    if (drift.newSubdomains.length > 0) {
      scan.topology.nodes.forEach((node) => {
        if (node.data.type === "subdomain") {
          const fqdn = `${node.data.label}.${scan.targetDomain}`;
          if (drift?.newSubdomains.includes(fqdn)) {
            node.data.isDriftNew = true;
            node.data.subtitle = "Newly Surfaced!";
            node.data.severity = "warning";
          }
        }
      });
    }
  }

  // 2. Always persist into memory cache first
  memoryStore.scans.set(scan.id, scan);
  const domainKey = scan.targetDomain.toLowerCase();
  const domainScans = memoryStore.domainIndex.get(domainKey) || [];
  if (!domainScans.includes(scan.id)) {
    domainScans.unshift(scan.id);
    memoryStore.domainIndex.set(domainKey, domainScans);
  }

  // 3. Persist to Supabase if credentials are provided
  const supabase = getServiceRoleClient();
  if (supabase) {
    try {
      await supabase.from("scans").upsert({
        id: scan.id,
        user_id: userId || null,
        target_domain: scan.targetDomain,
        status: "completed",
        risk_score: scan.score.score,
        letter_grade: scan.score.letterGrade,
        is_public: true,
        execution_time_ms: scan.executionTimeMs,
        dns_data: scan.dns,
        email_spoof: scan.emailSpoof,
        subdomains_data: scan.subdomains,
        tls_data: scan.tls,
        headers_data: scan.headers,
        ai_analysis: scan.aiAnalysis,
        graph_topology: scan.topology,
        drift_data: drift,
        created_at: scan.sanitizedAt,
      });

      // Insert diagnostic logs batch
      if (scan.logs && scan.logs.length > 0) {
        const logEntries = scan.logs.map((l) => ({
          scan_id: scan.id,
          log_level: l.level,
          category: l.category,
          message: l.message,
          duration_ms: l.durationMs || 0,
          created_at: l.timestamp,
        }));
        await supabase.from("scan_logs").insert(logEntries);
      }
    } catch {
      // Supabase write error handled gracefully; in-memory store remains authoritative
    }
  }

  return { scan, drift };
}

/**
 * Fetches an immutable audit snapshot by scanId (UUID).
 */
export async function getScanById(scanId: string): Promise<CompleteScanResult | null> {
  // Check memory store first for sub-millisecond retrieval
  if (memoryStore.scans.has(scanId)) {
    return memoryStore.scans.get(scanId) || null;
  }

  // Fallback to Supabase PostgreSQL
  const supabase = getServiceRoleClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .eq("id", scanId)
        .single();

      if (!error && data) {
        const scanResult: CompleteScanResult = {
          id: data.id,
          targetDomain: data.target_domain,
          sanitizedAt: data.created_at,
          executionTimeMs: data.execution_time_ms || 0,
          dns: data.dns_data,
          emailSpoof: data.email_spoof,
          subdomains: data.subdomains_data,
          tls: data.tls_data,
          headers: data.headers_data,
          score: {
            score: data.risk_score,
            letterGrade: data.letter_grade,
            title: data.ai_analysis?.postureGrade || "Audit Snapshot",
            summary: data.ai_analysis?.executiveSummary || "",
            categoryScores: {
              dns: 10,
              emailSpoof: data.email_spoof?.score || 0,
              subdomains: 0,
              tls: data.tls_data?.status === "critical" ? 100 : 10,
              headers: 100 - (data.headers_data?.score || 50),
            },
          },
          aiAnalysis: data.ai_analysis,
          topology: data.graph_topology,
          logs: [],
          drift: data.drift_data,
        };

        // Cache in memory for subsequent rapid queries
        memoryStore.scans.set(scanResult.id, scanResult);
        return scanResult;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Fetches the most recent prior scan for a domain to compute infrastructure drift.
 */
export async function getLatestScanForDomain(domain: string): Promise<CompleteScanResult | null> {
  const domainKey = domain.toLowerCase();

  // Check memory index
  const scanIds = memoryStore.domainIndex.get(domainKey);
  if (scanIds && scanIds.length > 0) {
    const latestId = scanIds[0];
    return memoryStore.scans.get(latestId) || null;
  }

  // Check Supabase
  const supabase = getServiceRoleClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("scans")
        .select("id")
        .eq("target_domain", domainKey)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data?.id) {
        return getScanById(data.id);
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Fetches recent audit history for user dashboard or public exploration.
 */
export async function getRecentScans(limit = 10): Promise<
  Array<{
    id: string;
    targetDomain: string;
    letterGrade: string;
    riskScore: number;
    sanitizedAt: string;
    executionTimeMs: number;
  }>
> {
  const supabase = getServiceRoleClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("scans")
        .select("id, target_domain, letter_grade, risk_score, created_at, execution_time_ms")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          targetDomain: d.target_domain,
          letterGrade: d.letter_grade || "A",
          riskScore: d.risk_score || 0,
          sanitizedAt: d.created_at,
          executionTimeMs: d.execution_time_ms || 0,
        }));
      }
    } catch {
      // Fallback to memory store below
    }
  }

  // Memory store fallback
  const scans = Array.from(memoryStore.scans.values());
  scans.sort((a, b) => new Date(b.sanitizedAt).getTime() - new Date(a.sanitizedAt).getTime());

  return scans.slice(0, limit).map((s) => ({
    id: s.id,
    targetDomain: s.targetDomain,
    letterGrade: s.score.letterGrade,
    riskScore: s.score.score,
    sanitizedAt: s.sanitizedAt,
    executionTimeMs: s.executionTimeMs,
  }));
}
