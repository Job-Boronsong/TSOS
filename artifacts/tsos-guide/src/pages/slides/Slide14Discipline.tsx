export default function Slide14Discipline() {
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
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Discipline Log
          </div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Announcements</div>
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
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>Discipline Log</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 2.5vh 0", maxWidth:"52vw" }}>
          Record and track behavioural incidents. Admins can override any record with a note.
        </p>
        <div style={{ display:"flex", gap:"3vw", flex:1 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Incident Types</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1vw" }}>
              <div style={{ padding:"1.5vh 1.2vw", backgroundColor:"rgba(122,162,247,0.08)", border:"1px solid rgba(122,162,247,0.18)", borderRadius:"0.5vw", textAlign:"center" }}>
                <div style={{ fontSize:"1.05vw", fontWeight:700, color:"#7AA2F7" }}>Warning</div>
              </div>
              <div style={{ padding:"1.5vh 1.2vw", backgroundColor:"rgba(224,175,104,0.08)", border:"1px solid rgba(224,175,104,0.18)", borderRadius:"0.5vw", textAlign:"center" }}>
                <div style={{ fontSize:"1.05vw", fontWeight:700, color:"#E0AF68" }}>Detention</div>
              </div>
              <div style={{ padding:"1.5vh 1.2vw", backgroundColor:"rgba(247,118,142,0.08)", border:"1px solid rgba(247,118,142,0.18)", borderRadius:"0.5vw", textAlign:"center" }}>
                <div style={{ fontSize:"1.05vw", fontWeight:700, color:"#F7768E" }}>Suspension</div>
              </div>
              <div style={{ padding:"1.5vh 1.2vw", backgroundColor:"rgba(158,206,106,0.08)", border:"1px solid rgba(158,206,106,0.18)", borderRadius:"0.5vw", textAlign:"center" }}>
                <div style={{ fontSize:"1.05vw", fontWeight:700, color:"#9ECE6A" }}>Commendation</div>
              </div>
            </div>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginTop:"0.5vh", marginBottom:"0.3vh" }}>Statuses</div>
            <div style={{ display:"flex", gap:"1vw" }}>
              <div style={{ padding:"1vh 1.2vw", backgroundColor:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"0.4vw", fontSize:"0.95vw", color:"#C0CAF5" }}>Active</div>
              <div style={{ padding:"1vh 1.2vw", backgroundColor:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"0.4vw", fontSize:"0.95vw", color:"#C0CAF5" }}>Resolved</div>
              <div style={{ padding:"1vh 1.2vw", backgroundColor:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"0.4vw", fontSize:"0.95vw", color:"#C0CAF5" }}>Overridden</div>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Sample Log Entry</div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", padding:"2.5vh 2vw" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.5vh" }}>
                <div style={{ fontSize:"1.05vw", fontWeight:600, color:"#FFFFFF" }}>Kofi Boateng</div>
                <span style={{ fontSize:"0.85vw", color:"#E0AF68", backgroundColor:"rgba(224,175,104,0.1)", padding:"0.3vh 0.8vw", borderRadius:"0.3vw" }}>Detention</span>
              </div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE", lineHeight:1.5, marginBottom:"1.5vh" }}>Disrupted class on three consecutive occasions. Assigned after-school detention on 18 May.</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"1.2vh", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize:"0.85vw", color:"#565F89", fontFamily:"'DM Mono', monospace" }}>2026-05-18</div>
                <span style={{ fontSize:"0.8vw", color:"#9ECE6A", backgroundColor:"rgba(158,206,106,0.1)", padding:"0.2vh 0.6vw", borderRadius:"0.3vw" }}>Resolved</span>
              </div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(187,154,247,0.06)", border:"1px solid rgba(187,154,247,0.15)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Admin override: change any field on an existing record and add an override note. Overridden status is permanent.</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>14</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
