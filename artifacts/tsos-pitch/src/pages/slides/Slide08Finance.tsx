export default function Slide08Finance() {
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
      <div style={{ position: "absolute", bottom: "-15vh", right: "-10vw", width: "50vw", height: "50vw", borderRadius: "50%", backgroundColor: "#34D399", opacity: 0.05, filter: "blur(12vw)" }} />
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
            Finance & Billing
          </div>
          <h2 style={{ fontSize: "4vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance" }}>
            Full-cycle school finance with{" "}
            <span style={{ color: "#34D399" }}>Paystack integration</span>
          </h2>
          <p style={{ fontSize: "1.25vw", fontWeight: 300, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
            From student fee collection to staff payroll — every financial flow in one dashboard, with real-time reconciliation.
          </p>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.8vh" }}>
          {/* Summary metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2vw", marginBottom: "0.5vh" }}>
            {[
              { label: "Fees Collected", value: "GHS 45,200", color: "#34D399" },
              { label: "Total Arrears", value: "GHS 8,750", color: "#F87171" },
              { label: "Collection Rate", value: "83.8%", color: "#4F7FFF" },
              { label: "Net Cash", value: "GHS 36,450", color: "#FACC15" },
            ].map((m) => (
              <div key={m.label} style={{ padding: "1.5vh 1.5vw", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.6vw" }}>
                <div style={{ fontSize: "0.9vw", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5vh" }}>{m.label}</div>
                <div style={{ fontSize: "2.2vw", fontWeight: 800, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          {[
            { label: "Fee types tracked", desc: "School fees, bus fees, canteen/feeding — per student" },
            { label: "Expenditure categories", desc: "Salaries, utilities, supplies, maintenance, other" },
            { label: "Paystack subscription billing", desc: "Renewal flows, cancellation, grace period, HMAC webhooks" },
            { label: "Staff payroll", desc: "Ghana PAYE (GRA 2024 bands) + SSNIT 5.5% employee deductions" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw", padding: "1.2vh 1.5vw", backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.6vw" }}>
              <div style={{ width: "0.3vw", height: "3vh", backgroundColor: "#34D399", borderRadius: "0.2vw", flexShrink: 0, marginTop: "0.4vh" }} />
              <div>
                <div style={{ fontSize: "1.05vw", fontWeight: 600, marginBottom: "0.3vh" }}>{item.label}</div>
                <div style={{ fontSize: "0.95vw", fontWeight: 300, color: "rgba(255,255,255,0.5)" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>08 / 17</div>
    </div>
  );
}
