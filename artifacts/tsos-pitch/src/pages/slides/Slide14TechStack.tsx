export default function Slide14TechStack() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#0C0F1A",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: "relative",
        color: "#FFFFFF",
      }}
    >
      <div style={{ position: "absolute", bottom: "0", right: "0", width: "50vw", height: "50vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,107,240,0.12) 0%, rgba(124,107,240,0) 70%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "4vw 4vw", pointerEvents: "none" }} />

      <div style={{ position: "absolute", top: "5vh", left: "5vw", display: "flex", alignItems: "center", gap: "1vw", zIndex: 10 }}>
        <div style={{ width: "2vw", height: "2vw", backgroundColor: "#4F7FFF", borderRadius: "0.4vw" }} />
        <div style={{ fontSize: "1.2vw", fontWeight: 700, letterSpacing: "-0.02em" }}>TSOS</div>
      </div>
      <div style={{ position: "absolute", top: "5vh", right: "5vw", fontSize: "1vw", color: "rgba(255,255,255,0.4)", zIndex: 10 }}>2026</div>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100vh",
          paddingLeft: "5vw",
          paddingRight: "5vw",
          gap: "3vh",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-block",
              padding: "0.5vh 1.2vw",
              backgroundColor: "rgba(124,107,240,0.12)",
              border: "1px solid rgba(124,107,240,0.3)",
              borderRadius: "2vw",
              color: "#7C6BF0",
              fontSize: "0.9vw",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "2vh",
            }}
          >
            Technology Stack
          </div>
          <h2 style={{ fontSize: "4vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Built on proven,{" "}
            <span style={{ color: "#7C6BF0" }}>modern open-source infrastructure</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1.5vw" }}>
          {[
            {
              layer: "Frontend",
              color: "#4F7FFF",
              items: ["React + Vite", "Tailwind CSS", "Wouter (routing)", "Dexie.js / IndexedDB", "shadcn/ui"],
            },
            {
              layer: "Backend",
              color: "#7C6BF0",
              items: ["Node.js 24", "Express 5", "Drizzle ORM", "PostgreSQL", "Zod validation"],
            },
            {
              layer: "Offline Sync",
              color: "#34D399",
              items: ["IndexedDB writes", "Sync queue", "Pull / push engine", "Online/offline detect", "20s safety timeout"],
            },
            {
              layer: "Storage",
              color: "#FACC15",
              items: ["MinIO (self-hosted)", "Namecheap VPS", "AWS SigV4 signing", "Presigned URLs", "Upload proxy"],
            },
            {
              layer: "Deployment",
              color: "#FB923C",
              items: ["Docker Compose", "Namecheap VPS", "Nginx reverse proxy", "pnpm monorepo", "esbuild CJS bundle"],
            },
          ].map((col) => (
            <div
              key={col.layer}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.2vh",
                padding: "2vh 1.8vw",
                backgroundColor: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "0.8vw",
                borderTop: `2px solid ${col.color}`,
              }}
            >
              <div style={{ fontSize: "1.05vw", fontWeight: 700, color: col.color, marginBottom: "0.5vh" }}>{col.layer}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8vh" }}>
                {col.items.map((item) => (
                  <div key={item} style={{ fontSize: "0.95vw", color: "rgba(255,255,255,0.6)", lineHeight: 1.4, fontFamily: "monospace" }}>{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "2vw", marginTop: "0.5vh" }}>
          {[
            { label: "TypeScript 5.9", desc: "Full type coverage — server, client, and shared types" },
            { label: "OpenAPI spec-first", desc: "Orval codegen for React Query hooks and Zod schemas" },
            { label: "DB indexes", desc: "16 composite indexes eliminating full table scans on sync" },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, padding: "1.5vh 1.5vw", backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.6vw" }}>
              <div style={{ fontSize: "1vw", fontWeight: 700, marginBottom: "0.4vh", color: "#fff" }}>{item.label}</div>
              <div style={{ fontSize: "0.9vw", color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>14 / 17</div>
    </div>
  );
}
