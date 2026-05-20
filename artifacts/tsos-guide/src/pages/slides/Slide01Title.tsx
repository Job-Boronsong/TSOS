export default function Slide01Title() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      {/* Sidebar */}
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Getting Started</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Overview
          </div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Dashboard</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Core Modules</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Students</div>
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
      {/* Main */}
      <div style={{ flex:1, padding:"8vh 6vw", display:"flex", flexDirection:"column", position:"relative", background:"radial-gradient(circle at 60% 40%, rgba(122,162,247,0.07) 0%, transparent 55%)" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"2vh" }}>User Guide</div>
        <h1 style={{ fontSize:"5vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 2vh 0", letterSpacing:"-0.02em", lineHeight:1.1 }}>
          TSOS App Guide
        </h1>
        <p style={{ fontSize:"1.4vw", color:"#9AA5CE", lineHeight:1.6, maxWidth:"42vw", margin:"0 0 6vh 0", fontWeight:400 }}>
          Everything you need to know to run your school with the Torrential School Operations Suite — every module, every workflow.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.8vh", maxWidth:"44vw" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"1.5vw", padding:"1.5vh 2vw", backgroundColor:"rgba(122,162,247,0.08)", border:"1px solid rgba(122,162,247,0.2)", borderRadius:"0.5vw" }}>
            <div style={{ width:"0.6vw", height:"0.6vw", borderRadius:"50%", backgroundColor:"#9ECE6A" }} />
            <div style={{ fontSize:"1.1vw", color:"#C0CAF5" }}>Works online and offline — data always available</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"1.5vw", padding:"1.5vh 2vw", backgroundColor:"rgba(122,162,247,0.08)", border:"1px solid rgba(122,162,247,0.2)", borderRadius:"0.5vw" }}>
            <div style={{ width:"0.6vw", height:"0.6vw", borderRadius:"50%", backgroundColor:"#9ECE6A" }} />
            <div style={{ fontSize:"1.1vw", color:"#C0CAF5" }}>Browser-based — no installation required</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"1.5vw", padding:"1.5vh 2vw", backgroundColor:"rgba(122,162,247,0.08)", border:"1px solid rgba(122,162,247,0.2)", borderRadius:"0.5vw" }}>
            <div style={{ width:"0.6vw", height:"0.6vw", borderRadius:"50%", backgroundColor:"#9ECE6A" }} />
            <div style={{ fontSize:"1.1vw", color:"#C0CAF5" }}>Three roles: Super Admin, School Admin, Teacher</div>
          </div>
        </div>
        <div style={{ marginTop:"auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>01</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
