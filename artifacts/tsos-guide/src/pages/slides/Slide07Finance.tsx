export default function Slide07Finance() {
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
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Attendance</div>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Finance
          </div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Operations</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Feeding</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Payroll</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Core Modules</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>Finance</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 3vh 0", maxWidth:"52vw" }}>
          Collect fees, track expenditure, and view real-time financial metrics across all payment types.
        </p>
        <div style={{ display:"flex", gap:"3vw", flex:1 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Fee Collection</div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", padding:"2vh 1.8vw", fontFamily:"'DM Mono', monospace", fontSize:"0.95vw", lineHeight:1.8 }}>
              <div style={{ color:"#565F89" }}>{"// Payment types"}</div>
              <div style={{ color:"#C0CAF5", marginTop:"0.8vh" }}>paymentType: <span style={{ color:"#9ECE6A" }}>"school_fee"</span></div>
              <div style={{ color:"#C0CAF5" }}>          | <span style={{ color:"#E0AF68" }}>"bus_fee"</span></div>
              <div style={{ color:"#C0CAF5" }}>          | <span style={{ color:"#BB9AF7" }}>"other"</span></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1vw", marginTop:"0.5vh" }}>
              <div style={{ padding:"1.5vh 1.2vw", backgroundColor:"rgba(158,206,106,0.06)", border:"1px solid rgba(158,206,106,0.15)", borderRadius:"0.5vw" }}>
                <div style={{ fontSize:"0.85vw", color:"#565F89", marginBottom:"0.5vh" }}>Collected</div>
                <div style={{ fontSize:"1.8vw", fontWeight:700, color:"#9ECE6A" }}>GHS 45,200</div>
              </div>
              <div style={{ padding:"1.5vh 1.2vw", backgroundColor:"rgba(247,118,142,0.06)", border:"1px solid rgba(247,118,142,0.15)", borderRadius:"0.5vw" }}>
                <div style={{ fontSize:"0.85vw", color:"#565F89", marginBottom:"0.5vh" }}>Arrears</div>
                <div style={{ fontSize:"1.8vw", fontWeight:700, color:"#F7768E" }}>GHS 8,750</div>
              </div>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Expenditure Categories</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"1vh" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.2vh 1.2vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:"0.4vw" }}>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>Salaries</div>
                <div style={{ display:"flex", alignItems:"center", gap:"0.8vw" }}>
                  <div style={{ width:"8vw", height:"0.5vh", backgroundColor:"rgba(255,255,255,0.08)", borderRadius:"0.3vw", overflow:"hidden" }}>
                    <div style={{ width:"72%", height:"100%", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
                  </div>
                  <div style={{ fontSize:"0.9vw", color:"#7AA2F7", fontFamily:"'DM Mono', monospace" }}>72%</div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.2vh 1.2vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:"0.4vw" }}>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>Utilities</div>
                <div style={{ display:"flex", alignItems:"center", gap:"0.8vw" }}>
                  <div style={{ width:"8vw", height:"0.5vh", backgroundColor:"rgba(255,255,255,0.08)", borderRadius:"0.3vw", overflow:"hidden" }}>
                    <div style={{ width:"14%", height:"100%", backgroundColor:"#9ECE6A", borderRadius:"0.3vw" }} />
                  </div>
                  <div style={{ fontSize:"0.9vw", color:"#9ECE6A", fontFamily:"'DM Mono', monospace" }}>14%</div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.2vh 1.2vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:"0.4vw" }}>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>Supplies</div>
                <div style={{ display:"flex", alignItems:"center", gap:"0.8vw" }}>
                  <div style={{ width:"8vw", height:"0.5vh", backgroundColor:"rgba(255,255,255,0.08)", borderRadius:"0.3vw", overflow:"hidden" }}>
                    <div style={{ width:"9%", height:"100%", backgroundColor:"#E0AF68", borderRadius:"0.3vw" }} />
                  </div>
                  <div style={{ fontSize:"0.9vw", color:"#E0AF68", fontFamily:"'DM Mono', monospace" }}>9%</div>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.2vh 1.2vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:"0.4vw" }}>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>Maintenance</div>
                <div style={{ display:"flex", alignItems:"center", gap:"0.8vw" }}>
                  <div style={{ width:"8vw", height:"0.5vh", backgroundColor:"rgba(255,255,255,0.08)", borderRadius:"0.3vw", overflow:"hidden" }}>
                    <div style={{ width:"5%", height:"100%", backgroundColor:"#BB9AF7", borderRadius:"0.3vw" }} />
                  </div>
                  <div style={{ fontSize:"0.9vw", color:"#BB9AF7", fontFamily:"'DM Mono', monospace" }}>5%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>07</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
