export default function Slide10ScoreEntry() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Academic</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Report Cards</div>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Score Entry
          </div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Staff</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Teacher Portal</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>GPS Check-in</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Payroll</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Academic</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>Score Entry</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 2.5vh 0", maxWidth:"52vw" }}>
          Teachers enter scores across five components. Total and grade are computed automatically.
        </p>
        <div style={{ display:"flex", gap:"3vw", flex:1 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.2vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>The 5 Components</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.2vh 1.5vw", backgroundColor:"rgba(122,162,247,0.06)", border:"1px solid rgba(122,162,247,0.15)", borderRadius:"0.4vw" }}>
              <div style={{ fontSize:"1.05vw", color:"#C0CAF5", fontWeight:500 }}>Class Work</div>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"1vw", color:"#7AA2F7" }}>/ 10</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.2vh 1.5vw", backgroundColor:"rgba(158,206,106,0.06)", border:"1px solid rgba(158,206,106,0.15)", borderRadius:"0.4vw" }}>
              <div style={{ fontSize:"1.05vw", color:"#C0CAF5", fontWeight:500 }}>Class Test</div>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"1vw", color:"#9ECE6A" }}>/ 20</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.2vh 1.5vw", backgroundColor:"rgba(224,175,104,0.06)", border:"1px solid rgba(224,175,104,0.15)", borderRadius:"0.4vw" }}>
              <div style={{ fontSize:"1.05vw", color:"#C0CAF5", fontWeight:500 }}>Homework</div>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"1vw", color:"#E0AF68" }}>/ 5</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.2vh 1.5vw", backgroundColor:"rgba(187,154,247,0.06)", border:"1px solid rgba(187,154,247,0.15)", borderRadius:"0.4vw" }}>
              <div style={{ fontSize:"1.05vw", color:"#C0CAF5", fontWeight:500 }}>Project Work</div>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"1vw", color:"#BB9AF7" }}>/ 5</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,158,100,0.06)", border:"1px solid rgba(255,158,100,0.15)", borderRadius:"0.4vw" }}>
              <div style={{ fontSize:"1.05vw", color:"#C0CAF5", fontWeight:500 }}>Exam Score</div>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"1vw", color:"#FF9E64" }}>/ 60</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"0.4vw", marginTop:"0.5vh" }}>
              <div style={{ fontSize:"1.1vw", color:"#FFFFFF", fontWeight:700 }}>Total</div>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"1.1vw", color:"#FFFFFF", fontWeight:700 }}>/ 100</div>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Sample Score Record</div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", padding:"2vh 1.8vw", fontFamily:"'DM Mono', monospace", fontSize:"0.95vw", lineHeight:1.9 }}>
              <div style={{ color:"#565F89" }}>{"// Ama Mensah — Mathematics — Term 1"}</div>
              <div style={{ color:"#C0CAF5", marginTop:"0.8vh" }}>
                classWork:   <span style={{ color:"#7AA2F7" }}>9</span> <span style={{ color:"#565F89" }}>/ 10</span>
              </div>
              <div style={{ color:"#C0CAF5" }}>
                classTest:   <span style={{ color:"#9ECE6A" }}>17</span> <span style={{ color:"#565F89" }}>/ 20</span>
              </div>
              <div style={{ color:"#C0CAF5" }}>
                homework:    <span style={{ color:"#E0AF68" }}>5</span> <span style={{ color:"#565F89" }}>/ 5</span>
              </div>
              <div style={{ color:"#C0CAF5" }}>
                projectWork: <span style={{ color:"#BB9AF7" }}>4</span> <span style={{ color:"#565F89" }}>/ 5</span>
              </div>
              <div style={{ color:"#C0CAF5" }}>
                examScore:   <span style={{ color:"#FF9E64" }}>52</span> <span style={{ color:"#565F89" }}>/ 60</span>
              </div>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", marginTop:"1vh", paddingTop:"1vh", color:"#FFFFFF", fontWeight:500 }}>
                total: <span style={{ color:"#9ECE6A" }}>87</span>  grade: <span style={{ color:"#9ECE6A" }}>A1</span>
              </div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(122,162,247,0.06)", border:"1px solid rgba(122,162,247,0.15)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Teacher can override the auto-computed remarks. Remarks locked to BECE descriptors by default.</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>10</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
