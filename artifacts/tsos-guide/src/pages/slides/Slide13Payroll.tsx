export default function Slide13Payroll() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Staff</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Teacher Portal</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>GPS Check-in</div>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Payroll
          </div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Operations</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Discipline</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Announcements</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Staff</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>Staff Payroll</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 2.5vh 0", maxWidth:"52vw" }}>
          Two tabs: set up salary profiles per teacher, then run monthly payroll. Ghana PAYE and SSNIT auto-calculated.
        </p>
        <div style={{ display:"flex", gap:"3vw", flex:1 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ padding:"0.6vh 1.2vw", backgroundColor:"rgba(122,162,247,0.1)", border:"1px solid rgba(122,162,247,0.25)", borderRadius:"2vw", fontSize:"0.9vw", color:"#7AA2F7", fontWeight:600, alignSelf:"flex-start" }}>Tab 1 — Salary Setup</div>
            <div style={{ fontSize:"0.95vw", color:"#9AA5CE", lineHeight:1.6 }}>Assign a salary profile to each teacher. Enter basic salary plus any allowances.</div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", padding:"2vh 1.8vw", fontFamily:"'DM Mono', monospace", fontSize:"0.9vw", lineHeight:1.8 }}>
              <div style={{ color:"#565F89" }}>{"// Salary profile fields"}</div>
              <div style={{ color:"#C0CAF5", marginTop:"0.8vh" }}>basicSalary:    <span style={{ color:"#9ECE6A" }}>2500.00</span> GHS</div>
              <div style={{ color:"#C0CAF5" }}>allowances:     <span style={{ color:"#E0AF68" }}>350.00</span> GHS</div>
              <div style={{ color:"#C0CAF5" }}>ssnit_employee: <span style={{ color:"#7AA2F7" }}>5.5%</span></div>
              <div style={{ color:"#C0CAF5" }}>ssnit_employer: <span style={{ color:"#7AA2F7" }}>13%</span></div>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ padding:"0.6vh 1.2vw", backgroundColor:"rgba(158,206,106,0.1)", border:"1px solid rgba(158,206,106,0.25)", borderRadius:"2vw", fontSize:"0.9vw", color:"#9ECE6A", fontWeight:600, alignSelf:"flex-start" }}>Tab 2 — Process Payroll</div>
            <div style={{ fontSize:"0.95vw", color:"#9AA5CE", lineHeight:1.6 }}>Create a payroll run for the month. PAYE is computed per Ghana GRA 2024 tax bands. Override any entry before confirming.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"1vh" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:"0.4vw" }}>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>Gross Pay</div>
                <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"0.95vw", color:"#9ECE6A" }}>2,850.00</div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:"0.4vw" }}>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>PAYE (Income Tax)</div>
                <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"0.95vw", color:"#F7768E" }}>-267.50</div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.2vh 1.5vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", borderRadius:"0.4vw" }}>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5" }}>SSNIT (5.5%)</div>
                <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"0.95vw", color:"#F7768E" }}>-156.75</div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1.5vh 1.5vw", backgroundColor:"rgba(158,206,106,0.05)", border:"1px solid rgba(158,206,106,0.15)", borderRadius:"0.4vw" }}>
                <div style={{ fontSize:"1vw", color:"#FFFFFF", fontWeight:600 }}>Net Pay</div>
                <div style={{ fontFamily:"'DM Mono', monospace", fontSize:"1vw", color:"#9ECE6A", fontWeight:700 }}>2,425.75</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>13</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
