export default function Slide09ReportCards() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Academic</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Report Cards
          </div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Score Entry</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Timetable</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Staff</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Teacher Portal</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>GPS Check-in</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Academic</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>Report Cards</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 2.5vh 0", maxWidth:"52vw" }}>
          View and print a complete academic report for any student. Grades compute automatically from teacher scores.
        </p>
        <div style={{ display:"flex", gap:"3vw", flex:1 }}>
          <div style={{ flex:"0 0 28vw", display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Ghana BECE Grading Scale</div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr", padding:"1.2vh 1.5vw", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Grade</div>
                <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Range</div>
                <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Remark</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr", padding:"1vh 1.5vw", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize:"0.95vw", color:"#9ECE6A", fontWeight:600 }}>A1</div>
                <div style={{ fontSize:"0.95vw", color:"#565F89", fontFamily:"'DM Mono', monospace" }}>80–100</div>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Excellent</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr", padding:"1vh 1.5vw", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize:"0.95vw", color:"#7AA2F7", fontWeight:600 }}>B2</div>
                <div style={{ fontSize:"0.95vw", color:"#565F89", fontFamily:"'DM Mono', monospace" }}>70–79</div>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Very Good</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr", padding:"1vh 1.5vw", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize:"0.95vw", color:"#E0AF68", fontWeight:600 }}>C4</div>
                <div style={{ fontSize:"0.95vw", color:"#565F89", fontFamily:"'DM Mono', monospace" }}>60–64</div>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Credit</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr", padding:"1vh 1.5vw" }}>
                <div style={{ fontSize:"0.95vw", color:"#F7768E", fontWeight:600 }}>F9</div>
                <div style={{ fontSize:"0.95vw", color:"#565F89", fontFamily:"'DM Mono', monospace" }}>0–44</div>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Fail</div>
              </div>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>How to View a Report</div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"1.2vw", padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ width:"2.2vw", height:"2.2vw", borderRadius:"50%", backgroundColor:"rgba(122,162,247,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1vw", fontWeight:700, color:"#7AA2F7", flexShrink:0 }}>1</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Go to a student's profile and click "Report Card"</div>
            </div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"1.2vw", padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ width:"2.2vw", height:"2.2vw", borderRadius:"50%", backgroundColor:"rgba(158,206,106,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1vw", fontWeight:700, color:"#9ECE6A", flexShrink:0 }}>2</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Select the term and academic year from the dropdowns</div>
            </div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:"1.2vw", padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ width:"2.2vw", height:"2.2vw", borderRadius:"50%", backgroundColor:"rgba(224,175,104,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1vw", fontWeight:700, color:"#E0AF68", flexShrink:0 }}>3</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Click Print — browser print dialog opens with the formatted report</div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(122,162,247,0.06)", border:"1px solid rgba(122,162,247,0.15)", borderRadius:"0.5vw", marginTop:"0.5vh" }}>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Class position is auto-calculated by comparing scores against all classmates in the same term.</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>09</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
