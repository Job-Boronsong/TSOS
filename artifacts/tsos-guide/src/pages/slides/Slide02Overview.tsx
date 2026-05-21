export default function Slide02Overview() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Getting Started</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Overview</div>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Dashboard
          </div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Core Modules</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Students</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Classes</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Attendance</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Finance</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Staff</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Teacher Portal</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Payroll</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"2vh" }}>Getting Started</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.5vh 0", letterSpacing:"-0.02em" }}>Module Overview</h1>
        <p style={{ fontSize:"1.2vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 4vh 0", maxWidth:"50vw" }}>
          TSOS is organized into seven functional areas. Each handles a distinct part of school operations.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"1.2vw", flex:1 }}>
          <div style={{ backgroundColor:"rgba(122,162,247,0.06)", border:"1px solid rgba(122,162,247,0.2)", borderRadius:"0.6vw", padding:"2vh 2vw" }}>
            <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"1vh" }}>Students</div>
            <div style={{ fontSize:"0.95vw", color:"#9AA5CE", lineHeight:1.6 }}>Enrollment, ID cards, class history, fee waivers, promotions, bulk CSV import</div>
          </div>
          <div style={{ backgroundColor:"rgba(158,206,106,0.06)", border:"1px solid rgba(158,206,106,0.2)", borderRadius:"0.6vw", padding:"2vh 2vw" }}>
            <div style={{ fontSize:"1vw", color:"#9ECE6A", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"1vh" }}>Attendance</div>
            <div style={{ fontSize:"0.95vw", color:"#9AA5CE", lineHeight:1.6 }}>Daily student register, teacher GPS check-in, absence reports</div>
          </div>
          <div style={{ backgroundColor:"rgba(224,175,104,0.06)", border:"1px solid rgba(224,175,104,0.2)", borderRadius:"0.6vw", padding:"2vh 2vw" }}>
            <div style={{ fontSize:"1vw", color:"#E0AF68", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"1vh" }}>Finance</div>
            <div style={{ fontSize:"0.95vw", color:"#9AA5CE", lineHeight:1.6 }}>Fee collection, expenditure tracking, Paystack subscription billing</div>
          </div>
          <div style={{ backgroundColor:"rgba(187,154,247,0.06)", border:"1px solid rgba(187,154,247,0.2)", borderRadius:"0.6vw", padding:"2vh 2vw" }}>
            <div style={{ fontSize:"1vw", color:"#BB9AF7", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"1vh" }}>Academic</div>
            <div style={{ fontSize:"0.95vw", color:"#9AA5CE", lineHeight:1.6 }}>Score entry, automated report cards, class timetable, term management</div>
          </div>
          <div style={{ backgroundColor:"rgba(255,158,100,0.06)", border:"1px solid rgba(255,158,100,0.2)", borderRadius:"0.6vw", padding:"2vh 2vw" }}>
            <div style={{ fontSize:"1vw", color:"#FF9E64", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"1vh" }}>Staff</div>
            <div style={{ fontSize:"0.95vw", color:"#9AA5CE", lineHeight:1.6 }}>Payroll with PAYE/SSNIT, discipline log, announcements, calendar</div>
          </div>
          <div style={{ backgroundColor:"rgba(122,162,247,0.06)", border:"1px solid rgba(122,162,247,0.15)", borderRadius:"0.6vw", padding:"2vh 2vw" }}>
            <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"1vh" }}>Admin</div>
            <div style={{ fontSize:"0.95vw", color:"#9AA5CE", lineHeight:1.6 }}>Multi-school management, subscription billing, school settings</div>
          </div>
          <div style={{ backgroundColor:"rgba(115,218,202,0.06)", border:"1px solid rgba(115,218,202,0.25)", borderRadius:"0.6vw", padding:"2vh 2vw", gridColumn:"1 / -1", display:"flex", alignItems:"center", gap:"3vw" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.8vw", marginBottom:"0.6vh" }}>
                <div style={{ fontSize:"1vw", color:"#73DACA", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>Stock &amp; Inventory</div>
                <span style={{ fontSize:"0.75vw", color:"#73DACA", backgroundColor:"rgba(115,218,202,0.15)", padding:"0.2vh 0.6vw", borderRadius:"0.3vw", fontWeight:600 }}>New</span>
              </div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE", lineHeight:1.5 }}>Item catalogue with categories &amp; reorder levels, quick Add Stock per item, intake/issue/adjustment movements, periodic stock-take (physical count), low-stock dashboard alerts</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"3vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>02</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
