export default function Slide02Problem() {
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
      {/* Accent blobs */}
      <div style={{ position: "absolute", top: "-10vh", right: "-5vw", width: "45vw", height: "45vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.05, filter: "blur(8vw)" }} />
      <div style={{ position: "absolute", bottom: "-15vh", left: "-10vw", width: "50vw", height: "50vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.06, filter: "blur(10vw)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "4vw 4vw", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ position: "absolute", top: "5vh", left: "5vw", display: "flex", alignItems: "center", gap: "1vw", zIndex: 10 }}>
        <div style={{ width: "2vw", height: "2vw", backgroundColor: "#4F7FFF", borderRadius: "0.4vw" }} />
        <div style={{ fontSize: "1.2vw", fontWeight: 700, letterSpacing: "-0.02em" }}>TSOS</div>
      </div>
      <div style={{ position: "absolute", top: "5vh", right: "5vw", fontSize: "1vw", color: "rgba(255,255,255,0.4)", zIndex: 10 }}>2026</div>

      {/* Content */}
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
        <div style={{ flex: "0 0 40vw", display: "flex", flexDirection: "column", gap: "2.5vh" }}>
          <div
            style={{
              display: "inline-block",
              padding: "0.5vh 1.2vw",
              backgroundColor: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "2vw",
              color: "#F87171",
              fontSize: "0.9vw",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              alignSelf: "flex-start",
            }}
          >
            The Problem
          </div>
          <h2
            style={{
              fontSize: "4.2vw",
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              textWrap: "balance",
            }}
          >
            Schools still run on{" "}
            <span style={{ color: "#F87171" }}>paper</span>
          </h2>
          <p
            style={{
              fontSize: "1.35vw",
              fontWeight: 300,
              color: "rgba(255,255,255,0.65)",
              margin: 0,
              lineHeight: 1.6,
              maxWidth: "36vw",
              textWrap: "pretty",
            }}
          >
            Schools across Africa run on paper, spreadsheets, and disconnected tools — losing data, wasting time, and operating blind.
          </p>
        </div>

        {/* Right — problem cards */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
          {[
            { label: "Manual Attendance", desc: "Physical registers prone to loss, forgery, and hours of daily transcription", color: "#F87171" },
            { label: "No Fee Audit Trail", desc: "Fee collection managed in exercise books with no receipt system or reconciliation", color: "#FB923C" },
            { label: "Zero Visibility", desc: "No insight into teacher performance, student progress, or school-wide trends", color: "#FACC15" },
            { label: "Connectivity Gap", desc: "Internet access is unreliable — cloud-only systems fail every single day", color: "#A78BFA" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.5vw",
                padding: "2vh 2vw",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "0.8vw",
              }}
            >
              <div style={{ width: "0.35vw", height: "4vh", backgroundColor: item.color, borderRadius: "0.2vw", flexShrink: 0, marginTop: "0.5vh" }} />
              <div>
                <div style={{ fontSize: "1.2vw", fontWeight: 700, marginBottom: "0.4vh", color: "#fff" }}>{item.label}</div>
                <div style={{ fontSize: "1.05vw", fontWeight: 300, color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>02 / 17</div>
    </div>
  );
}
