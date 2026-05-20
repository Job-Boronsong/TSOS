export default function Slide04Students() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Core Modules</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Students
          </div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Classes</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Attendance</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Finance</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Academic</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Report Cards</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Score Entry</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Core Modules</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>Students</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 3vh 0", maxWidth:"52vw" }}>
          Manage the complete student lifecycle — from first enrollment through graduation.
        </p>
        <div style={{ display:"flex", gap:"3vw", flex:1 }}>
          {/* Left: key actions */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.5vh" }}>Key Actions</div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"1.05vw", fontWeight:600, color:"#FFFFFF", marginBottom:"0.4vh" }}>Add a student</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Enter name, student number (auto-generated), category, and class. Upload passport photo.</div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"1.05vw", fontWeight:600, color:"#FFFFFF", marginBottom:"0.4vh" }}>Set fee waivers</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Toggle school fee, feeding, or bus waivers per student. Waivers show as coloured badges.</div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"1.05vw", fontWeight:600, color:"#FFFFFF", marginBottom:"0.4vh" }}>Promote or demote</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Move a student to a new class. Use the bulk end-of-year wizard to promote all classes at once.</div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"1.05vw", fontWeight:600, color:"#FFFFFF", marginBottom:"0.4vh" }}>Print ID cards</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Filter by class, generate a 3-column printable grid of credit-card-sized ID cards.</div>
            </div>
          </div>
          {/* Right: student number format + CSV */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.5vh" }}>Student Number Format</div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", padding:"2.5vh 2vw", fontFamily:"'DM Mono', monospace", fontSize:"1vw", lineHeight:1.8 }}>
              <div style={{ color:"#565F89" }}>{"// Auto-generated on enrollment"}</div>
              <div style={{ color:"#C0CAF5", marginTop:"1vh" }}>
                <span style={{ color:"#7AA2F7" }}>GA</span>
                <span style={{ color:"#E0AF68" }}>26</span>
                <span style={{ color:"#9ECE6A" }}>0001</span>
              </div>
              <div style={{ color:"#565F89", marginTop:"1.5vh" }}>
                <span style={{ color:"#7AA2F7" }}>GA</span> = school code
              </div>
              <div style={{ color:"#565F89" }}>
                <span style={{ color:"#E0AF68" }}>26</span> = year (2026)
              </div>
              <div style={{ color:"#565F89" }}>
                <span style={{ color:"#9ECE6A" }}>0001</span> = sequence
              </div>
            </div>
            <div style={{ padding:"1.8vh 1.5vw", backgroundColor:"rgba(158,206,106,0.07)", border:"1px solid rgba(158,206,106,0.18)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"1vw", fontWeight:600, color:"#9ECE6A", marginBottom:"0.5vh" }}>CSV Bulk Import</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Upload a CSV — the system fuzzy-matches class names and shows a 5-row preview before importing.</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>04</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
