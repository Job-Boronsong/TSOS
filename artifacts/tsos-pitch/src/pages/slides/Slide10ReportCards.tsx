export default function Slide10ReportCards() {
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
      <div style={{ position: "absolute", top: "10vh", right: "5vw", width: "40vw", height: "40vw", borderRadius: "50%", backgroundColor: "#FACC15", opacity: 0.04, filter: "blur(12vw)" }} />
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
          alignItems: "center",
          height: "100vh",
          paddingLeft: "5vw",
          paddingRight: "5vw",
          gap: "6vw",
        }}
      >
        {/* Left */}
        <div style={{ flex: "0 0 38vw", display: "flex", flexDirection: "column", gap: "2.5vh" }}>
          <div
            style={{
              display: "inline-block",
              padding: "0.5vh 1.2vw",
              backgroundColor: "rgba(250,204,21,0.12)",
              border: "1px solid rgba(250,204,21,0.3)",
              borderRadius: "2vw",
              color: "#FACC15",
              fontSize: "0.9vw",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              alignSelf: "flex-start",
            }}
          >
            Report Cards
          </div>
          <h2 style={{ fontSize: "4vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance" }}>
            Automated, printable academic{" "}
            <span style={{ color: "#FACC15" }}>reports</span>
          </h2>
          <p style={{ fontSize: "1.25vw", fontWeight: 300, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
            Every student's report computed and printable in seconds. Ghana BECE-aligned, term-by-term.
          </p>

          {/* Grading scale */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8vw", marginTop: "1vh" }}>
            {[
              { grade: "A1", range: "80–100", color: "#34D399" },
              { grade: "B2", range: "70–79", color: "#4F7FFF" },
              { grade: "B3", range: "65–69", color: "#7C6BF0" },
              { grade: "C4", range: "60–64", color: "#FACC15" },
              { grade: "C5", range: "55–59", color: "#FB923C" },
              { grade: "C6", range: "50–54", color: "#F87171" },
            ].map((g) => (
              <div key={g.grade} style={{ padding: "0.6vh 1vw", backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${g.color}40`, borderRadius: "0.4vw", fontSize: "0.95vw", fontWeight: 600 }}>
                <span style={{ color: g.color }}>{g.grade}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85vw", marginLeft: "0.4vw" }}>{g.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: report card mock */}
        <div
          style={{
            flex: 1,
            height: "72vh",
            backgroundColor: "#131726",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "1vw",
            overflow: "hidden",
            boxShadow: "0 2vh 5vh rgba(0,0,0,0.5)",
          }}
        >
          {/* Mock header */}
          <div style={{ padding: "2vh 2vw", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "1.2vw", fontWeight: 700 }}>Student Report Card</div>
              <div style={{ fontSize: "0.9vw", color: "rgba(255,255,255,0.4)", marginTop: "0.4vh" }}>Greenfield Academy — Term 1, 2025/2026</div>
            </div>
            <div style={{ padding: "0.5vh 1vw", backgroundColor: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "0.4vw", fontSize: "0.9vw", color: "#34D399", fontWeight: 600 }}>A1 — Excellent</div>
          </div>
          {/* Score rows */}
          <div style={{ padding: "1.5vh 2vw", display: "flex", flexDirection: "column", gap: "1.2vh" }}>
            {[
              { subject: "Mathematics", cw: 9, ct: 17, hw: 4, pw: 4, exam: 52, total: 86, grade: "A1" },
              { subject: "English Language", cw: 8, ct: 16, hw: 5, pw: 4, exam: 49, total: 82, grade: "A1" },
              { subject: "Science", cw: 7, ct: 15, hw: 4, pw: 3, exam: 45, total: 74, grade: "B2" },
              { subject: "Social Studies", cw: 9, ct: 18, hw: 5, pw: 5, exam: 50, total: 87, grade: "A1" },
              { subject: "ICT", cw: 10, ct: 19, hw: 5, pw: 5, exam: 56, total: 95, grade: "A1" },
            ].map((row) => (
              <div key={row.subject} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1.5fr 1fr", alignItems: "center", padding: "1.2vh 1vw", backgroundColor: "rgba(255,255,255,0.025)", borderRadius: "0.4vw", fontSize: "0.9vw" }}>
                <div style={{ fontWeight: 500 }}>{row.subject}</div>
                <div style={{ color: "rgba(255,255,255,0.45)", textAlign: "center" }}>{row.cw}/10</div>
                <div style={{ color: "rgba(255,255,255,0.45)", textAlign: "center" }}>{row.ct}/20</div>
                <div style={{ color: "rgba(255,255,255,0.45)", textAlign: "center" }}>{row.hw}/5</div>
                <div style={{ color: "rgba(255,255,255,0.45)", textAlign: "center" }}>{row.pw}/5</div>
                <div style={{ fontWeight: 700, textAlign: "center" }}>{row.total}/100</div>
                <div style={{ color: "#34D399", fontWeight: 700, textAlign: "center" }}>{row.grade}</div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "1.5vh 1vw", marginTop: "1vh", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "1vw", color: "rgba(255,255,255,0.5)" }}>Overall Average: <span style={{ color: "#fff", fontWeight: 700 }}>84.8%</span></div>
              <div style={{ fontSize: "1vw", color: "rgba(255,255,255,0.5)" }}>Class Position: <span style={{ color: "#FACC15", fontWeight: 700 }}>2nd of 34</span></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>10 / 17</div>
    </div>
  );
}
