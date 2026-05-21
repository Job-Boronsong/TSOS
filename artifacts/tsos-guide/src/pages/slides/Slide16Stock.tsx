export default function Slide16Stock() {
  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", backgroundColor:"#1A1B26", fontFamily:"'Inter', sans-serif", display:"flex", color:"#C0CAF5", position:"relative" }}>
      <div style={{ width:"22vw", height:"100vh", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"5vh 3vw", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"1vw", marginBottom:"6vh" }}>
          <div style={{ width:"1.5vw", height:"1.5vw", backgroundColor:"#7AA2F7", borderRadius:"0.3vw" }} />
          <div style={{ fontSize:"1.2vw", fontWeight:600, color:"#FFFFFF" }}>TSOS</div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Operations</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh", marginBottom:"4vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Feeding</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Discipline</div>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Announcements</div>
          <div style={{ fontSize:"1vw", color:"#73DACA", fontWeight:500, display:"flex", alignItems:"center", gap:"0.8vw" }}>
            <span style={{ width:"3px", height:"1.2vw", backgroundColor:"#73DACA", borderRadius:"2px", display:"inline-block" }} />
            Stock &amp; Inventory
          </div>
        </div>
        <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#565F89", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"2vh" }}>Admin</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.5vh" }}>
          <div style={{ fontSize:"1vw", color:"#C0CAF5", opacity:0.6 }}>Super Admin</div>
        </div>
        <div style={{ marginTop:"auto", fontSize:"0.8vw", color:"#565F89" }}>v1.0 • 2026</div>
      </div>

      <div style={{ flex:1, padding:"5vh 5vw", display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:"1vw", color:"#73DACA", textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600, marginBottom:"1.2vh" }}>Operations</div>
        <h1 style={{ fontSize:"3.5vw", fontWeight:700, color:"#FFFFFF", margin:"0 0 1vh 0", letterSpacing:"-0.02em" }}>Stock &amp; Inventory</h1>
        <p style={{ fontSize:"1.1vw", color:"#9AA5CE", lineHeight:1.5, margin:"0 0 2vh 0", maxWidth:"52vw" }}>
          Track everything the school keeps in store — stationery, cleaning supplies, furniture, and more.
        </p>

        <div style={{ display:"flex", gap:"3vw", flex:1, minHeight:0 }}>
          {/* Left column */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.2vh" }}>
            <div style={{ fontSize:"0.85vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.2vh" }}>Catalogue</div>

            {/* Item table mockup */}
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 0.8fr 1fr", gap:0, borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0.8vh 1.2vw" }}>
                <div style={{ fontSize:"0.75vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em" }}>Item</div>
                <div style={{ fontSize:"0.75vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em" }}>Category</div>
                <div style={{ fontSize:"0.75vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", textAlign:"right" }}>In Stock</div>
                <div style={{ fontSize:"0.75vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", textAlign:"right" }}>Status</div>
              </div>
              {[
                { name:"A4 Paper Ream", cat:"stationery", qty:"47", unit:"reams", status:"OK", sc:"#9ECE6A" },
                { name:"Whiteboard Markers", cat:"stationery", qty:"3", unit:"boxes", status:"Low stock", sc:"#E0AF68" },
                { name:"Bleach 5L", cat:"cleaning", qty:"0", unit:"bottles", status:"Out of stock", sc:"#F7768E" },
              ].map((row, i) => (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 0.8fr 1fr", gap:0, borderBottom:"1px solid rgba(255,255,255,0.04)", padding:"0.9vh 1.2vw", alignItems:"center" }}>
                  <div style={{ fontSize:"0.9vw", color:"#C0CAF5", fontWeight:500 }}>{row.name}</div>
                  <div style={{ fontSize:"0.8vw", color:"#565F89" }}>{row.cat}</div>
                  <div style={{ fontSize:"0.9vw", color: row.qty === "0" ? "#F7768E" : row.qty === "3" ? "#E0AF68" : "#C0CAF5", fontWeight:600, textAlign:"right" }}>{row.qty}</div>
                  <div style={{ textAlign:"right" }}>
                    <span style={{ fontSize:"0.75vw", color:row.sc, backgroundColor:`${row.sc}18`, padding:"0.2vh 0.6vw", borderRadius:"0.3vw" }}>{row.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Stock button */}
            <div style={{ display:"flex", alignItems:"center", gap:"1vw", padding:"1vh 1.2vw", backgroundColor:"rgba(115,218,202,0.06)", border:"1px solid rgba(115,218,202,0.2)", borderRadius:"0.5vw" }}>
              <span style={{ fontSize:"0.85vw", color:"#73DACA", backgroundColor:"rgba(115,218,202,0.12)", padding:"0.4vh 0.9vw", borderRadius:"0.3vw", fontWeight:600 }}>+ Add Stock</span>
              <div style={{ fontSize:"0.85vw", color:"#9AA5CE" }}>Click on any catalogue row to instantly top up its quantity — no forms needed.</div>
            </div>

            {/* Opening stock note */}
            <div style={{ padding:"1vh 1.2vw", backgroundColor:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"0.4vw" }}>
              <div style={{ fontSize:"0.85vw", color:"#565F89" }}>New items include an <span style={{ color:"#73DACA" }}>Opening Stock</span> field — set the quantity on hand at the time of creation.</div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"1.2vh" }}>
            <div style={{ fontSize:"0.85vw", color:"#565F89", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"0.2vh" }}>Movements &amp; Stock-take</div>

            {/* 3 movement types */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"0.8vw" }}>
              {[
                { type:"Intake", desc:"Stock received", badge:"+", color:"#9ECE6A" },
                { type:"Issue", desc:"Given out", badge:"−", color:"#F7768E" },
                { type:"Adjust", desc:"Correction", badge:"~", color:"#7AA2F7" },
              ].map((m) => (
                <div key={m.type} style={{ padding:"1.5vh 1vw", backgroundColor:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", textAlign:"center" }}>
                  <div style={{ fontSize:"1.4vw", fontWeight:700, color:m.color, marginBottom:"0.3vh" }}>{m.badge}</div>
                  <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#FFFFFF" }}>{m.type}</div>
                  <div style={{ fontSize:"0.8vw", color:"#565F89" }}>{m.desc}</div>
                </div>
              ))}
            </div>

            {/* Stock-take */}
            <div style={{ backgroundColor:"#16161E", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"0.5vw", padding:"2vh 1.8vw" }}>
              <div style={{ fontSize:"0.9vw", fontWeight:600, color:"#BB9AF7", marginBottom:"1vh" }}>Stock-take</div>
              <div style={{ fontSize:"0.85vw", color:"#9AA5CE", lineHeight:1.5, marginBottom:"1.5vh" }}>
                Walk the storeroom, count every item, and enter the <span style={{ color:"#FFFFFF", fontWeight:500 }}>total you see</span> — not the difference. The system compares against the balance and auto-adjusts.
              </div>
              <div style={{ display:"flex", gap:"0.8vw", alignItems:"center" }}>
                <div style={{ padding:"0.8vh 1vw", backgroundColor:"rgba(187,154,247,0.08)", border:"1px solid rgba(187,154,247,0.2)", borderRadius:"0.4vw", fontSize:"0.85vw", color:"#9AA5CE" }}>
                  System says: <span style={{ color:"#FFFFFF", fontWeight:600 }}>10</span>
                </div>
                <div style={{ fontSize:"1.2vw", color:"#565F89" }}>→</div>
                <div style={{ padding:"0.8vh 1vw", backgroundColor:"rgba(115,218,202,0.08)", border:"1px solid rgba(115,218,202,0.2)", borderRadius:"0.4vw", fontSize:"0.85vw", color:"#9AA5CE" }}>
                  You count: <span style={{ color:"#73DACA", fontWeight:600 }}>13</span>
                </div>
                <div style={{ fontSize:"1.2vw", color:"#565F89" }}>→</div>
                <div style={{ padding:"0.8vh 1vw", backgroundColor:"rgba(158,206,106,0.08)", border:"1px solid rgba(158,206,106,0.2)", borderRadius:"0.4vw", fontSize:"0.85vw", color:"#9ECE6A" }}>
                  +3 surplus
                </div>
              </div>
            </div>

            {/* Low-stock alert */}
            <div style={{ padding:"1.2vh 1.5vw", backgroundColor:"rgba(224,175,104,0.06)", border:"1px solid rgba(224,175,104,0.2)", borderRadius:"0.4vw" }}>
              <div style={{ fontSize:"0.85vw", color:"#E0AF68", fontWeight:600, marginBottom:"0.3vh" }}>Low-stock alerts</div>
              <div style={{ fontSize:"0.82vw", color:"#9AA5CE" }}>Set a Reorder Level per item. Dashboard warns when quantity drops to or below that threshold.</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop:"2vh", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1vw", color:"#565F89", fontWeight:500 }}>16</div>
          <div style={{ fontSize:"0.9vw", color:"#565F89" }}>Torrential School Operations Suite</div>
        </div>
      </div>
    </div>
  );
}
