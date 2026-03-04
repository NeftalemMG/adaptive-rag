"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function NotFound() {
  const [glitch, setGlitch] = useState(false);
  const [cursor, setCursor] = useState(true);
  const [typed, setTyped] = useState("");
  const msg = "ERROR: vector lookup returned 0 results for route";

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < msg.length) { setTyped(msg.slice(0, i + 1)); i++; }
      else clearInterval(t);
    }, 35);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCursor(c => !c), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Newsreader:ital,opsz,wght@1,6..72,300&display=swap');

        .nf-root {
          min-height: 100vh;
          background: #050709;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          position: relative;
          overflow: hidden;
        }

        /* Grain */
        .nf-root::before {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 1; opacity: 0.7;
        }

        /* Subtle grid background */
        .nf-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(90,138,171,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(90,138,171,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* Radial vignette */
        .nf-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, #050709 100%);
          pointer-events: none;
        }

        .nf-content {
          position: relative; z-index: 10;
          max-width: 620px; width: 100%; padding: 2rem;
          text-align: left;
        }

        /* Cluster dots visual */
        .nf-cluster-vis {
          margin-bottom: 2.5rem;
          position: relative;
          height: 90px;
        }

        @keyframes glitch-1 {
          0%,100%{transform:none;opacity:1}
          7%{transform:skewX(-8deg) translateX(4px);opacity:0.85}
          14%{transform:none;opacity:1}
        }
        @keyframes glitch-2 {
          0%,100%{clip-path:none;transform:none}
          7%{clip-path:inset(20% 0 60% 0);transform:translateX(-6px)}
          14%{clip-path:none;transform:none}
        }
        @keyframes drift {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)}
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanLine { from{transform:translateX(-100%)} to{transform:translateX(200%)} }

        .glitch-wrap { position: relative; display: inline-block; }
        .glitch-main { animation: ${glitch ? 'glitch-1 0.15s steps(1,end)' : 'none'}; }
        .glitch-layer {
          position: absolute; top: 0; left: 0;
          animation: ${glitch ? 'glitch-2 0.15s steps(1,end)' : 'none'};
          color: rgba(143,79,79,0.6);
          pointer-events: none;
        }

        .big-404 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(5rem, 15vw, 9rem);
          font-weight: 800;
          letter-spacing: -0.06em;
          line-height: 1;
          color: rgba(90,138,171,0.12);
          position: absolute;
          right: -1rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          user-select: none;
        }

        .terminal-box {
          background: #08090f;
          border: 1px solid rgba(120,135,160,0.09);
          border-radius: 10px;
          padding: 1.1rem 1.25rem;
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
        }
        .terminal-box::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(90,138,171,0.04), transparent);
          animation: scanLine 3s ease-in-out infinite;
        }

        .t-header {
          display: flex; align-items: center; gap: 0.5rem;
          margin-bottom: 0.85rem;
          padding-bottom: 0.7rem;
          border-bottom: 1px solid rgba(120,135,160,0.07);
        }
        .t-dot { width: 8px; height: 8px; border-radius: 50%; }

        .t-line { font-size: 0.72rem; line-height: 1.75; }
        .t-prompt { color: rgba(90,138,171,0.55); margin-right: 0.5rem; }
        .t-cmd    { color: #697888; }
        .t-out    { color: #8f4f4f; }
        .t-ok     { color: #2f7355; }

        .nf-heading {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem; font-weight: 700;
          letter-spacing: -0.03em;
          color: #b8c6dc;
          margin-bottom: 0.5rem;
          animation: fadeUp 0.5s 0.2s both;
        }
        .nf-heading em {
          font-style: italic;
          font-family: 'Newsreader', serif;
          font-weight: 300;
          color: rgba(90,138,171,0.8);
        }

        .nf-sub {
          font-size: 0.73rem; color: #3e4a5a;
          margin-bottom: 2rem; line-height: 1.6;
          animation: fadeUp 0.5s 0.3s both;
        }

        .nf-actions {
          display: flex; gap: 0.75rem; flex-wrap: wrap;
          animation: fadeUp 0.5s 0.4s both;
        }

        .btn-primary {
          background: rgba(90,138,171,0.12);
          border: 1px solid rgba(90,138,171,0.22);
          color: rgba(90,138,171,0.9);
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.78rem;
          text-decoration: none; cursor: pointer;
          transition: all 0.15s; display: inline-flex; align-items: center; gap: 0.4rem;
          letter-spacing: 0.02em;
        }
        .btn-primary:hover { background: rgba(90,138,171,0.18); border-color: rgba(90,138,171,0.35); transform: translateY(-1px); }

        .btn-ghost {
          background: transparent;
          border: 1px solid rgba(120,135,160,0.09);
          color: #697888;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-family: 'DM Mono', monospace; font-size: 0.75rem;
          text-decoration: none; cursor: pointer;
          transition: all 0.15s; display: inline-flex; align-items: center; gap: 0.4rem;
        }
        .btn-ghost:hover { border-color: rgba(120,135,160,0.18); color: #b8c6dc; }

        .nf-suggestions {
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(120,135,160,0.07);
          animation: fadeUp 0.5s 0.5s both;
        }
        .nf-sug-label { font-size: 0.6rem; color: #3e4a5a; text-transform: uppercase; letter-spacing: 0.12em; font-family: 'Syne',sans-serif; font-weight:700; margin-bottom: 0.75rem; }
        .nf-sug-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .nf-sug-item {
          display: flex; align-items: center; gap: 0.55rem;
          padding: 0.5rem 0.65rem;
          border-radius: 7px;
          border: 1px solid rgba(120,135,160,0.07);
          background: rgba(8,9,15,0.5);
          text-decoration: none;
          transition: all 0.13s;
        }
        .nf-sug-item:hover { background: rgba(90,138,171,0.06); border-color: rgba(90,138,171,0.16); }
        .nf-sug-icon { font-size: 0.85rem; opacity: 0.5; width: 16px; text-align: center; }
        .nf-sug-text { font-size: 0.7rem; color: #697888; }
        .nf-sug-item:hover .nf-sug-text { color: #b8c6dc; }
      `}</style>

      <div className="nf-root">
        <div className="nf-grid"/>
        <div className="nf-vignette"/>

        {/* Floating cluster visualisation */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {/* Scattered dots suggesting a failed k-means cluster */}
          {[
            {x:"15%",y:"20%",r:3,op:0.06,d:0},{x:"18%",y:"28%",r:2,op:0.04,d:1},
            {x:"12%",y:"35%",r:4,op:0.05,d:2},{x:"82%",y:"15%",r:3,op:0.05,d:1},
            {x:"88%",y:"22%",r:2,op:0.04,d:3},{x:"85%",y:"30%",r:3,op:0.06,d:0},
            {x:"78%",y:"70%",r:2,op:0.04,d:2},{x:"20%",y:"75%",r:3,op:0.05,d:1},
            {x:"10%",y:"65%",r:2,op:0.04,d:3},{x:"90%",y:"65%",r:3,op:0.05,d:2},
          ].map((dot,i) => (
            <div key={i} style={{
              position:"absolute", left:dot.x, top:dot.y,
              width:dot.r*2, height:dot.r*2, borderRadius:"50%",
              background:"rgba(90,138,171,0.4)", opacity:dot.op,
              animation:`drift ${3+dot.d}s ease-in-out infinite`,
              animationDelay:`${dot.d*0.7}s`,
            }}/>
          ))}
        </div>

        <div className="nf-content">
          <div style={{ position:"relative", marginBottom:"2rem" }}>
            <div className="big-404" aria-hidden>404</div>

            {/* Terminal box */}
            <div className="terminal-box">
              <div className="t-header">
                <div className="t-dot" style={{background:"#8f4f4f",opacity:0.8}}/>
                <div className="t-dot" style={{background:"#a07d45",opacity:0.8}}/>
                <div className="t-dot" style={{background:"#2f7355",opacity:0.8}}/>
                <span style={{fontSize:"0.62rem",color:"#3e4a5a",marginLeft:"0.5rem"}}>adaptive-rag — query</span>
              </div>
              <div className="t-line">
                <span className="t-prompt">›</span>
                <span className="t-cmd">pgvector.search(route=&quot;{typeof window !== 'undefined' ? window.location.pathname : '/unknown'}&quot;, k=5)</span>
              </div>
              <div className="t-line" style={{marginTop:"0.3rem"}}>
                <span className="t-prompt">↳</span>
                <span className="t-out">KMeans convergence failed — variance(E) → ∞ — no centroids stored</span>
              </div>
              <div className="t-line" style={{marginTop:"0.3rem"}}>
                <span className="t-prompt">↳</span>
                <span style={{color:"#3e4a5a"}}>{typed}<span style={{opacity:cursor?1:0,borderRight:"1.5px solid #5a8aab"}}>&nbsp;</span></span>
              </div>
              <div className="t-line" style={{marginTop:"0.3rem"}}>
                <span className="t-prompt">↳</span>
                <span className="t-out">MaxSim score: 0.000  ·  results: []  ·  recall@5: N/A</span>
              </div>
              <div className="t-line" style={{marginTop:"0.3rem"}}>
                <span className="t-prompt">↳</span>
                <span className="t-ok">Suggestion: return to a known cluster centroid ↓</span>
              </div>
            </div>
          </div>

          <div className="glitch-wrap">
            <div className={`nf-heading glitch-main`}>
              Page not <em>indexed</em>
            </div>
            {glitch && <div className="nf-heading glitch-layer" aria-hidden>Page not indexed</div>}
          </div>

          <div className="nf-sub">
            The requested route produced zero representative centroids. Either this page doesn&apos;t exist, or k-means assigned it k=0 — which shouldn&apos;t be possible, yet here we are.
          </div>

          <div className="nf-actions">
            <Link href="/" className="btn-primary">
              ◈ Return to Dashboard
            </Link>
            <Link href="/query" className="btn-ghost">
              ◎ Query Interface
            </Link>
            <Link href="/clustering" className="btn-ghost">
              ⟁ Clustering Runs
            </Link>
          </div>

          <div className="nf-suggestions">
            <div className="nf-sug-label">Known Cluster Centroids — Navigate To</div>
            <div className="nf-sug-grid">
              {[
                { href:"/document-index", icon:"⬡", label:"Document Index"  },
                { href:"/cost-model",     icon:"⊞", label:"Cost Model"       },
                { href:"/beir",           icon:"≋", label:"BEIR Benchmarks"  },
                { href:"/ablation",       icon:"∿", label:"Ablation Studies"  },
                { href:"/pgvector",       icon:"⬡", label:"pgvector / HNSW"  },
                { href:"/llm",            icon:"◌", label:"Gemma-2b LLM"     },
              ].map(s => (
                <Link key={s.href} href={s.href} className="nf-sug-item">
                  <span className="nf-sug-icon">{s.icon}</span>
                  <span className="nf-sug-text">{s.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
