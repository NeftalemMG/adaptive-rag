"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/",       icon: "◈", label: "Dashboard",    desc: "Upload · Query · Live DB" },
  { href: "/logs",   icon: "≡", label: "Processing Log", desc: "Live ingestion feed" },
  { href: "/schema", icon: "⬡", label: "DB Schema",    desc: "pgvector table & index" },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside style={{
      width: 230,
      background: "#080808",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      padding: "1.5rem 0.85rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0, left: 0,
      height: "100vh",
      overflowY: "auto",
      zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{ padding: "0 0.6rem", marginBottom: "2rem" }}>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "1.1rem",
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}>
          Adaptive<span style={{ color: "#3b82f6" }}>RAG</span>
        </div>
        <div style={{
          fontSize: "0.6rem",
          color: "#374151",
          marginTop: 5,
          letterSpacing: "0.1em",
          fontFamily: "'JetBrains Mono', monospace",
        }}>LOCAL · PRIVATE</div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {nav.map(item => {
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              padding: "0.6rem 0.65rem",
              borderRadius: 9,
              textDecoration: "none",
              background: active ? "rgba(59,130,246,0.12)" : "transparent",
              border: active ? "1px solid rgba(59,130,246,0.24)" : "1px solid transparent",
              transition: "all 0.13s",
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                <span style={{ fontSize: "0.75rem", color: active ? "#60a5fa" : "#374151", lineHeight: 1 }}>{item.icon}</span>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: active ? "#ffffff" : "#9ca3af",
                  letterSpacing: "-0.01em",
                }}>{item.label}</span>
              </div>
              <div style={{
                fontSize: "0.62rem",
                color: active ? "#60a5fa" : "#374151",
                paddingLeft: "1.3rem",
                fontFamily: "'JetBrains Mono', monospace",
              }}>{item.desc}</div>
            </Link>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Backend status indicator */}
      <div style={{
        padding: "0.75rem 0.65rem",
        borderRadius: 9,
        background: "#0c0c0c",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ fontSize: "0.6rem", color: "#374151", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, letterSpacing: "0.08em" }}>BACKEND</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
          <span style={{ fontSize: "0.68rem", color: "#6b7280", fontFamily: "'JetBrains Mono',monospace" }}>:8000</span>
        </div>
        <div style={{ fontSize: "0.6rem", color: "#1f2937", marginTop: 5, fontFamily: "'JetBrains Mono',monospace" }}>pgvector · Gemma-2b</div>
      </div>
    </aside>
  );
}
