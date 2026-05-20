export default function Slide03Dashboard() {
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
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Students</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Classes</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Attendance</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Finance</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Getting Started</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>The Dashboard</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 3vh 0", maxWidth:"50vw" }}>
          After login, the dashboard gives a live snapshot of your school's health.
        </p>
        {/* Mock dashboard */}
        <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.8vw", padding:"2.5vh 2vw", flex:1, display:"flex", flexDirection:"column", gap:"2vh" }}>
          {/* Top stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"1.2vw" }}>
            <div style={{ backgroundColor:"rgba(122,162,247,0.08)", border:"1px solid rgba(122,162,247,0.18)", borderRadius:"0.5vw", padding:"1.5vh 1.2vw" }}>
              <div style={{ fontSize:"0.85vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.8vh" }}>Students</div>
              <div style={{ fontSize:"2.2vw", fontWeight:700, color:"#7AA2F7" }}>342</div>
            </div>
            <div style={{ backgroundColor:"rgba(158,206,106,0.08)", border:"1px solid rgba(158,206,106,0.18)", borderRadius:"0.5vw", padding:"1.5vh 1.2vw" }}>
              <div style={{ fontSize:"0.85vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.8vh" }}>Present Today</div>
              <div style={{ fontSize:"2.2vw", fontWeight:700, color:"#9ECE6A" }}>91%</div>
            </div>
            <div style={{ backgroundColor:"rgba(224,175,104,0.08)", border:"1px solid rgba(224,175,104,0.18)", borderRadius:"0.5vw", padding:"1.5vh 1.2vw" }}>
              <div style={{ fontSize:"0.85vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.8vh" }}>Fees Collected</div>
              <div style={{ fontSize:"2.2vw", fontWeight:700, color:"#E0AF68" }}>83.8%</div>
            </div>
            <div style={{ backgroundColor:"rgba(187,154,247,0.08)", border:"1px solid rgba(187,154,247,0.18)", borderRadius:"0.5vw", padding:"1.5vh 1.2vw" }}>
              <div style={{ fontSize:"0.85vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.8vh" }}>Teachers</div>
              <div style={{ fontSize:"2.2vw", fontWeight:700, color:"#BB9AF7" }}>18</div>
            </div>
          </div>
          {/* Sync status + subscription banner */}
          <div style={{ display:"flex", gap:"1.5vw" }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:"1vw", padding:"1.5vh 1.5vw", backgroundColor:"rgba(158,206,106,0.08)", border:"1px solid rgba(158,206,106,0.2)", borderRadius:"0.5vw" }}>
              <div style={{ width:"0.7vw", height:"0.7vw", borderRadius:"50%", backgroundColor:"#9ECE6A" }} />
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"1vw", color:"#9ECE6A" }}>Online</div>
              <div style={{ fontSize:"0.95vw", color:"#565F89", marginLeft:"0.5vw" }}>Last synced 2 mins ago</div>
            </div>
            <div style={{ flex:2, display:"flex", alignItems:"center", gap:"1vw", padding:"1.5vh 1.5vw", backgroundColor:"rgba(224,175,104,0.06)", border:"1px solid rgba(224,175,104,0.18)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"0.95vw", color:"#E0AF68" }}>Subscription expires in 12 days</div>
              <div style={{ marginLeft:"auto", fontFamily:"'DM Mono', monospace", fontSize:"0.9vw", color:"#565F89" }}>Renew via Paystack</div>
            </div>
          </div>
          {/* Key info */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5vw" }}>
            <div style={{ backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw", padding:"1.5vh 1.5vw" }}>
              <div style={{ fontSize:"0.95vw", color:"#565F89", marginBottom:"1vh" }}>Login</div>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"1vw", color:"#C0CAF5" }}>admin_greenfield / admin123</div>
            </div>
            <div style={{ backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw", padding:"1.5vh 1.5vw" }}>
              <div style={{ fontSize:"0.95vw", color:"#565F89", marginBottom:"1vh" }}>Super Admin</div>
              <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"1vw", color:"#C0CAF5" }}>superadmin / superadmin123</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>03</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
