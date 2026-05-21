const base = import.meta.env.BASE_URL;

export default function Slide03Opportunity() {
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
      <div style={{ position: "absolute", top: "10vh", left: "25vw", width: "45vw", height: "45vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.07, filter: "blur(12vw)" }} />
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
        {/* Left: map */}
        <div style={{ flex: "0 0 42vw", height: "70vh", position: "relative", borderRadius: "1vw", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          <img
            src={`${base}africa-map.png`}
            crossOrigin="anonymous"
            alt="Africa school density map"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(12,15,26,0.8) 100%)" }} />
        </div>

        {/* Right: stats */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3vh" }}>
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
            Market Opportunity
          </div>

          <h2 style={{ fontSize: "3.8vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance" }}>
            The scale of the{" "}
            <span style={{ color: "#4F7FFF" }}>opportunity</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "2vh" }}>
            {[
              { stat: "300,000+", label: "Schools in Sub-Saharan Africa", color: "#4F7FFF" },
              { stat: "35,000+", label: "Basic schools in Ghana alone", color: "#7C6BF0" },
              { stat: "<5%", label: "Currently use any digital system", color: "#F87171" },
              { stat: "30+ hrs", label: "Per week lost to manual admin per school", color: "#34D399" },
            ].map((item) => (
              <div key={item.stat} style={{ display: "flex", alignItems: "center", gap: "1.5vw", padding: "1.5vh 1.5vw", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.6vw" }}>
                <div style={{ fontSize: "2.8vw", fontWeight: 800, color: item.color, letterSpacing: "-0.03em", minWidth: "8vw" }}>{item.stat}</div>
                <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>03 / 17</div>
    </div>
  );
}
