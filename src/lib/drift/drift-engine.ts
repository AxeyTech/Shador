/**
 * ShadowTrace - Infrastructure Drift & Historical Diff Engine (FR-10)
 * Evaluates structural mutations, newly surfaced or decommissioned subdomains, and posture drift over time.
 */

import type { CompleteScanResult, InfrastructureDrift } from "../types/scanner";

export function computeInfrastructureDrift(
  current: CompleteScanResult,
  previous: CompleteScanResult
): InfrastructureDrift {
  const currentSubs = new Set(current.subdomains.subdomains.map((s) => s.domain.toLowerCase()));
  const previousSubs = new Set(previous.subdomains.subdomains.map((s) => s.domain.toLowerCase()));

  // 1. Subdomain Drift
  const newSubdomains: string[] = [];
  for (const sub of currentSubs) {
    if (!previousSubs.has(sub)) {
      newSubdomains.push(sub);
    }
  }

  const decommissionedSubdomains: string[] = [];
  for (const sub of previousSubs) {
    if (!currentSubs.has(sub)) {
      decommissionedSubdomains.push(sub);
    }
  }

  // 2. DNS & Policy Drift
  const dnsChanges: string[] = [];

  // Check MX changes
  const currMx = current.dns.records.mx.map((m) => m.exchange).sort().join(",");
  const prevMx = previous.dns.records.mx.map((m) => m.exchange).sort().join(",");
  if (currMx !== prevMx) {
    dnsChanges.push(`Mail Exchanger (MX) altered from [${prevMx || "None"}] to [${currMx || "None"}].`);
  }

  // Check SPF changes
  if (current.emailSpoof.spf.mechanism !== previous.emailSpoof.spf.mechanism) {
    dnsChanges.push(
      `SPF policy mechanism changed from '${previous.emailSpoof.spf.mechanism}' to '${current.emailSpoof.spf.mechanism}'.`
    );
  }

  // Check DMARC changes
  if (current.emailSpoof.dmarc.policy !== previous.emailSpoof.dmarc.policy) {
    dnsChanges.push(
      `DMARC enforcement policy changed from '${previous.emailSpoof.dmarc.policy}' to '${current.emailSpoof.dmarc.policy}'.`
    );
  }

  // 3. SSL/TLS Expiration Drift
  const sslDaysDelta = current.tls.daysRemaining - previous.tls.daysRemaining;
  if (previous.tls.hasTls && !current.tls.hasTls) {
    dnsChanges.push("CRITICAL: TLS listener on port 443 is no longer responding.");
  } else if (!previous.tls.hasTls && current.tls.hasTls) {
    dnsChanges.push("HTTPS cryptographic listener on port 443 has been provisioned.");
  }

  // 4. IP Perimeter Shifts
  const currentIps = new Set((current.network?.primaryIps || []).map((n) => n.ip));
  const previousIps = new Set((previous.network?.primaryIps || []).map((n) => n.ip));
  const ipShifts: { ip: string; status: "added" | "removed" | "retained" }[] = [];

  for (const ip of currentIps) {
    if (!previousIps.has(ip)) {
      ipShifts.push({ ip, status: "added" });
    } else {
      ipShifts.push({ ip, status: "retained" });
    }
  }
  for (const ip of previousIps) {
    if (!currentIps.has(ip)) {
      ipShifts.push({ ip, status: "removed" });
    }
  }

  // 5. Tech Stack Mutations
  const techStackMutations: string[] = [];
  const currentTechNames = new Set((current.techStack?.detectedTechnologies || []).map((t) => t.name));
  const previousTechNames = new Set((previous.techStack?.detectedTechnologies || []).map((t) => t.name));

  for (const t of currentTechNames) {
    if (!previousTechNames.has(t)) {
      techStackMutations.push(`New component emerged: ${t}`);
    }
  }
  for (const t of previousTechNames) {
    if (!currentTechNames.has(t)) {
      techStackMutations.push(`Component deprecated / removed: ${t}`);
    }
  }

  // 6. Composite Risk Score Delta
  const riskScoreDelta = current.score.score - previous.score.score;
  const securityTrajectory =
    riskScoreDelta < 0 ? "improved" : riskScoreDelta > 0 ? "degraded" : "stable";

  const hasDrift =
    newSubdomains.length > 0 ||
    decommissionedSubdomains.length > 0 ||
    dnsChanges.length > 0 ||
    ipShifts.some((s) => s.status !== "retained") ||
    techStackMutations.length > 0 ||
    Math.abs(riskScoreDelta) >= 5;

  let summary = "No significant infrastructure drift detected since prior audit.";
  if (hasDrift) {
    const parts: string[] = [];
    if (newSubdomains.length > 0) parts.push(`${newSubdomains.length} new subdomain(s) surfaced`);
    if (decommissionedSubdomains.length > 0) parts.push(`${decommissionedSubdomains.length} subdomain(s) removed`);
    if (dnsChanges.length > 0) parts.push(`${dnsChanges.length} DNS/email rule alteration(s)`);
    if (techStackMutations.length > 0) parts.push(`${techStackMutations.length} technology stack shift(s)`);
    if (riskScoreDelta > 0) parts.push(`Risk increased by +${riskScoreDelta} points`);
    else if (riskScoreDelta < 0) parts.push(`Security improved by ${riskScoreDelta} points`);

    summary = `Infrastructure Drift Detected: ${parts.join(", ")}.`;
  }

  return {
    previousScanId: previous.id,
    previousScanTimestamp: previous.sanitizedAt,
    hasDrift,
    newSubdomains,
    decommissionedSubdomains,
    dnsChanges,
    sslDaysDelta,
    riskScoreDelta,
    summary,
    previousGrade: previous.score.letterGrade,
    currentGrade: current.score.letterGrade,
    previousRiskScore: previous.score.score,
    currentRiskScore: current.score.score,
    ipShifts,
    techStackMutations,
    securityTrajectory,
  };
}
