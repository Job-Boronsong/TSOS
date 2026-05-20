export default function Slide16SuperAdmin() {
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
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Dashboard</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Admin</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Super Admin
          </div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Platform Settings</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column", background:"radial-gradient(circle at 70% 50%, rgba(122,162,247,0.05) 0%, transparent 50%)" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Admin</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>Super Admin</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 2.5vh 0", maxWidth:"52vw" }}>
          The super admin account controls the entire platform — all schools, pricing, and subscriptions.
        </p>
        <div style={{ display:"flex", gap:"3vw", flex:1 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Super Admin Capabilities</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"1vh" }}>
              <div style={{ padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw", display:"flex", alignItems:"center", gap:"1vw" }}>
                <div style={{ width:"0.5vw", height:"0.5vw", borderRadius:"50%", backgroundColor:"#7AA2F7", flexShrink:0 }} />
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Create new schools with admin credentials</div>
              </div>
              <div style={{ padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw", display:"flex", alignItems:"center", gap:"1vw" }}>
                <div style={{ width:"0.5vw", height:"0.5vw", borderRadius:"50%", backgroundColor:"#9ECE6A", flexShrink:0 }} />
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>View all schools — active, grace, expired, cancelled</div>
              </div>
              <div style={{ padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw", display:"flex", alignItems:"center", gap:"1vw" }}>
                <div style={{ width:"0.5vw", height:"0.5vw", borderRadius:"50%", backgroundColor:"#E0AF68", flexShrink:0 }} />
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Set the monthly platform price (default 500 GHS)</div>
              </div>
              <div style={{ padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw", display:"flex", alignItems:"center", gap:"1vw" }}>
                <div style={{ width:"0.5vw", height:"0.5vw", borderRadius:"50%", backgroundColor:"#BB9AF7", flexShrink:0 }} />
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>View subscription history and top-up previews</div>
              </div>
            </div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", padding:"2vh 1.8vw", fontFamily:"'DM Mono', monospace", fontSize:"0.9vw", lineHeight:1.8, marginTop:"0.5vh" }}>
              <div style={{ color:"#565F89" }}>{"// Default login"}</div>
              <div style={{ color:"#C0CAF5", marginTop:"0.5vh" }}>username: <span style={{ color:"#7AA2F7" }}>"superadmin"</span></div>
              <div style={{ color:"#C0CAF5" }}>password: <span style={{ color:"#7AA2F7" }}>"superadmin123"</span></div>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Subscription Lifecycle</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"1vh" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"1.5vw", padding:"1.2vh 1.5vw", backgroundColor:"rgba(158,206,106,0.06)", border:"1px solid rgba(158,206,106,0.15)", borderRadius:"0.4vw" }}>
                <span style={{ fontSize:"0.85vw", color:"#9ECE6A", fontFamily:"'DM Mono', monospace", minWidth:"5vw" }}>active</span>
                <div style={{ fontSize:"0.9vw", color:"#9AA5CE" }}>School is within subscription period</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"1.5vw", padding:"1.2vh 1.5vw", backgroundColor:"rgba(224,175,104,0.06)", border:"1px solid rgba(224,175,104,0.15)", borderRadius:"0.4vw" }}>
                <span style={{ fontSize:"0.85vw", color:"#E0AF68", fontFamily:"'DM Mono', monospace", minWidth:"5vw" }}>grace</span>
                <div style={{ fontSize:"0.9vw", color:"#9AA5CE" }}>Expired — 3-day grace window before lock</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"1.5vw", padding:"1.2vh 1.5vw", backgroundColor:"rgba(247,118,142,0.06)", border:"1px solid rgba(247,118,142,0.15)", borderRadius:"0.4vw" }}>
                <span style={{ fontSize:"0.85vw", color:"#F7768E", fontFamily:"'DM Mono', monospace", minWidth:"5vw" }}>expired</span>
                <div style={{ fontSize:"0.9vw", color:"#9AA5CE" }}>Deactivated by daily cron at 08:00 Accra</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"1.5vw", padding:"1.2vh 1.5vw", backgroundColor:"rgba(86,95,137,0.08)", border:"1px solid rgba(86,95,137,0.2)", borderRadius:"0.4vw" }}>
                <span style={{ fontSize:"0.85vw", color:"#565F89", fontFamily:"'DM Mono', monospace", minWidth:"5vw" }}>cancelled</span>
                <div style={{ fontSize:"0.9vw", color:"#9AA5CE" }}>Admin cancelled — active until expiry date</div>
              </div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(122,162,247,0.06)", border:"1px solid rgba(122,162,247,0.15)", borderRadius:"0.5vw", marginTop:"0.5vh" }}>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Discounts: 3–6 months = 5% off, 7+ months = 10% off. Applied automatically at checkout.</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>16</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
