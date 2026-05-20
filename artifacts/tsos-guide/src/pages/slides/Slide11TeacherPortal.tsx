export default function Slide11TeacherPortal() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Staff</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Teacher Portal
          </div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>GPS Check-in</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Payroll</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Operations</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Discipline</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Announcements</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Staff</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>Teacher Portal</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 2.5vh 0", maxWidth:"52vw" }}>
          Teachers have a completely separate login and dashboard — independent from the school admin.
        </p>
        <div style={{ display:"flex", gap:"3vw", flex:1 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Teacher Login Flow</div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", padding:"2.5vh 2vw", fontFamily:"'DM Mono', monospace", fontSize:"0.95vw", lineHeight:1.8 }}>
              <div style={{ color:"#565F89" }}>{"// Admin generates credentials"}</div>
              <div style={{ color:"#C0CAF5", marginTop:"0.8vh" }}>POST <span style={{ color:"#7AA2F7" }}>/schools/:id/teachers/:id</span></div>
              <div style={{ color:"#C0CAF5" }}>     <span style={{ color:"#9ECE6A" }}>/generate-credentials</span></div>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", marginTop:"1.2vh", paddingTop:"1.2vh" }}>
                <div style={{ color:"#565F89" }}>{"// Response (shown ONCE)"}</div>
                <div style={{ color:"#C0CAF5", marginTop:"0.5vh" }}>username: <span style={{ color:"#E0AF68" }}>"t_ama_asante"</span></div>
                <div style={{ color:"#C0CAF5" }}>password: <span style={{ color:"#E0AF68" }}>"Kx7!mP9z"</span></div>
              </div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(247,118,142,0.06)", border:"1px solid rgba(247,118,142,0.15)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Password shown only once. Teacher must change it on first login.</div>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>What Teachers Can Do</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"1vh" }}>
              <div style={{ padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw", display:"flex", alignItems:"center", gap:"1vw" }}>
                <div style={{ width:"0.5vw", height:"0.5vw", borderRadius:"50%", backgroundColor:"#9ECE6A", flexShrink:0 }} />
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Enter student scores across all 5 components</div>
              </div>
              <div style={{ padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw", display:"flex", alignItems:"center", gap:"1vw" }}>
                <div style={{ width:"0.5vw", height:"0.5vw", borderRadius:"50%", backgroundColor:"#7AA2F7", flexShrink:0 }} />
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Check in and out via GPS attendance</div>
              </div>
              <div style={{ padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw", display:"flex", alignItems:"center", gap:"1vw" }}>
                <div style={{ width:"0.5vw", height:"0.5vw", borderRadius:"50%", backgroundColor:"#E0AF68", flexShrink:0 }} />
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>View weekly timetable (own subjects highlighted)</div>
              </div>
              <div style={{ padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw", display:"flex", alignItems:"center", gap:"1vw" }}>
                <div style={{ width:"0.5vw", height:"0.5vw", borderRadius:"50%", backgroundColor:"#BB9AF7", flexShrink:0 }} />
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Read announcements and mark them as read</div>
              </div>
              <div style={{ padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw", display:"flex", alignItems:"center", gap:"1vw" }}>
                <div style={{ width:"0.5vw", height:"0.5vw", borderRadius:"50%", backgroundColor:"#FF9E64", flexShrink:0 }} />
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>View operational calendar — own events and school events</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>11</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
