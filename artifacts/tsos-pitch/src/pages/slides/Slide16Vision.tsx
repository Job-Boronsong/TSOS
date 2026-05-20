export default function Slide16Vision() {
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Large central glow */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "70vw", height: "70vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.08, filter: "blur(16vw)" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "40vw", height: "40vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.1, filter: "blur(10vw)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "4vw 4vw", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ position: "absolute", top: "5vh", left: "5vw", display: "flex", alignItems: "center", gap: "1vw", zIndex: 10 }}>
        <div style={{ width: "2vw", height: "2vw", backgroundColor: "#4F7FFF", borderRadius: "0.4vw" }} />
        <div style={{ fontSize: "1.2vw", fontWeight: 700, letterSpacing: "-0.02em" }}>TSOS</div>
      </div>
      <div style={{ position: "absolute", top: "5vh", right: "5vw", fontSize: "1vw", color: "rgba(255,255,255,0.4)", zIndex: 10 }}>2026</div>

      {/* Central content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: "65vw",
          gap: "3vh",
          padding: "5vh 5vw",
          backgroundColor: "rgba(19,23,38,0.5)",
          backdropFilter: "blur(1vw)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1.5vw",
        }}
      >
        <div style={{ fontSize: "1vw", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}>The Vision</div>

        <h2 style={{ fontSize: "5vw", fontWeight: 800, margin: 0, lineHeight: 1.08, letterSpacing: "-0.04em", textWrap: "balance" }}>
          Every school in West Africa,{" "}
          <span style={{ color: "#4F7FFF" }}>fully digitized</span>
        </h2>

        <p style={{ fontSize: "1.4vw", fontWeight: 300, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.65, maxWidth: "52vw", textWrap: "pretty" }}>
          TSOS is the infrastructure layer for African school management — the way schools track students, pay teachers, collect fees, and report results.
        </p>

        <div
          style={{
            padding: "1.5vh 3vw",
            backgroundColor: "rgba(79,127,255,0.12)",
            border: "1px solid rgba(79,127,255,0.3)",
            borderRadius: "0.6vw",
            fontSize: "1.8vw",
            fontWeight: 800,
            color: "#4F7FFF",
            letterSpacing: "-0.02em",
          }}
        >
          Building for the next 100,000 schools
        </div>

        {/* Contact */}
        <div style={{ display: "flex", gap: "3vw", marginTop: "1vh" }}>
          <div style={{ fontSize: "1.1vw", color: "rgba(255,255,255,0.4)", fontWeight: 300 }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>Web:</span> tsos.app
          </div>
          <div style={{ width: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
          <div style={{ fontSize: "1.1vw", color: "rgba(255,255,255,0.4)", fontWeight: 300 }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>GitHub:</span> Job-Boronsong/TSOS
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>16 / 16</div>
    </div>
  );
}
