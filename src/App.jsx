import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

// Tessellation grid configuration
const GRID_COLS = 16
const GRID_ROWS = 10

function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [partnersVisible, setPartnersVisible] = useState(false)
  const heroRef = useRef(null)
  const tilesRef = useRef([])
  const partnersRef = useRef(null)

  // Track mouse position relative to hero
  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    })
  }, [])

  useEffect(() => {
    const hero = heroRef.current
    if (hero) {
      hero.addEventListener('mousemove', handleMouseMove, { passive: true })
      return () => hero.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleMouseMove])

  // Trigger partners line animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPartnersVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (partnersRef.current) {
      observer.observe(partnersRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Calculate tile opacity and transform based on mouse distance
  const getTileStyle = (index) => {
    const col = index % GRID_COLS
    const row = Math.floor(index / GRID_COLS)
    const tileX = (col + 0.5) / GRID_COLS
    const tileY = (row + 0.5) / GRID_ROWS

    const dx = mousePos.x - tileX
    const dy = mousePos.y - tileY
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Proximity effect - tiles closer to mouse are brighter
    const maxDistance = 0.4
    const proximity = Math.max(0, 1 - distance / maxDistance)
    const opacity = 0.03 + proximity * 0.22

    // Subtle shift toward mouse
    const shiftX = dx * proximity * 3
    const shiftY = dy * proximity * 3

    return {
      opacity,
      transform: `translate(${shiftX}px, ${shiftY}px)`,
    }
  }

  return (
    <div className="site">
      {/* Hero */}
      <header className="hero" ref={heroRef}>
        {/* Tessellation Grid */}
        <div className="tessellation" aria-hidden="true">
          {[...Array(GRID_COLS * GRID_ROWS)].map((_, i) => (
            <div
              key={i}
              className="tile"
              ref={el => tilesRef.current[i] = el}
              style={getTileStyle(i)}
            />
          ))}
        </div>

        <div className="hero-content">
        
          <h1 className="hero-title">
            <span className="title-main title-keeping">Keeping it</span>
            <span className="title-main title-urban">Urban</span>
            {/* <span className="title-sub">Art, Tech, Collective</span> */}
            
          </h1>
          <div className="hero-marker" style={{ marginBottom: "3px" }}>March 24, 2026 · <span style={{ color: "#fafafa" }}>NYC Open Data Week 2026</span></div>
          <div className="hero-marker" style={{marginTop: "3px"}}>Cornell Tech, NYC</div>
          <nav className="hero-cta">
            <a href="#open-call" className="cta-button cta-primary">Open Call</a>
            <a href="#pitches" className="cta-button cta-primary">Startup Pitches</a>
            <a href="#attend" className="cta-button">Attend</a>
          </nav>
        </div>
      </header>

      {/* Context & Reputability */}
      <section className="context">
        <div className="context-grid">
          <div className="signal">
            <span className="signal-number">150+</span>
            <span className="signal-label"><span className="signal-title">Participants</span><br/>within Tech, Civic & Art in NYC</span>
          </div>
          <div className="signal">
            <span className="signal-number">10+</span>
            <span className="signal-label"><span className="signal-title">Founders</span><br/>Pitching Urban & Civic Ventures</span>
          </div>
          <div className="signal">
            <span className="signal-number">15+</span>
            <span className="signal-label"><span className="signal-title">Artists</span><br/>Showcase in Immersive Gallery</span>
          </div>
        </div>
        {/* Partner Logos */}
        <div className="partners-section" ref={partnersRef}>
          <h3 className="partners-title">Our Partners</h3>
          <svg className={`partners-line ${partnersVisible ? 'animate' : ''}`} viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
            <path
              className="line-path"
              d="M-20,90 C100,90 120,150 240,130 S400,30 540,70 S720,170 900,110 S1050,50 1220,90"
              fill="none"
              strokeWidth="1.5"
            />
            <path
              className="line-path"
              d="M-20,100 C100,100 120,160 240,140 S400,40 540,80 S720,180 900,120 S1050,60 1220,100"
              fill="none"
              strokeWidth="1.5"
            />
            <path
              className="line-path"
              d="M-20,110 C100,110 120,170 240,150 S400,50 540,90 S720,190 900,130 S1050,70 1220,110"
              fill="none"
              strokeWidth="1.5"
            />
          </svg>
          <div className="partners-logos">
            <a href="https://tech.cornell.edu/" target="_blank" rel="noopener noreferrer" className="partner-logo">
              <img src="/keepingurban/cornell.png" alt="Cornell University" />
            </a>
            <a href="https://www.nyc.gov/content/oti/pages/" target="_blank" rel="noopener noreferrer" className="partner-logo">
              <img src="/keepingurban/nyc_oti.png" alt="NYC Office of Technology & Innovation" />
            </a>
            <a href="https://opendata.cityofnewyork.us/" target="_blank" rel="noopener noreferrer" className="partner-logo">
              <img src="/keepingurban/nyc_open_data.png" alt="NYC Open Data" />
            </a>
            <a href="https://backslash.org/" target="_blank" rel="noopener noreferrer" className="partner-logo">
              <img src="/keepingurban/backslash.png" alt="Backslash" />
            </a>
            <a href="https://opendataweek.nyc/" target="_blank" rel="noopener noreferrer" className="partner-logo">
              <img src="/keepingurban/open_data_week.png" alt="Open Data Week" />
            </a>
          </div>
        </div>
      </section>

      {/* Program Snapshot */}
      <section className="program" id="program">
        <h2 className="section-marker">Program</h2>
        <div className="zones">
          <article className="zone">
            <div className="zone-index">01</div>
            <h3 className="zone-title">Multidisciplinary Panels</h3>
            <p className="zone-description">
              Art, technology, and civic systems in conversation.
              Cross-sector dialogue on who builds, who benefits, and who decides.
            </p>
          </article>
          <article className="zone" id="pitches">
            <div className="zone-index">02</div>
            <h3 className="zone-title">Startup Pitches</h3>
            <p className="zone-description">
              Early-stage urban and civic ventures.
              Founders working on housing, mobility, public space, and community infrastructure.
            </p>
          </article>
          <article className="zone">
            <div className="zone-index">03</div>
            <h3 className="zone-title">Immersive Gallery</h3>
            <p className="zone-description">
              Spatial work engaging cities, data, and public life.
              Art as a way of knowing—not illustrating—urban futures.
            </p>
          </article>
        </div>
      </section>

      {/* Curatorial Statement */}
      <section className="statement" id="open-call">
        {/* Urban systems visualization - top left */}
        <svg className="urban-system urban-top" viewBox="0 0 300 300" aria-hidden="true">
          {/* Grid base layer - representing city blocks */}
          <g className="grid-layer">
            <path className="grid-line" d="M0,60 L300,60" />
            <path className="grid-line delay-1" d="M0,120 L300,120" />
            <path className="grid-line delay-2" d="M0,180 L300,180" />
            <path className="grid-line" d="M60,0 L60,300" />
            <path className="grid-line delay-1" d="M120,0 L120,300" />
            <path className="grid-line delay-2" d="M180,0 L180,300" />
          </g>
          {/* Transit layer - subway/transport routes */}
          <g className="transit-layer">
            <path className="transit-line" d="M0,30 Q60,30 80,60 T120,120 T180,140 L300,140" />
            <path className="transit-line accent delay-1" d="M0,90 C40,90 50,60 90,60 S140,100 180,100 L240,100 Q280,100 300,80" />
            <path className="transit-line delay-2" d="M30,0 Q30,50 60,80 T100,160 T140,220 L140,300" />
          </g>
          {/* Data flow layer - representing information systems */}
          <g className="data-layer">
            <path className="data-flow" d="M0,200 Q80,180 120,200 T200,160 T300,180" />
            <path className="data-flow accent delay-1" d="M200,0 Q180,60 200,100 T160,180 T200,260 L180,300" />
          </g>
          {/* Nodes - intersection points, hubs */}
          <g className="nodes-layer">
            <circle className="node-hub" cx="60" cy="60" r="6" />
            <circle className="node-hub accent" cx="120" cy="120" r="8" />
            <circle className="node-point" cx="180" cy="100" r="4" />
            <circle className="node-point" cx="90" cy="60" r="3" />
            <circle className="node-hub" cx="180" cy="140" r="5" />
            <circle className="node-point accent" cx="140" cy="180" r="4" />
            {/* Pulsing center node */}
            <circle className="node-pulse" cx="120" cy="120" r="8" />
          </g>
          {/* Orbital rings - systems within systems */}
          <g className="orbital-layer">
            <circle className="orbital-ring" cx="120" cy="120" r="40" />
            <circle className="orbital-ring delay-1" cx="120" cy="120" r="70" />
          </g>
        </svg>

        {/* Urban systems visualization - bottom right */}
        <svg className="urban-system urban-bottom" viewBox="0 0 300 300" aria-hidden="true">
          {/* Grid base layer */}
          <g className="grid-layer">
            <path className="grid-line" d="M0,120 L300,120" />
            <path className="grid-line delay-1" d="M0,180 L300,180" />
            <path className="grid-line delay-2" d="M0,240 L300,240" />
            <path className="grid-line" d="M120,0 L120,300" />
            <path className="grid-line delay-1" d="M180,0 L180,300" />
            <path className="grid-line delay-2" d="M240,0 L240,300" />
          </g>
          {/* Transit layer */}
          <g className="transit-layer">
            <path className="transit-line" d="M300,260 Q240,260 220,230 T180,170 T120,150 L0,150" />
            <path className="transit-line accent delay-1" d="M300,200 C260,200 250,230 210,230 S160,190 120,190 L60,190 Q20,190 0,210" />
            <path className="transit-line delay-2" d="M270,300 Q270,250 240,210 T200,130 T160,70 L160,0" />
          </g>
          {/* Data flow layer */}
          <g className="data-layer">
            <path className="data-flow" d="M300,90 Q220,110 180,90 T100,130 T0,110" />
            <path className="data-flow accent delay-1" d="M100,300 Q120,240 100,190 T140,110 T100,30 L120,0" />
          </g>
          {/* Nodes */}
          <g className="nodes-layer">
            <circle className="node-hub" cx="240" cy="240" r="6" />
            <circle className="node-hub accent" cx="180" cy="180" r="8" />
            <circle className="node-point" cx="120" cy="190" r="4" />
            <circle className="node-point" cx="210" cy="230" r="3" />
            <circle className="node-hub" cx="120" cy="150" r="5" />
            <circle className="node-point accent" cx="160" cy="110" r="4" />
            <circle className="node-pulse" cx="180" cy="180" r="8" />
          </g>
          {/* Orbital rings */}
          <g className="orbital-layer">
            <circle className="orbital-ring" cx="180" cy="180" r="40" />
            <circle className="orbital-ring delay-1" cx="180" cy="180" r="70" />
          </g>
        </svg>
        <div className="statement-content">
          <h2 className="statement-title">On Keeping It Urban</h2>
          <div className="statement-text">
            <p>
            From the string of gentrification across NYC to subway vandalism against Friend.com, representing the larger public backlash against top-down AI, cities are fundamentally ignoring that <span className="text-highlight-inverse">community, art, and culture are the primary drivers of a city's social vitality.</span>
            </p>
            <p>
             These social forces, that drive $135 billion in economic activity and make neighborhoods worth living in, are treated as afterthoughts rather than infrastructure.And, even when the future of cities is being decided, it is in rooms that most New Yorkers can't enter.
            </p>
            <p>
            <span className="text-highlight-inverse">Keeping it Urban: Culture, Tech, Collective</span> is a one-day summit reclaiming who gets to shape urban futures. We bring together the three forces that actually build livable cities—cultural creators, civic technologists, and community leaders—for a day of expert panels, startup pitches, and an immersive gallery at Cornell Tech.
            </p>
            <p>
            >Timed with NYC Open Data Week, the summit asks one question: What happens when we build cities with art and culture at the center, not the margins? Join 130+ founders, artists, VCs, and civic leaders to find out—and to connect with the collaborators, funders, and platforms that will make it real.
            </p>
            <p className="statement-close">
              Let's build the future of cities with intention and integrity.
            </p>
          </div>
        </div>
      </section>

      {/* You Belong Here */}
      <section className="belong" id="attend">
        <h2 className="section-marker">You Belong Here</h2>
        <p className="belong-intro">
          Keeping it Urban convenes across sectors. If you work at the intersection
          of cities, culture, and civic life—there is a place for you.
        </p>
        <div className="placards">
          <article className="placard">
            <div className="pixel-icon pixel-artist" aria-hidden="true">
              <div className="pixel-grid">
                {/* Abstract brush/installation - diagonal strokes */}
                <span style={{gridArea: '1/3'}}></span>
                <span style={{gridArea: '2/4'}}></span>
                <span style={{gridArea: '3/5'}}></span>
                <span style={{gridArea: '4/6'}}></span>
                <span style={{gridArea: '2/2'}}></span>
                <span style={{gridArea: '3/3'}}></span>
                <span style={{gridArea: '4/4'}}></span>
                <span style={{gridArea: '5/5'}}></span>
                <span className="accent" style={{gridArea: '3/4'}}></span>
                <span className="accent" style={{gridArea: '4/3'}}></span>
                <span className="accent" style={{gridArea: '5/2'}}></span>
                <span style={{gridArea: '6/1'}}></span>
                <span style={{gridArea: '6/6'}}></span>
              </div>
              <div className="glitch-layer"></div>
            </div>
            <h3 className="placard-title">Artists</h3>
            <p className="placard-text">
              Working with space, data, public intervention, or urban narrative.
              Your practice is research. Your work is evidence. Show with us,
              speak with us, or join as witness.
            </p>
            <span className="placard-role"> Exhibitor / Panelist</span>
          </article>
          <article className="placard">
            <div className="pixel-icon pixel-founder" aria-hidden="true">
              <div className="pixel-grid">
                {/* Building blocks rising */}
                <span style={{gridArea: '6/2'}}></span>
                <span style={{gridArea: '6/3'}}></span>
                <span style={{gridArea: '5/2'}}></span>
                <span style={{gridArea: '5/3'}}></span>
                <span style={{gridArea: '4/3'}}></span>
                <span className="accent" style={{gridArea: '3/3'}}></span>
                <span style={{gridArea: '6/4'}}></span>
                <span style={{gridArea: '6/5'}}></span>
                <span style={{gridArea: '5/4'}}></span>
                <span style={{gridArea: '5/5'}}></span>
                <span style={{gridArea: '4/4'}}></span>
                <span style={{gridArea: '4/5'}}></span>
                <span style={{gridArea: '3/5'}}></span>
                <span style={{gridArea: '2/5'}}></span>
                <span className="accent" style={{gridArea: '1/5'}}></span>
              </div>
              <div className="glitch-layer"></div>
            </div>
            <h3 className="placard-title">Founders</h3>
            <p className="placard-text">
              Building for housing, mobility, public space, civic engagement,
              or community infrastructure. Pitch your venture. Meet collaborators.
              Find believers who understand the work.
            </p>
            <span className="placard-role">Pitcher / Panelist </span>
          </article>
          <article className="placard">
            <div className="pixel-icon pixel-civic" aria-hidden="true">
              <div className="pixel-grid">
                {/* Data grid / civic structure */}
                <span style={{gridArea: '1/3'}}></span>
                <span style={{gridArea: '1/4'}}></span>
                <span style={{gridArea: '2/2'}}></span>
                <span className="accent" style={{gridArea: '2/3'}}></span>
                <span className="accent" style={{gridArea: '2/4'}}></span>
                <span style={{gridArea: '2/5'}}></span>
                <span style={{gridArea: '3/1'}}></span>
                <span style={{gridArea: '3/3'}}></span>
                <span style={{gridArea: '3/4'}}></span>
                <span style={{gridArea: '3/6'}}></span>
                <span style={{gridArea: '4/2'}}></span>
                <span style={{gridArea: '4/5'}}></span>
                <span style={{gridArea: '5/1'}}></span>
                <span className="accent" style={{gridArea: '5/3'}}></span>
                <span className="accent" style={{gridArea: '5/4'}}></span>
                <span style={{gridArea: '5/6'}}></span>
                <span style={{gridArea: '6/2'}}></span>
                <span style={{gridArea: '6/3'}}></span>
                <span style={{gridArea: '6/4'}}></span>
                <span style={{gridArea: '6/5'}}></span>
              </div>
              <div className="glitch-layer"></div>
            </div>
            <h3 className="placard-title">Civic Leaders</h3>
            <p className="placard-text">
              Open data stewards, urban planners, policy designers, and public
              servants. The people who make systems—and the people trying to
              make them more human.
            </p>
            <span className="placard-role">Panelist / Collaborator </span>
          </article>
          <article className="placard">
            <div className="pixel-icon pixel-community" aria-hidden="true">
              <div className="pixel-grid">
                {/* Houses / neighborhood */}
                <span style={{gridArea: '3/1'}}></span>
                <span style={{gridArea: '4/1'}}></span>
                <span style={{gridArea: '4/2'}}></span>
                <span style={{gridArea: '5/1'}}></span>
                <span style={{gridArea: '5/2'}}></span>
                <span className="accent" style={{gridArea: '2/3'}}></span>
                <span style={{gridArea: '3/3'}}></span>
                <span style={{gridArea: '3/4'}}></span>
                <span style={{gridArea: '4/3'}}></span>
                <span style={{gridArea: '4/4'}}></span>
                <span style={{gridArea: '5/3'}}></span>
                <span style={{gridArea: '5/4'}}></span>
                <span className="accent" style={{gridArea: '1/5'}}></span>
                <span style={{gridArea: '2/5'}}></span>
                <span style={{gridArea: '2/6'}}></span>
                <span style={{gridArea: '3/5'}}></span>
                <span style={{gridArea: '3/6'}}></span>
                <span style={{gridArea: '4/5'}}></span>
                <span style={{gridArea: '4/6'}}></span>
                <span style={{gridArea: '5/5'}}></span>
                <span style={{gridArea: '5/6'}}></span>
                <span style={{gridArea: '6/1'}}></span>
                <span style={{gridArea: '6/2'}}></span>
                <span style={{gridArea: '6/3'}}></span>
                <span style={{gridArea: '6/4'}}></span>
                <span style={{gridArea: '6/5'}}></span>
                <span style={{gridArea: '6/6'}}></span>
              </div>
              <div className="glitch-layer"></div>
            </div>
            <h3 className="placard-title">Community Members</h3>
            <p className="placard-text">
              Residents, advocates, organizers, students, and anyone interested in Urbanism within New York City. 
            </p>
            <span className="placard-role">Attendee / Voice </span>
          </article>
        </div>
      </section>

      {/* Contact */}
      <section className="contact" id="contact">
        <h2 className="section-marker">Get in Touch</h2>
        <div className="contact-content">
          <p className="contact-text">
            Interested in sponsoring, partnering, or speaking?
            <br />
            <span className="contact-highlight">We'd love to hear from you.</span>
          </p>
          <a
            href="mailto:aap253@cornell.edu,msh334@cornell.edu?subject=Keeping it Urban Inquiry"
            className="contact-button"
          >
            Send us an email
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-mark">Keeping it Urban 2026</p>
          <p className="footer-location">Cornell Tech, Roosevelt Island, NYC</p>
          <p className="footer-affiliation">
            <a href="https://www.linkedin.com/in/atmikapai/" target="_blank" rel="noopener noreferrer">Atmika Pai</a>
            {' · '}
            <a href="https://www.linkedin.com/in/michelle-hui/" target="_blank" rel="noopener noreferrer">Michelle Hui</a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
