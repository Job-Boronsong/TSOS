export default function Slide17StaffAccess() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      {/* Sidebar */}
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Staff</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Teacher Portal</div>
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Staff Access & Role Switch
          </div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>GPS Check-in</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Admin</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Super Admin</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, padding:"5vh 5vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.2vh" }}>Staff</div>
        <h1 style={{ fontSize:"3.4vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 0.8vh 0", letterSpacing:"-0.02em" }}>Staff Access &amp; Role Switch</h1>
        <p style={{ fontSize:"1.05vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 2vh 0", maxWidth:"56vw" }}>
          A teacher who is also a Head Teacher or Finance Officer can switch to the admin view
          with one click — no second login required.
        </p>

        <div style={{ display:"flex", gap:"2.5vw", flex:1 }}>
          {/* Left column — setup */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.4vh" }}>
            <div style={{ fontSize:"0.9vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.2vh" }}>Setup (School Admin → Staff Access)</div>

            {/* Step 1 */}
            <div style={{ backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw", padding:"1.5vh 1.5vw", display:"flex", gap:"1.2vw", alignItems:"flex-start" }}>
              <div style={{ width:"1.6vw", height:"1.6vw", borderRadius:"50%", backgroundColor:"rgba(122,162,247,0.15)", border:"1px solid rgba(122,162,247,0.4)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"0.1vw" }}>
                <span style={{ fontSize:"0.8vw", color:"#7AA2F7", fontWeight:700 }}>1</span>
              </div>
              <div>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5", fontWeight:600 }}>Go to Staff Access</div>
                <div style={{ fontSize:"0.85vw", color:"#9AA5CE", marginTop:"0.3vh" }}>Open <span style={{ color:"#7AA2F7", fontFamily:"'DM Mono', monospace" }}>Settings → Staff Access</span> in the admin sidebar</div>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw", padding:"1.5vh 1.5vw", display:"flex", gap:"1.2vw", alignItems:"flex-start" }}>
              <div style={{ width:"1.6vw", height:"1.6vw", borderRadius:"50%", backgroundColor:"rgba(158,206,106,0.12)", border:"1px solid rgba(158,206,106,0.35)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"0.1vw" }}>
                <span style={{ fontSize:"0.8vw", color:"#9ECE6A", fontWeight:700 }}>2</span>
              </div>
              <div>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5", fontWeight:600 }}>Add Staff User — link to a teacher</div>
                <div style={{ fontSize:"0.85vw", color:"#9AA5CE", marginTop:"0.3vh" }}>Choose role <span style={{ color:"#BB9AF7" }}>head_teacher</span> or <span style={{ color:"#9ECE6A" }}>finance_officer</span>, then select the existing teacher from the dropdown</div>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw", padding:"1.5vh 1.5vw", display:"flex", gap:"1.2vw", alignItems:"flex-start" }}>
              <div style={{ width:"1.6vw", height:"1.6vw", borderRadius:"50%", backgroundColor:"rgba(224,175,104,0.12)", border:"1px solid rgba(224,175,104,0.35)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"0.1vw" }}>
                <span style={{ fontSize:"0.8vw", color:"#E0AF68", fontWeight:700 }}>3</span>
              </div>
              <div>
                <div style={{ fontSize:"0.95vw", color:"#C0CAF5", fontWeight:600 }}>Accounts are now linked</div>
                <div style={{ fontSize:"0.85vw", color:"#9AA5CE", marginTop:"0.3vh" }}>Teacher's portal shows their role badge and an <span style={{ color:"#E0AF68" }}>Admin Access</span> card on the dashboard</div>
              </div>
            </div>

            {/* Role permission table */}
            <div style={{ marginTop:"0.5vh" }}>
              <div style={{ fontSize:"0.9vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.8vh" }}>Role Permissions</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.6vh" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"1vw", padding:"0.9vh 1.2vw", backgroundColor:"rgba(187,154,247,0.06)", border:"1px solid rgba(187,154,247,0.18)", borderRadius:"0.4vw" }}>
                  <span style={{ fontSize:"0.85vw", color:"#BB9AF7", fontFamily:"'DM Mono', monospace", minWidth:"9vw" }}>head_teacher</span>
                  <div style={{ fontSize:"0.85vw", color:"#9AA5CE" }}>Full access to all admin modules</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"1vw", padding:"0.9vh 1.2vw", backgroundColor:"rgba(158,206,106,0.06)", border:"1px solid rgba(158,206,106,0.18)", borderRadius:"0.4vw" }}>
                  <span style={{ fontSize:"0.85vw", color:"#9ECE6A", fontFamily:"'DM Mono', monospace", minWidth:"9vw" }}>finance_officer</span>
                  <div style={{ fontSize:"0.85vw", color:"#9AA5CE" }}>Finance, Payroll, Feeding &amp; Announcements</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — switching flow */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.4vh" }}>
            <div style={{ fontSize:"0.9vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.2vh" }}>The Switch Flow</div>

            {/* Admin access card mockup */}
            <div style={{ borderRadius:"0.6vw", border:"1px solid rgba(187,154,247,0.3)", backgroundColor:"rgba(187,154,247,0.07)", padding:"1.8vh 1.8vw", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:"0.95vw", color:"#BB9AF7", fontWeight:600 }}>Head Teacher — Admin Access</div>
                <div style={{ fontSize:"0.82vw", color:"rgba(187,154,247,0.7)", marginTop:"0.3vh" }}>You have access to all school management modules.</div>
              </div>
              <div style={{ backgroundColor:"#7B5EA7", color:"#FFFFFF", fontSize:"0.82vw", fontWeight:600, padding:"0.6vh 1.2vw", borderRadius:"0.35vw", whiteSpace:"nowrap" }}>
                Go to Admin View
              </div>
            </div>

            {/* Arrow */}
            <div style={{ display:"flex", alignItems:"center", gap:"0.8vw", paddingLeft:"1vw" }}>
              <div style={{ width:"0.4vw", height:"0.4vw", borderRadius:"50%", backgroundColor:"#565F89" }} />
              <div style={{ fontSize:"0.85vw", color:"#565F89" }}>One click — no password prompt — lands on Admin Dashboard or Finance page</div>
            </div>

            {/* Back button mockup */}
            <div style={{ backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"0.6vw", padding:"1.8vh 1.8vw" }}>
              <div style={{ fontSize:"0.85vw", color:"#565F89", marginBottom:"1vh", textTransform:"uppercase", letterSpacing:"0.05em" }}>Admin sidebar footer (head_teacher / finance_officer)</div>
              <div style={{ display:"flex", alignItems:"center", gap:"0.8vw", padding:"0.9vh 1.2vw", backgroundColor:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"0.4vw", width:"fit-content" }}>
                <div style={{ width:"0.9vw", height:"0.9vw", border:"2px solid #C0CAF5", borderRadius:"0.15vw", opacity:0.6 }} />
                <span style={{ fontSize:"0.9vw", color:"#C0CAF5" }}>Back to Teacher Portal</span>
              </div>
            </div>

            {/* Info note */}
            <div style={{ padding:"1.4vh 1.5vw", backgroundColor:"rgba(122,162,247,0.06)", border:"1px solid rgba(122,162,247,0.18)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"0.88vw", color:"#9AA5CE", lineHeight:1.6 }}>
                Both sessions share the same browser tab. Switching never logs the teacher out — they can freely move between the teacher dashboard and admin modules.
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop:"2vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>18</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
