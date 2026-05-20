export default function Slide15Comms() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Operations</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Feeding</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Discipline</div>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Announcements
          </div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Calendar</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Admin</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Super Admin</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Operations</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>Announcements & Calendar</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 2.5vh 0", maxWidth:"52vw" }}>
          Post school-wide announcements and schedule events. Teachers see both from their own portal.
        </p>
        <div style={{ display:"flex", gap:"3vw", flex:1 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Announcements</div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", padding:"2.5vh 2vw" }}>
              <div style={{ fontSize:"1vw", fontWeight:600, color:"#FFFFFF", marginBottom:"0.5vh" }}>End of term reminder</div>
              <div style={{ fontSize:"0.9vw", color:"#9AA5CE", lineHeight:1.5, marginBottom:"1.5vh" }}>Term 1 closes on Friday 30 May. All score submissions must be complete by Wednesday.</div>
              <div style={{ display:"flex", gap:"0.8vw" }}>
                <span style={{ fontSize:"0.8vw", color:"#25D366", backgroundColor:"rgba(37,211,102,0.1)", padding:"0.3vh 0.7vw", borderRadius:"0.3vw" }}>WhatsApp</span>
                <span style={{ fontSize:"0.8vw", color:"#1877F2", backgroundColor:"rgba(24,119,242,0.1)", padding:"0.3vh 0.7vw", borderRadius:"0.3vw" }}>Facebook</span>
                <span style={{ fontSize:"0.8vw", color:"#C0CAF5", backgroundColor:"rgba(192,202,245,0.08)", padding:"0.3vh 0.7vw", borderRadius:"0.3vw" }}>X</span>
              </div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(122,162,247,0.06)", border:"1px solid rgba(122,162,247,0.15)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Teachers see an unread count badge and click through to the full announcement. Social share buttons allow forwarding to parents.</div>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Operational Calendar</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"1vh" }}>
              <div style={{ display:"flex", gap:"1vw", alignItems:"flex-start", padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw" }}>
                <span style={{ padding:"0.2vh 0.6vw", backgroundColor:"rgba(122,162,247,0.12)", borderRadius:"0.3vw", fontSize:"0.8vw", color:"#7AA2F7", flexShrink:0 }}>academic</span>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Term 1 End — 30 May</div>
              </div>
              <div style={{ display:"flex", gap:"1vw", alignItems:"flex-start", padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw" }}>
                <span style={{ padding:"0.2vh 0.6vw", backgroundColor:"rgba(247,118,142,0.12)", borderRadius:"0.3vw", fontSize:"0.8vw", color:"#F7768E", flexShrink:0 }}>exams</span>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>End-of-Term Exams — 26–28 May</div>
              </div>
              <div style={{ display:"flex", gap:"1vw", alignItems:"flex-start", padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw" }}>
                <span style={{ padding:"0.2vh 0.6vw", backgroundColor:"rgba(224,175,104,0.12)", borderRadius:"0.3vw", fontSize:"0.8vw", color:"#E0AF68", flexShrink:0 }}>meeting</span>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Staff Meeting — 23 May, 14:00</div>
              </div>
              <div style={{ display:"flex", gap:"1vw", alignItems:"flex-start", padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw" }}>
                <span style={{ padding:"0.2vh 0.6vw", backgroundColor:"rgba(158,206,106,0.12)", borderRadius:"0.3vw", fontSize:"0.8vw", color:"#9ECE6A", flexShrink:0 }}>holiday</span>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Africa Day — 25 May</div>
              </div>
            </div>
            <div style={{ padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:"0.4vw" }}>
              <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Target: all_staff / specific_classes / specific_teachers</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>15</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
