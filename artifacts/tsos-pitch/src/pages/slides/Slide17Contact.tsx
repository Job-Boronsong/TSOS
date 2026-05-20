export default function Slide17Contact() {
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
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "70vw", height: "70vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.07, filter: "blur(18vw)" }} />
      <div style={{ position: "absolute", bottom: "-10vh", right: "-5vw", width: "40vw", height: "40vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.08, filter: "blur(12vw)" }} />
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
          textAlign: "center",
          gap: "4vh",
        }}
      >
        {/* Eyebrow */}
        <div style={{ fontSize: "0.95vw", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600 }}>
          Get in touch
        </div>

        {/* Company name */}
        <div>
          <h2 style={{ fontSize: "5.5vw", fontWeight: 800, margin: 0, lineHeight: 1.05, letterSpacing: "-0.04em" }}>
            Torrential{" "}
            <span style={{ color: "#4F7FFF" }}>Technologies</span>
          </h2>
          <p style={{ fontSize: "1.3vw", fontWeight: 300, color: "rgba(255,255,255,0.45)", margin: "1.5vh 0 0" }}>
            Built in Ghana. Built for Africa.
          </p>
        </div>

        {/* Contact details grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5vw", width: "60vw" }}>
          {[
            { label: "Email", value: "info@torrentialtechnologies.com", color: "#4F7FFF" },
            { label: "Phone", value: "+233 (0) 20 349 8298", color: "#7C6BF0" },
            { label: "Company", value: "www.torrentialtechnologies.com", color: "#34D399" },
            { label: "App", value: "www.torrentialbsms.com", color: "#FACC15" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "2.5vh 2.5vw",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "0.8vw",
                borderTop: `2px solid ${item.color}`,
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "0.85vw", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "0.8vh" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "1.05vw", fontWeight: 500, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>17 / 17</div>
    </div>
  );
}
