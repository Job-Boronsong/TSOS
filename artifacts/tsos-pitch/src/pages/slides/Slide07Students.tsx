export default function Slide07Students() {
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
      <div style={{ position: "absolute", top: "-10vh", right: "-5vw", width: "45vw", height: "45vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(79,127,255,0.12) 0%, rgba(79,127,255,0) 70%)" }} />
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
        <div style={{ flex: "0 0 38vw", display: "flex", flexDirection: "column", gap: "2.5vh" }}>
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
              alignSelf: "flex-start",
            }}
          >
            Student Management
          </div>
          <h2 style={{ fontSize: "4vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance" }}>
            Complete student lifecycle —{" "}
            <span style={{ color: "#4F7FFF" }}>enrollment to graduation</span>
          </h2>
          <p style={{ fontSize: "1.25vw", fontWeight: 300, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
            Every student detail, every class movement, every fee status — tracked and accessible in one place.
          </p>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.8vh" }}>
          {[
            { label: "Auto-generated student numbers", desc: "Format: GA260001 — school code, year, and sequence" },
            { label: "Passport photo upload", desc: "Stored securely via object storage, shown on ID cards" },
            { label: "ID card printing", desc: "3-column printable grid, credit card size, filterable by class" },
            { label: "Per-student fee waivers", desc: "School fee, feeding, and bus waivers — visible as coloured badges" },
            { label: "Class history and promotion wizard", desc: "3-step wizard: single class or bulk end-of-year promotion" },
            { label: "CSV bulk import", desc: "Upload hundreds of students at once with fuzzy class matching" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw", padding: "1.5vh 1.5vw", backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.6vw" }}>
              <div style={{ width: "0.3vw", height: "3.5vh", backgroundColor: "#4F7FFF", borderRadius: "0.2vw", flexShrink: 0, marginTop: "0.4vh" }} />
              <div>
                <div style={{ fontSize: "1.1vw", fontWeight: 600, marginBottom: "0.3vh" }}>{item.label}</div>
                <div style={{ fontSize: "1vw", fontWeight: 300, color: "rgba(255,255,255,0.5)" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>07 / 17</div>
    </div>
  );
}
