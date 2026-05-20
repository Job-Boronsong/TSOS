export default function Slide06Attendance() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Core Modules</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Students</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Classes</div>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Attendance
          </div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Finance</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Staff</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Teacher Portal</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>GPS Check-in</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Core Modules</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>Attendance</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 3vh 0", maxWidth:"52vw" }}>
          Take the daily register by class. Mark each student present, absent, or late.
        </p>
        <div style={{ display:"flex", gap:"3vw", flex:1 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>How to Take Attendance</div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"1.2vw", padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ width:"2.2vw", height:"2.2vw", borderRadius:"50%", backgroundColor:"rgba(122,162,247,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1vw", fontWeight:700, color:"#7AA2F7", flexShrink:0 }}>1</div>
              <div>
                <div style={{ fontSize:"1.05vw", fontWeight:600, color:"#FFFFFF", marginBottom:"0.3vh" }}>Select a class and date</div>
                <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Pick the class from the dropdown. Date defaults to today.</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"1.2vw", padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ width:"2.2vw", height:"2.2vw", borderRadius:"50%", backgroundColor:"rgba(158,206,106,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1vw", fontWeight:700, color:"#9ECE6A", flexShrink:0 }}>2</div>
              <div>
                <div style={{ fontSize:"1.05vw", fontWeight:600, color:"#FFFFFF", marginBottom:"0.3vh" }}>Mark each student</div>
                <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Toggle Present / Absent / Late for every student in the list.</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"1.2vw", padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ width:"2.2vw", height:"2.2vw", borderRadius:"50%", backgroundColor:"rgba(224,175,104,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1vw", fontWeight:700, color:"#E0AF68", flexShrink:0 }}>3</div>
              <div>
                <div style={{ fontSize:"1.05vw", fontWeight:600, color:"#FFFFFF", marginBottom:"0.3vh" }}>Submit</div>
                <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Saves locally. Syncs to server automatically when online.</div>
              </div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(122,162,247,0.06)", border:"1px solid rgba(122,162,247,0.15)", borderRadius:"0.5vw", marginTop:"0.5vh" }}>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Attendance works offline. Data is queued and pushed when connection returns.</div>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Sample Register</div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:"1.2vh 1.5vw", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Student</div>
                <div style={{ fontSize:"0.9vw", color:"#565F89" }}>No.</div>
                <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Status</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:"1.2vh 1.5vw", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>Ama Mensah</div>
                <div style={{ fontSize:"0.95vw", color:"#565F89", fontFamily:"'DM Mono', monospace" }}>GA260001</div>
                <div><span style={{ fontSize:"0.85vw", color:"#9ECE6A", backgroundColor:"rgba(158,206,106,0.1)", padding:"0.2vh 0.6vw", borderRadius:"0.3vw" }}>Present</span></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:"1.2vh 1.5vw", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>Kofi Boateng</div>
                <div style={{ fontSize:"0.95vw", color:"#565F89", fontFamily:"'DM Mono', monospace" }}>GA260002</div>
                <div><span style={{ fontSize:"0.85vw", color:"#FF9E64", backgroundColor:"rgba(255,158,100,0.1)", padding:"0.2vh 0.6vw", borderRadius:"0.3vw" }}>Late</span></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:"1.2vh 1.5vw" }}>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>Akua Asante</div>
                <div style={{ fontSize:"0.95vw", color:"#565F89", fontFamily:"'DM Mono', monospace" }}>GA260003</div>
                <div><span style={{ fontSize:"0.85vw", color:"#F7768E", backgroundColor:"rgba(247,118,142,0.1)", padding:"0.2vh 0.6vw", borderRadius:"0.3vw" }}>Absent</span></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>06</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
