export default function Slide05Modules() {
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
      <div style={{ position: "absolute", top: "-5vh", right: "-5vw", width: "40vw", height: "40vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.06, filter: "blur(10vw)" }} />
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
          justifyContent: "center",
          height: "100vh",
          paddingLeft: "5vw",
          paddingRight: "5vw",
          gap: "3vh",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "2vw" }}>
          <h2 style={{ fontSize: "4vw", fontWeight: 800, margin: 0, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            Six modules.{" "}
            <span style={{ color: "#4F7FFF" }}>One platform.</span>
          </h2>
          <div style={{ fontSize: "1.1vw", color: "rgba(255,255,255,0.4)", fontWeight: 300 }}>Every school operation covered.</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5vw" }}>
          {[
            { title: "Students", color: "#4F7FFF", items: ["Enrollment & ID cards", "Class history & promotions", "Fee waivers, CSV import"] },
            { title: "Attendance", color: "#7C6BF0", items: ["Daily student register", "GPS teacher check-in", "Absence reports"] },
            { title: "Finance", color: "#34D399", items: ["School, bus, canteen fees", "Expenditure by category", "Paystack billing"] },
            { title: "Academics", color: "#FACC15", items: ["Score entry (5 components)", "Automated report cards", "Class timetable"] },
            { title: "Staff", color: "#F87171", items: ["Payroll with PAYE & SSNIT", "Discipline log", "Announcements"] },
            { title: "Admin", color: "#FB923C", items: ["School settings & calendar", "Multi-school management", "Subscription control"] },
          ].map((mod) => (
            <div
              key={mod.title}
              style={{
                padding: "2vh 1.8vw",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "0.8vw",
                borderTop: `2px solid ${mod.color}`,
              }}
            >
              <div style={{ fontSize: "1.2vw", fontWeight: 700, marginBottom: "1.2vh", color: mod.color }}>{mod.title}</div>
              <div style={{ fontSize: "1vw", fontWeight: 300, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                <div>{mod.items[0]}</div>
                <div>{mod.items[1]}</div>
                <div>{mod.items[2]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", left: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>TORRENTIAL SCHOOL OPERATIONS SUITE</div>
      <div style={{ position: "absolute", bottom: "4vh", right: "5vw", fontSize: "0.9vw", color: "rgba(255,255,255,0.3)" }}>05 / 16</div>
    </div>
  );
}
