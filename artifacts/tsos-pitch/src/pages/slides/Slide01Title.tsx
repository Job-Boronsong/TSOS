const base = import.meta.env.BASE_URL;

export default function Slide01Title() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#0C0F1A",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        position: "relative",
        color: "#FFFFFF",
      }}
    >
      {/* Hero image fills right 55% */}
      <img
        src={`${base}hero-school.png`}
        crossOrigin="anonymous"
        alt="African school campus"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "58vw",
          height: "100vh",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />
      {/* Dark gradient overlay over image */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "58vw",
          height: "100vh",
          background: "linear-gradient(90deg, #0C0F1A 0%, rgba(12,15,26,0.7) 40%, rgba(12,15,26,0.1) 100%)",
        }}
      />
      {/* Grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "4vw 4vw",
          pointerEvents: "none",
        }}
      />
      {/* Blue glow bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: "-20vh",
          left: "-10vw",
          width: "50vw",
          height: "50vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,127,255,0.10) 0%, rgba(79,127,255,0) 70%)",
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: "5vh",
          left: "5vw",
          display: "flex",
          alignItems: "center",
          gap: "1vw",
          zIndex: 10,
        }}
      >
        <div style={{ width: "2vw", height: "2vw", backgroundColor: "#4F7FFF", borderRadius: "0.4vw" }} />
        <div style={{ fontSize: "1.2vw", fontWeight: 700, letterSpacing: "-0.02em" }}>TSOS</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: "5vh",
          right: "5vw",
          fontSize: "1vw",
          fontWeight: 400,
          color: "rgba(255,255,255,0.4)",
          zIndex: 10,
        }}
      >
        2026
      </div>

      {/* Main content — left column */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100vh",
          paddingLeft: "5vw",
          maxWidth: "52vw",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5vw",
            padding: "0.6vh 1.2vw",
            backgroundColor: "rgba(124,107,240,0.15)",
            border: "1px solid rgba(124,107,240,0.35)",
            borderRadius: "2vw",
            color: "#7C6BF0",
            fontSize: "1vw",
            fontWeight: 600,
            marginBottom: "3vh",
            letterSpacing: "0.05em",
            alignSelf: "flex-start",
          }}
        >
          <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "50%", backgroundColor: "#7C6BF0" }} />
          TSOS v1.0
        </div>

        <h1
          style={{
            fontSize: "5.5vw",
            fontWeight: 800,
            margin: "0 0 2.5vh 0",
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            textWrap: "balance",
          }}
        >
          Torrential School
          <br />
          <span style={{ color: "#4F7FFF" }}>Operations Suite</span>
        </h1>

        <p
          style={{
            fontSize: "1.6vw",
            fontWeight: 300,
            color: "rgba(255,255,255,0.65)",
            margin: "0 0 5vh 0",
            lineHeight: 1.55,
            maxWidth: "38vw",
            textWrap: "pretty",
          }}
        >
          One system. Every school operation. Works anywhere.
        </p>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "1.2vw", flexWrap: "wrap" }}>
          <div
            style={{
              padding: "0.9vh 1.4vw",
              backgroundColor: "rgba(79,127,255,0.1)",
              border: "1px solid rgba(79,127,255,0.25)",
              borderRadius: "0.4vw",
              fontSize: "1vw",
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Offline-First
          </div>
          <div
            style={{
              padding: "0.9vh 1.4vw",
              backgroundColor: "rgba(79,127,255,0.1)",
              border: "1px solid rgba(79,127,255,0.25)",
              borderRadius: "0.4vw",
              fontSize: "1vw",
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Browser-Based
          </div>
          <div
            style={{
              padding: "0.9vh 1.4vw",
              backgroundColor: "rgba(79,127,255,0.1)",
              border: "1px solid rgba(79,127,255,0.25)",
              borderRadius: "0.4vw",
              fontSize: "1vw",
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Built for Africa
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "4vh",
          left: "5vw",
          fontSize: "0.9vw",
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.08em",
          fontWeight: 400,
          zIndex: 10,
        }}
      >
        TORRENTIAL SCHOOL OPERATIONS SUITE
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "4vh",
          right: "5vw",
          fontSize: "0.9vw",
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.05em",
          zIndex: 10,
        }}
      >
        01 / 17
      </div>
    </div>
  );
}
