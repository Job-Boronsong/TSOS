export default function Slide13GoToMarket() {
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
      <div style={{ position: "absolute", top: "5vh", left: "10vw", width: "45vw", height: "45vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(79,127,255,0.12) 0%, rgba(79,127,255,0) 70%)" }} />
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
          gap: "5vw",
        }}
      >
        {/* Left */}
        <div style={{ flex: "0 0 36vw", display: "flex", flexDirection: "column", gap: "2.5vh" }}>
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
            Go-to-Market
          </div>
          <h2 style={{ fontSize: "4vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance" }}>
            Three channels to reach{" "}
            <span style={{ color: "#4F7FFF" }}>35,000+ schools</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh", marginTop: "1vh" }}>
            {[
              { channel: "Direct Sales", desc: "School owners and proprietors — highest conversion, direct relationship", color: "#4F7FFF" },
              { channel: "Education Office Partnerships", desc: "District Education Offices for bulk adoption across clusters of schools", color: "#7C6BF0" },
              { channel: "Word of Mouth", desc: "Teacher networks and PTA groups — organic growth, low CAC", color: "#34D399" },
            ].map((item) => (
              <div key={item.channel} style={{ display: "flex", gap: "1.2vw", padding: "1.8vh 1.5vw", backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.6vw" }}>
                <div style={{ width: "0.35vw", backgroundColor: item.color, borderRadius: "0.2vw", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "1.1vw", fontWeight: 700, marginBottom: "0.4vh", color: item.color }}>{item.channel}</div>
                  <div style={{ fontSize: "1vw", fontWeight: 300, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: expansion stages */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.5vh" }}>
          <div style={{ fontSize: "1.1vw", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Expansion Stages</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh" }}>
            {[
              { stage: "Stage 1", title: "Ghana Private Schools", desc: "Private schools across Ghana — highest digital readiness, English instruction, fastest to adopt and pay", color: "#4F7FFF", status: "Now" },
              { stage: "Stage 2", title: "Ghana Public Sector", desc: "Public schools and rural districts nationwide — partner with GES for bulk procurement", color: "#7C6BF0", status: "Year 1" },
              { stage: "Stage 3", title: "West Africa Expansion", desc: "Nigeria, Côte d'Ivoire, Senegal — same architecture, localised billing and grading", color: "#34D399", status: "Year 2+" },
            ].map((s) => (
              <div key={s.stage} style={{ display: "flex", gap: "1.5vw", padding: "2vh 2vw", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.8vw" }}>
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8vh" }}>
                  <div style={{ width: "3vw", height: "3vw", borderRadius: "50%", backgroundColor: `${s.color}20`, border: `1px solid ${s.color}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", backgroundColor: s.color }} />
                  </div>
                  <div style={{ fontSize: "0.8vw", color: s.color, fontWeight: 600 }}>{s.status}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.85vw", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4vh" }}>{s.stage}</div>
                  <div style={{ fontSize: "1.1vw", fontWeight: 700, marginBottom: "0.5vh" }}>{s.title}</div>
                  <div style={{ fontSize: "1vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.45 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>13 / 17</div>
    </div>
  );
}
