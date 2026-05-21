export default function Slide11MultiSchool() {
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
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "55vw", height: "55vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.05, filter: "blur(14vw)" }} />
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
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          paddingLeft: "5vw",
          paddingRight: "5vw",
          gap: "3.5vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              padding: "0.5vh 1.2vw",
              backgroundColor: "rgba(79,127,255,0.12)",
              border: "1px solid rgba(79,127,255,0.3)",
              borderRadius: "2vw",
              color: "#4F7FFF",
              fontSize: "0.9vw",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "2vh",
            }}
          >
            Multi-School Architecture
          </div>
          <h2 style={{ fontSize: "4vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            From one school to{" "}
            <span style={{ color: "#4F7FFF" }}>a national network</span>
          </h2>
        </div>

        {/* Architecture diagram */}
        <div style={{ display: "flex", alignItems: "center", gap: "0", width: "84vw" }}>
          {/* Super Admin */}
          <div style={{ flex: "0 0 22vw", padding: "2.5vh 2vw", backgroundColor: "rgba(79,127,255,0.1)", border: "1px solid rgba(79,127,255,0.3)", borderRadius: "0.8vw", textAlign: "center" }}>
            <div style={{ fontSize: "1vw", color: "#4F7FFF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.2vh" }}>Super Admin</div>
            <div style={{ fontSize: "0.95vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              <div>All schools dashboard</div>
              <div>Platform pricing</div>
              <div>Subscription management</div>
              <div>School activation/deactivation</div>
            </div>
          </div>
          {/* Arrows */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1vh" }}>
            <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(79,127,255,0.4)", position: "relative" }}>
              <div style={{ position: "absolute", right: "-0.4vw", top: "-0.6vh", width: 0, height: 0, borderLeft: "0.6vw solid rgba(79,127,255,0.6)", borderTop: "0.4vw solid transparent", borderBottom: "0.4vw solid transparent" }} />
            </div>
            <div style={{ fontSize: "0.85vw", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>School-level isolation</div>
          </div>
          {/* Schools */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.2vh" }}>
            {[
              { name: "Greenfield Academy", slug: "/school/greenfield-academy", status: "Active" },
              { name: "Sunridge Primary", slug: "/school/sunridge-primary", status: "Active" },
              { name: "School N", slug: "/school/school-n", status: "Pending" },
            ].map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2vh 1.5vw", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.6vw" }}>
                <div>
                  <div style={{ fontSize: "1.05vw", fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: "0.85vw", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{s.slug}</div>
                </div>
                <div style={{ padding: "0.4vh 0.8vw", backgroundColor: s.status === "Active" ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)", border: `1px solid ${s.status === "Active" ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: "2vw", fontSize: "0.8vw", color: s.status === "Active" ? "#34D399" : "rgba(255,255,255,0.4)", fontWeight: 600 }}>{s.status}</div>
              </div>
            ))}
          </div>
          {/* Arrows */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(124,107,240,0.4)", position: "relative" }}>
              <div style={{ position: "absolute", right: "-0.4vw", top: "-0.6vh", width: 0, height: 0, borderLeft: "0.6vw solid rgba(124,107,240,0.6)", borderTop: "0.4vw solid transparent", borderBottom: "0.4vw solid transparent" }} />
            </div>
          </div>
          {/* Roles */}
          <div style={{ flex: "0 0 20vw", display: "flex", flexDirection: "column", gap: "0.9vh" }}>
            {[
              { role: "Super Admin", desc: "Platform-wide", color: "#34D399" },
              { role: "School Admin", desc: "Full school access", color: "#7C6BF0" },
              { role: "Head Teacher", desc: "All admin modules", color: "#BB9AF7" },
              { role: "Finance Officer", desc: "Finance & payroll", color: "#9ECE6A" },
              { role: "Teacher", desc: "Classroom only", color: "#4F7FFF" },
            ].map((r) => (
              <div key={r.role} style={{ padding: "0.9vh 1.2vw", backgroundColor: "rgba(255,255,255,0.025)", border: `1px solid ${r.color}40`, borderRadius: "0.6vw", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "0.95vw", fontWeight: 600, color: r.color }}>{r.role}</div>
                <div style={{ fontSize: "0.8vw", color: "rgba(255,255,255,0.35)" }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>11 / 17</div>
    </div>
  );
}
