export default function Slide12BusinessModel() {
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
      <div style={{ position: "absolute", top: "0", right: "-10vw", width: "50vw", height: "50vw", borderRadius: "50%", backgroundColor: "#34D399", opacity: 0.05, filter: "blur(12vw)" }} />
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
              backgroundColor: "rgba(52,211,153,0.12)",
              border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: "2vw",
              color: "#34D399",
              fontSize: "0.9vw",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              alignSelf: "flex-start",
            }}
          >
            Business Model
          </div>
          <h2 style={{ fontSize: "4vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance" }}>
            Simple flat monthly{" "}
            <span style={{ color: "#34D399" }}>SaaS fee</span>
          </h2>
          <p style={{ fontSize: "1.25vw", fontWeight: 300, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
            Revenue grows linearly with school count. No per-transaction fees, no hidden charges.
          </p>

          {/* Pricing card */}
          <div style={{ padding: "2.5vh 2vw", backgroundColor: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "0.8vw", marginTop: "1vh" }}>
            <div style={{ fontSize: "1vw", color: "rgba(255,255,255,0.45)", marginBottom: "0.8vh", textTransform: "uppercase", letterSpacing: "0.08em" }}>Base Price</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5vw" }}>
              <div style={{ fontSize: "4vw", fontWeight: 800, color: "#34D399", letterSpacing: "-0.03em" }}>500</div>
              <div style={{ fontSize: "1.2vw", color: "rgba(255,255,255,0.5)" }}>GHS / month</div>
            </div>
            <div style={{ fontSize: "0.95vw", color: "rgba(255,255,255,0.4)", marginTop: "0.5vh" }}>Set by super admin · Adjustable per market</div>
          </div>
        </div>

        {/* Right */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
          <div style={{ fontSize: "1.1vw", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>Volume Discounts</div>
          {[
            { range: "1–11 months", discount: "0%", multiplier: "1.0x", color: "rgba(255,255,255,0.2)" },
            { range: "12+ months", discount: "5% off", multiplier: "0.95x", color: "#34D399" },
          ].map((tier) => (
            <div key={tier.range} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.8vh 2vw", backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${tier.color}40`, borderRadius: "0.6vw" }}>
              <div style={{ fontSize: "1.15vw", fontWeight: 600, color: tier.color }}>{tier.range}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
                <div style={{ fontSize: "1.2vw", fontWeight: 700 }}>{tier.discount}</div>
                <div style={{ fontSize: "0.9vw", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{tier.multiplier}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: "1vh", display: "flex", flexDirection: "column", gap: "1.2vh" }}>
            <div style={{ fontSize: "1.1vw", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Other Model Details</div>
            {[
              "3-day grace period after subscription expiry",
              "Daily cron deactivation at 08:00 Africa/Accra",
              "Paystack popup renewal — no card storage",
              "Zero per-transaction fees on student payments",
            ].map((point) => (
              <div key={point} style={{ display: "flex", alignItems: "center", gap: "1vw", fontSize: "1.05vw", color: "rgba(255,255,255,0.6)", fontWeight: 300 }}>
                <div style={{ width: "0.4vw", height: "0.4vw", borderRadius: "50%", backgroundColor: "#34D399", flexShrink: 0 }} />
                {point}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>12 / 17</div>
    </div>
  );
}
