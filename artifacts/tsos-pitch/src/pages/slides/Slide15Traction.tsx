export default function Slide15Traction() {
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
              backgroundColor: "rgba(52,211,153,0.12)",
              border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: "2vw",
              color: "#34D399",
              fontSize: "0.9vw",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "2vh",
            }}
          >
            Traction
          </div>
          <h2 style={{ fontSize: "4.2vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Live and deployed.{" "}
            <span style={{ color: "#34D399" }}>Production-verified.</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5vw", width: "84vw" }}>
          {[
            { title: "Multi-school live", desc: "Greenfield Academy and Sunridge Primary operational on production VPS at 209.74.88.43", color: "#4F7FFF" },
            { title: "Offline sync verified", desc: "Full IndexedDB sync confirmed in production — pull, push, queue, and reconnect all tested", color: "#7C6BF0" },
            { title: "Paystack billing live", desc: "Subscription renewal, cancellation, HMAC webhook verification all functional end-to-end", color: "#34D399" },
            { title: "Photos and ID cards", desc: "MinIO-backed object storage with SigV4 upload proxy — passport photos and printable ID cards", color: "#FACC15" },
            { title: "Report cards live", desc: "Teacher score entry → automated BECE grading → printable report cards working in production", color: "#F87171" },
            { title: "Payroll deployed", desc: "Ghana PAYE (GRA 2024 bands), SSNIT deductions, draft/confirm payroll runs functional", color: "#FB923C" },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                display: "flex",
                gap: "1.2vw",
                padding: "2vh 2vw",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "0.8vw",
              }}
            >
              <div style={{ width: "2vw", height: "2vw", borderRadius: "50%", backgroundColor: `${item.color}20`, border: `1px solid ${item.color}60`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.3vh" }}>
                <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "1.05vw", fontWeight: 700, marginBottom: "0.5vh", color: item.color }}>{item.title}</div>
                <div style={{ fontSize: "0.95vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.45 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>15 / 16</div>
    </div>
  );
}
