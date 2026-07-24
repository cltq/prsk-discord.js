"use client";

import { useEffect, useState } from "react";

interface CommandEntry {
  name: string;
  description: string;
}

interface StatusData {
  status: string;
  uptime: number;
  servers: number;
  users: number;
  commands: CommandEntry[];
  owner: string;
  timestamp: number;
}

function formatUptime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value}</span>
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (res.ok && active) {
          setData(await res.json());
        }
      } catch {
        if (active) setData(null);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const online = data?.status === "Online";
  const dotColor = online ? "#22c55e" : "#ef4444";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={{ ...styles.dot, background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
          <span style={styles.title}>prsk-bot</span>
        </div>

        <div style={styles.grid}>
          <Row label="Status" value={data?.status ?? "Loading..."} />
          <Row label="Uptime" value={data ? formatUptime(data.uptime) : "—"} />
          <Row label="Servers" value={data ? data.servers.toLocaleString() : "—"} />
          <Row label="Users" value={data ? data.users.toLocaleString() : "—"} />
          <Row label="Owner" value={data?.owner ?? "—"} />
        </div>

        <div style={styles.sectionTitle}>Commands</div>
        <div style={styles.grid}>
          {data && data.commands.length > 0 ? (
            data.commands.map((cmd) => (
              <div key={cmd.name} style={styles.row}>
                <span style={styles.commandName}>/{cmd.name}</span>
                <span style={styles.commandDesc}>{cmd.description}</span>
              </div>
            ))
          ) : (
            <div style={styles.row}>
              <span style={styles.label}>{data ? "No commands loaded" : "Loading..."}</span>
            </div>
          )}
        </div>

        <div style={styles.footer}>prsk-bot status</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif',
    background: "#0a0a0a",
    color: "#fafafa",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: 480,
    padding: "2rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "2.5rem",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  title: {
    fontSize: "1.125rem",
    fontWeight: 600,
    letterSpacing: "-0.02em",
  },
  sectionTitle: {
    fontSize: "0.75rem",
    color: "#525252",
    fontWeight: 500,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    marginTop: "2rem",
    marginBottom: "0.75rem",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    background: "#1a1a1a",
    border: "1px solid #1a1a1a",
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.875rem 1rem",
    background: "#0a0a0a",
  },
  label: {
    fontSize: "0.8125rem",
    color: "#737373",
    fontWeight: 400,
  },
  value: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    color: "#a3a3a3",
  },
  commandName: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "#d4d4d4",
    fontVariantNumeric: "tabular-nums",
  },
  commandDesc: {
    fontSize: "0.75rem",
    color: "#525252",
    fontWeight: 400,
    textAlign: "right" as const,
    maxWidth: "55%",
  },
  footer: {
    marginTop: "2rem",
    textAlign: "center",
    fontSize: "0.6875rem",
    color: "#404040",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  },
};
