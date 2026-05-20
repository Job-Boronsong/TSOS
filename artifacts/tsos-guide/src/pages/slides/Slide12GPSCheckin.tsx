export default function Slide12GPSCheckin() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Staff</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Teacher Portal</div>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            GPS Check-in
          </div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Payroll</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Admin</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Settings</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Super Admin</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Staff</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>GPS Teacher Check-in</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 2.5vh 0", maxWidth:"52vw" }}>
          Teachers check in via their browser. The system validates their location using haversine distance.
        </p>
        <div style={{ display:"flex", gap:"3vw", flex:1 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Admin Setup (once)</div>
            <div style={{ padding:"1.8vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"1vw", fontWeight:600, color:"#FFFFFF", marginBottom:"0.5vh" }}>Set school coordinates</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>In Settings, enter the school's GPS latitude, longitude, and acceptable radius in metres.</div>
            </div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", padding:"2vh 1.8vw", fontFamily:"'DM Mono', monospace", fontSize:"0.9vw", lineHeight:1.8 }}>
              <div style={{ color:"#C0CAF5" }}>checkin_latitude:  <span style={{ color:"#9ECE6A" }}>5.6037</span></div>
              <div style={{ color:"#C0CAF5" }}>checkin_longitude: <span style={{ color:"#9ECE6A" }}>-0.1870</span></div>
              <div style={{ color:"#C0CAF5" }}>radius_meters:     <span style={{ color:"#E0AF68" }}>200</span></div>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Teacher Check-in Flow</div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"1.2vw", padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ width:"2.2vw", height:"2.2vw", borderRadius:"50%", backgroundColor:"rgba(122,162,247,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1vw", fontWeight:700, color:"#7AA2F7", flexShrink:0 }}>1</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Open the TSOS teacher portal and tap "Check In"</div>
            </div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"1.2vw", padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ width:"2.2vw", height:"2.2vw", borderRadius:"50%", backgroundColor:"rgba(158,206,106,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1vw", fontWeight:700, color:"#9ECE6A", flexShrink:0 }}>2</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Browser requests GPS permission — teacher must allow location</div>
            </div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"1.2vw", padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ width:"2.2vw", height:"2.2vw", borderRadius:"50%", backgroundColor:"rgba(224,175,104,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1vw", fontWeight:700, color:"#E0AF68", flexShrink:0 }}>3</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Server computes haversine distance. Within radius = check-in recorded.</div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(247,118,142,0.06)", border:"1px solid rgba(247,118,142,0.15)", borderRadius:"0.5vw", marginTop:"0.3vh" }}>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Outside radius = rejected. No manual override available to the teacher.</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>12</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
