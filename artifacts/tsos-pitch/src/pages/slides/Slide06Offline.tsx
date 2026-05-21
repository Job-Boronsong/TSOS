const base = import.meta.env.BASE_URL;

export default function Slide06Offline() {
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
      <div style={{ position: "absolute", bottom: "-10vh", left: "-5vw", width: "50vw", height: "50vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.06, filter: "blur(10vw)" }} />
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
        {/* Left text */}
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
            Offline-First Architecture
          </div>
          <h2 style={{ fontSize: "3.8vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance" }}>
            The only platform built for{" "}
            <span style={{ color: "#4F7FFF" }}>poor connectivity</span>
          </h2>
          <p style={{ fontSize: "1.25vw", fontWeight: 300, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6, textWrap: "pretty" }}>
            TSOS works completely offline. All data lives in the browser's local database — reads and writes never touch the network.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.8vh", marginTop: "1vh" }}>
            {[
              { step: "1", text: "On first load, all school data syncs from server to device" },
              { step: "2", text: "All reads come from local IndexedDB — instant, no latency" },
              { step: "3", text: "Writes queue locally, then push automatically when online" },
              { step: "4", text: "Sync status shown live: Online / Offline / Syncing / Pending" },
            ].map((item) => (
              <div key={item.step} style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
                <div style={{ width: "2.2vw", height: "2.2vw", borderRadius: "50%", backgroundColor: "rgba(79,127,255,0.2)", border: "1px solid rgba(79,127,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1vw", fontWeight: 700, color: "#4F7FFF", flexShrink: 0 }}>
                  {item.step}
                </div>
                <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, paddingTop: "0.3vh" }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: sync diagram */}
        <div style={{ flex: 1, height: "65vh", position: "relative", borderRadius: "1vw", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          <img
            src={`${base}sync-diagram.png`}
            crossOrigin="anonymous"
            alt="Offline sync diagram"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 70%, rgba(12,15,26,0.7) 100%)" }} />
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>06 / 17</div>
    </div>
  );
}
