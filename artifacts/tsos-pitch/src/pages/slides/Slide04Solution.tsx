export default function Slide04Solution() {
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
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60vw", height: "60vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.06, filter: "blur(14vw)" }} />
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
          paddingLeft: "8vw",
          paddingRight: "8vw",
          gap: "4vh",
        }}
      >
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
          }}
        >
          Our Solution
        </div>

        <h2 style={{ fontSize: "4.2vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em", textAlign: "center", textWrap: "balance", maxWidth: "70vw" }}>
          TSOS is an offline-first SaaS platform
          <br />
          <span style={{ color: "#4F7FFF" }}>built for Africa's classrooms</span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5vw", width: "80vw" }}>
          {[
            { title: "Full sync when online", desc: "Data pushes to the cloud automatically when connectivity is restored", icon: "↑" },
            { title: "Fully functional offline", desc: "Every read and write works from local IndexedDB — no internet required", icon: "◎" },
            { title: "Works on any device", desc: "Runs on low-end laptops, tablets, and smartphones — no app install needed", icon: "□" },
            { title: "Built for Ghana", desc: "Ghana grading system, Paystack billing, GHS currency, BECE report format", icon: "◆" },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                display: "flex",
                gap: "1.5vw",
                padding: "2.5vh 2vw",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "0.8vw",
              }}
            >
              <div style={{ fontSize: "1.4vw", color: "#4F7FFF", fontWeight: 700, lineHeight: 1, paddingTop: "0.2vh", flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: "1.2vw", fontWeight: 700, marginBottom: "0.6vh" }}>{item.title}</div>
                <div style={{ fontSize: "1.05vw", fontWeight: 300, color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>04 / 17</div>
    </div>
  );
}
