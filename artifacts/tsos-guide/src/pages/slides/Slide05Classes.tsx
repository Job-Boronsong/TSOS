export default function Slide05Classes() {
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
          <div style={{ fontSize:"1vw", color:"#7AA2F7", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#7AA2F7", borderRadius:"2px", display:"inline-block" }} />
            Classes
          </div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Attendance</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Finance</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Academic</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Report Cards</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Score Entry</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>
      <div style={{ flex:1, padding:"6vh 6vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#7AA2F7", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.5vh" }}>Core Modules</div>
        <h1 style={{ fontSize:"3.8vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1.2vh 0", letterSpacing:"-0.02em" }}>Classes</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 3vh 0", maxWidth:"52vw" }}>
          Organise students into classes by level. Each level has different teacher assignment rules.
        </p>
        <div style={{ display:"flex", gap:"2.5vw", flex:1 }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Four Levels</div>
            <div style={{ display:"flex", gap:"1vw" }}>
              <div style={{ flex:1, padding:"1.5vh 1vw", backgroundColor:"rgba(122,162,247,0.08)", border:"1px solid rgba(122,162,247,0.2)", borderRadius:"0.5vw", textAlign:"center" }}>
                <div style={{ fontSize:"1.05vw", fontWeight:700, color:"#7AA2F7" }}>Nursery</div>
                <div style={{ fontSize:"0.9vw", color:"#565F89", marginTop:"0.4vh" }}>Homeroom teacher</div>
              </div>
              <div style={{ flex:1, padding:"1.5vh 1vw", backgroundColor:"rgba(158,206,106,0.08)", border:"1px solid rgba(158,206,106,0.2)", borderRadius:"0.5vw", textAlign:"center" }}>
                <div style={{ fontSize:"1.05vw", fontWeight:700, color:"#9ECE6A" }}>KG</div>
                <div style={{ fontSize:"0.9vw", color:"#565F89", marginTop:"0.4vh" }}>Homeroom teacher</div>
              </div>
              <div style={{ flex:1, padding:"1.5vh 1vw", backgroundColor:"rgba(224,175,104,0.08)", border:"1px solid rgba(224,175,104,0.2)", borderRadius:"0.5vw", textAlign:"center" }}>
                <div style={{ fontSize:"1.05vw", fontWeight:700, color:"#E0AF68" }}>Primary</div>
                <div style={{ fontSize:"0.9vw", color:"#565F89", marginTop:"0.4vh" }}>Homeroom teacher</div>
              </div>
              <div style={{ flex:1, padding:"1.5vh 1vw", backgroundColor:"rgba(187,154,247,0.08)", border:"1px solid rgba(187,154,247,0.2)", borderRadius:"0.5vw", textAlign:"center" }}>
                <div style={{ fontSize:"1.05vw", fontWeight:700, color:"#BB9AF7" }}>JHS</div>
                <div style={{ fontSize:"0.9vw", color:"#565F89", marginTop:"0.4vh" }}>Subject teachers</div>
              </div>
            </div>
            <div style={{ padding:"1.8vh 1.5vw", backgroundColor:"rgba(187,154,247,0.07)", border:"1px solid rgba(187,154,247,0.18)", borderRadius:"0.5vw", marginTop:"0.5vh" }}>
              <div style={{ fontSize:"1vw", fontWeight:600, color:"#BB9AF7", marginBottom:"0.5vh" }}>JHS subject assignment</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>JHS classes use per-subject teachers. Go to the class and add subjects — assign a different teacher to each subject.</div>
            </div>
            <div style={{ padding:"1.5vh 1.5vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.5vw" }}>
              <div style={{ fontSize:"1vw", fontWeight:600, color:"#FFFFFF", marginBottom:"0.4vh" }}>Class fields</div>
              <div style={{ fontSize:"0.95vw", color:"#9AA5CE" }}>Name, grade, level, student count (auto), teacher name (auto from assignment)</div>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.5vh" }}>
            <div style={{ fontSize:"1vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.3vh" }}>Class List</div>
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"1.2vh 1.5vw", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Class Name</div>
                <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Level</div>
                <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Students</div>
                <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Teacher</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"1.2vh 1.5vw", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>Primary 1A</div>
                <div style={{ fontSize:"1vw" }}><span style={{ color:"#E0AF68", backgroundColor:"rgba(224,175,104,0.1)", padding:"0.2vh 0.5vw", borderRadius:"0.3vw", fontSize:"0.85vw" }}>primary</span></div>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>34</div>
                <div style={{ fontSize:"1vw", color:"#9AA5CE" }}>Mrs. Asante</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"1.2vh 1.5vw", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>JHS 2</div>
                <div style={{ fontSize:"1vw" }}><span style={{ color:"#BB9AF7", backgroundColor:"rgba(187,154,247,0.1)", padding:"0.2vh 0.5vw", borderRadius:"0.3vw", fontSize:"0.85vw" }}>jhs</span></div>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>28</div>
                <div style={{ fontSize:"1vw", color:"#9AA5CE" }}>Subjects</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"1.2vh 1.5vw" }}>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>KG 1</div>
                <div style={{ fontSize:"1vw" }}><span style={{ color:"#9ECE6A", backgroundColor:"rgba(158,206,106,0.1)", padding:"0.2vh 0.5vw", borderRadius:"0.3vw", fontSize:"0.85vw" }}>kg</span></div>
                <div style={{ fontSize:"1vw", color:"#C0CAF5" }}>22</div>
                <div style={{ fontSize:"1vw", color:"#9AA5CE" }}>Mr. Boateng</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:"2.5vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>05</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
