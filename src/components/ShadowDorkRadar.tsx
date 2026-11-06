"use client";

import React, { useState } from "react";
import {
  Compass,
  Search,
  ExternalLink,
  Copy,
  Check,
  Key,
  ShieldAlert,
  FolderGit2,
  Server,
  Terminal,
  Filter,
} from "lucide-react";
import { useTacticalAudio } from "@/lib/audio/AudioContext";

interface DorkItem {
  id: string;
  category: "secrets" | "admin" | "github" | "intel";
  name: string;
  query: string;
  engine: "google" | "github" | "shodan" | "wayback" | "censys";
  description: string;
  urlBuilder: (domain: string) => string;
}

interface ShadowDorkRadarProps {
  targetDomain: string;
}

export function ShadowDorkRadar({ targetDomain }: ShadowDorkRadarProps) {
  const { playClick, playDownload } = useTacticalAudio();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState("");

  const dorks: DorkItem[] = [
    // 1. Secrets & Sensitive Configs
    {
      id: "dork-env",
      category: "secrets",
      name: "Environment Files (.env / .git / .yml)",
      query: `site:${targetDomain} ext:env OR ext:yml OR ext:yaml OR ext:json "DB_PASSWORD"`,
      engine: "google",
      description: "Search for exposed production environment configs and secrets on edge endpoints.",
      urlBuilder: (d) =>
        `https://www.google.com/search?q=${encodeURIComponent(
          `site:${d} ext:env OR ext:yml OR ext:yaml OR ext:json "DB_PASSWORD"`
        )}`,
    },
    {
      id: "dork-sql-backup",
      category: "secrets",
      name: "Database Backups & SQL Dumps",
      query: `site:${targetDomain} ext:sql OR ext:dump OR ext:bak OR ext:backup OR ext:tar.gz`,
      engine: "google",
      description: "Discover unindexed backup archives and database snapshot files.",
      urlBuilder: (d) =>
        `https://www.google.com/search?q=${encodeURIComponent(
          `site:${d} ext:sql OR ext:dump OR ext:bak OR ext:backup OR ext:tar.gz`
        )}`,
    },
    {
      id: "dork-git-exposed",
      category: "secrets",
      name: "Exposed .git Repository Directory",
      query: `site:${targetDomain} inurl:.git/HEAD OR inurl:.git/config`,
      engine: "google",
      description: "Locate leaked source control directories allowing source code reconstruction.",
      urlBuilder: (d) =>
        `https://www.google.com/search?q=${encodeURIComponent(
          `site:${d} inurl:.git/HEAD OR inurl:.git/config`
        )}`,
    },
    {
      id: "dork-logs",
      category: "secrets",
      name: "Server Logs & Stack Traces",
      query: `site:${targetDomain} ext:log OR inurl:debug OR inurl:trace "exception"`,
      engine: "google",
      description: "Extract stack traces, debug consoles, and unhandled exception logs.",
      urlBuilder: (d) =>
        `https://www.google.com/search?q=${encodeURIComponent(
          `site:${d} ext:log OR inurl:debug OR inurl:trace "exception"`
        )}`,
    },

    // 2. Admin & High-Value Ingress
    {
      id: "dork-admin-panels",
      category: "admin",
      name: "Administrative Login & Dashboards",
      query: `site:${targetDomain} inurl:admin | inurl:login | inurl:dashboard | inurl:portal`,
      engine: "google",
      description: "Pinpoint perimeter login gateways and administrative consoles.",
      urlBuilder: (d) =>
        `https://www.google.com/search?q=${encodeURIComponent(
          `site:${d} inurl:admin | inurl:login | inurl:dashboard | inurl:portal`
        )}`,
    },
    {
      id: "dork-cpanel",
      category: "admin",
      name: "cPanel / Webmin / phpMyAdmin",
      query: `site:${targetDomain} inurl:cpanel | inurl:phpmyadmin | inurl:webmin | inurl:kibana`,
      engine: "google",
      description: "Identify database managers and infrastructure hosting control panels.",
      urlBuilder: (d) =>
        `https://www.google.com/search?q=${encodeURIComponent(
          `site:${d} inurl:cpanel | inurl:phpmyadmin | inurl:webmin | inurl:kibana`
        )}`,
    },
    {
      id: "dork-api-swagger",
      category: "admin",
      name: "Swagger / GraphQL / API Documentation",
      query: `site:${targetDomain} inurl:swagger | inurl:graphql | inurl:api-docs | inurl:v1/api`,
      engine: "google",
      description: "Surface public Swagger UI instances and GraphQL schema exploration endpoints.",
      urlBuilder: (d) =>
        `https://www.google.com/search?q=${encodeURIComponent(
          `site:${d} inurl:swagger | inurl:graphql | inurl:api-docs | inurl:v1/api`
        )}`,
    },
    {
      id: "dork-staging",
      category: "admin",
      name: "Staging, QA & Pre-Prod Subdomains",
      query: `site:${targetDomain} inurl:staging | inurl:test | inurl:uat | inurl:dev | inurl:beta`,
      engine: "google",
      description: "Enumerate pre-production environments frequently lacking security headers.",
      urlBuilder: (d) =>
        `https://www.google.com/search?q=${encodeURIComponent(
          `site:${d} inurl:staging | inurl:test | inurl:uat | inurl:dev | inurl:beta`
        )}`,
    },

    // 3. GitHub Code Leaks
    {
      id: "dork-gh-keys",
      category: "github",
      name: "GitHub API Keys & Tokens",
      query: `"${targetDomain}" "API_KEY" OR "AWS_SECRET_ACCESS_KEY" OR "PRIVATE KEY"`,
      engine: "github",
      description: "Discover API keys, AWS credentials, and SSH keys committed to GitHub.",
      urlBuilder: (d) =>
        `https://github.com/search?q=${encodeURIComponent(
          `"${d}" "API_KEY" OR "AWS_SECRET_ACCESS_KEY" OR "PRIVATE KEY"`
        )}&type=code`,
    },
    {
      id: "dork-gh-passwords",
      category: "github",
      name: "GitHub Database Passwords & DSNs",
      query: `"${targetDomain}" "mongodb://" OR "postgres://" OR "mysql://"`,
      engine: "github",
      description: "Scan GitHub public repos for hardcoded database connection strings.",
      urlBuilder: (d) =>
        `https://github.com/search?q=${encodeURIComponent(
          `"${d}" "mongodb://" OR "postgres://" OR "mysql://"`
        )}&type=code`,
    },
    {
      id: "dork-gh-auth",
      category: "github",
      name: "GitHub Bearer Tokens & Webhooks",
      query: `"${targetDomain}" "Authorization: Bearer" OR "x-api-key"`,
      engine: "github",
      description: "Detect live authorization tokens in scripts, tests, and CI/CD pipelines.",
      urlBuilder: (d) =>
        `https://github.com/search?q=${encodeURIComponent(
          `"${d}" "Authorization: Bearer" OR "x-api-key"`
        )}&type=code`,
    },

    // 4. Recon & Port Intelligence (Shodan, Wayback, Censys)
    {
      id: "dork-shodan-origin",
      category: "intel",
      name: "Shodan SSL Cert Origin Bypass",
      query: `ssl.cert.subject.CN:"${targetDomain}" 200`,
      engine: "shodan",
      description: "Unmask the real backend origin IP hiding behind Cloudflare or Akamai WAF.",
      urlBuilder: (d) =>
        `https://www.shodan.io/search?query=${encodeURIComponent(
          `ssl.cert.subject.CN:"${d}" 200`
        )}`,
    },
    {
      id: "dork-shodan-host",
      category: "intel",
      name: "Shodan Open Ports & Fingerprints",
      query: `hostname:"${targetDomain}"`,
      engine: "shodan",
      description: "Inspect exposed ports (SSH, RDP, Redis, Elasticsearch) on target infrastructure.",
      urlBuilder: (d) =>
        `https://www.shodan.io/search?query=${encodeURIComponent(`hostname:"${d}"`)}`,
    },
    {
      id: "dork-wayback-archive",
      category: "intel",
      name: "Wayback Historical Endpoint URLs",
      query: `web.archive.org/web/*/${targetDomain}/*`,
      engine: "wayback",
      description: "Explore deprecated endpoints, forgotten files, and historical parameter trees.",
      urlBuilder: (d) => `https://web.archive.org/web/*/${encodeURIComponent(d)}/*`,
    },
    {
      id: "dork-censys-certs",
      category: "intel",
      name: "Censys Autonomous Host Graph",
      query: `services.tls.certificates.leaf_data.names: "${targetDomain}"`,
      engine: "censys",
      description: "Map IPv4/IPv6 host perimeters presenting target TLS certificates globally.",
      urlBuilder: (d) =>
        `https://search.censys.io/search?resource=hosts&q=${encodeURIComponent(
          `services.tls.certificates.leaf_data.names: "${d}"`
        )}`,
    },
  ];

  const handleCopy = (id: string, text: string) => {
    playDownload();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getEngineBadge = (engine: DorkItem["engine"]) => {
    switch (engine) {
      case "google":
        return {
          label: "Google Dork",
          style: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        };
      case "github":
        return {
          label: "GitHub Leak",
          style: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        };
      case "shodan":
        return {
          label: "Shodan Recon",
          style: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        };
      case "wayback":
        return {
          label: "Wayback Archive",
          style: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        };
      case "censys":
        return {
          label: "Censys Graph",
          style: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
        };
    }
  };

  const filteredDorks = dorks.filter((d) => {
    const matchesCat = selectedCategory === "all" || d.category === selectedCategory;
    const matchesSearch =
      searchFilter === "" ||
      d.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.query.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div
        className="rounded-2xl border border-white/[0.1] p-4 sm:p-5 shadow-xl relative overflow-hidden"
        style={{ backgroundColor: "#070b16", opacity: 1 }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                ShadowDork OSINT Recon Radar
                <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 px-2 py-0.5 rounded-full uppercase">
                  16 Tactical Dorks
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Automated Google dorks, GitHub code leak queries, and Shodan origin unmasking tailored for{" "}
                <span className="text-white font-mono font-semibold">{targetDomain}</span>.
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[11px] font-mono text-slate-300 bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-xl">
              Target: <span className="text-cyan-300 font-bold">{targetDomain}</span>
            </span>
          </div>
        </div>

        {/* Category Filters & Keyword Search Bar */}
        <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {[
              { id: "all", label: "All Vectors", icon: Filter },
              { id: "secrets", label: "Secrets & Configs", icon: Key },
              { id: "admin", label: "Admin & Gateways", icon: ShieldAlert },
              { id: "github", label: "GitHub Leaks", icon: FolderGit2 },
              { id: "intel", label: "Shodan & Wayback", icon: Server },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    playClick();
                    setSelectedCategory(cat.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-bold"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter dork queries..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/[0.1] bg-[#0c1020] text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Dorks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredDorks.map((dork) => {
          const badge = getEngineBadge(dork.engine);
          const isCopied = copiedId === dork.id;
          const liveUrl = dork.urlBuilder(targetDomain);

          return (
            <div
              key={dork.id}
              className="rounded-xl border border-white/[0.08] p-4 flex flex-col justify-between hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.12)] transition-all group"
              style={{ backgroundColor: "#0b0f1d", opacity: 1 }}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {dork.name}
                  </span>
                  <span
                    className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${badge.style}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-400 font-sans mb-3 line-clamp-2">
                  {dork.description}
                </p>

                {/* Query Block */}
                <div className="relative rounded-lg border border-white/[0.08] bg-[#060813] p-2.5 font-mono text-xs text-cyan-300 break-all select-all">
                  <code>{dork.query}</code>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 mt-3.5 pt-2.5 border-t border-white/[0.06]">
                <button
                  onClick={() => handleCopy(dork.id, dork.query)}
                  className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-lg border border-white/[0.1] bg-[#080b15] text-slate-300 hover:text-white hover:border-white/[0.2] transition-colors"
                  title="Copy dork to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-400" />
                      <span>Copy Dork</span>
                    </>
                  )}
                </button>

                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playClick()}
                  className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25 hover:border-cyan-400 transition-all font-semibold shadow-sm"
                  title={`Launch ${badge.label} query in new tab`}
                >
                  <span>Execute Search</span>
                  <ExternalLink className="h-3 w-3 text-cyan-400" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}