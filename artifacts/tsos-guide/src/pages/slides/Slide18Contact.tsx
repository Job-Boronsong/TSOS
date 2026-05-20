export default function Slide18Contact() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      {/* Sidebar */}
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Contact</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Get in Touch
          </div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, padding:"7vh 7vw", display:"flex", flexDirection:"column", justifyContent:"center", background:"radial-gradient(circle at 65% 45%, rgba(122,162,247,0.06) 0%, transparent 55%)" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Support &amp; Contact</div>
        <h1 style={{ fontSize:"4vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 0.6vh 0", letterSpacing:"-0.02em" }}>Torrential Technologies</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 4vh 0" }}>
          Built in Ghana. Built for Africa.
        </p>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:"1.8vh", maxWidth:"52vw" }}>
          {[
            { label: "Email", value: "info@torrentialtechnologies.com", color: "#7AA2F7" },
            { label: "Phone", value: "+233 (0) 20 349 8298", color: "#BB9AF7" },
            { label: "Company Website", value: "www.torrentialtechnologies.com", color: "#9ECE6A" },
            { label: "App Website", value: "www.torrentialbsms.com", color: "#E0AF68" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "2vh 2vw",
                backgroundColor: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "0.5vw",
                borderLeft: `3px solid ${item.color}`,
              }}
            >
              <div style={{ fontSize:"0.8vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600, marginBottom:"0.6vh" }}>
                {item.label}
              </div>
              <div style={{ fontSize:"1vw", color:"#C0CAF5", fontWeight:500 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:"4vh", padding:"2vh 2vw", backgroundColor:"rgba(122,162,247,0.06)", border:"1px solid rgba(122,162,247,0.15)", borderRadius:"0.5vw", maxWidth:"52vw" }}>
          <div style={{ fontSize:"0.95vw", color:"#9AA5CE", lineHeight:1.6 }}>
            For onboarding, technical support, or billing enquiries, reach us via email or phone. We're here to help your school get the most out of TSOS.
          </div>
        </div>

        <div style={{ marginTop:"auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>18</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
