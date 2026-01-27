import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import './App.css'

// Seeded random number generator for consistent results
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Generate a dense, realistic city street network procedurally
function generateStreetNetwork(seed = 42) {
  const paths = []
  const gridCols = 18
  const gridRows = 14
  const cellW = 1100 / gridCols
  const cellH = 900 / gridRows
  let seedCounter = seed

  const random = () => {
    seedCounter++
    return seededRandom(seedCounter)
  }

  // Create jittered grid of nodes
  const nodes = []
  for (let row = 0; row <= gridRows; row++) {
    for (let col = 0; col <= gridCols; col++) {
      const isEdge = row === 0 || row === gridRows || col === 0 || col === gridCols
      const jitterAmount = isEdge ? 0.2 : 0.5
      const jitterX = (random() - 0.5) * cellW * jitterAmount
      const jitterY = (random() - 0.5) * cellH * jitterAmount
      nodes.push({
        x: Math.max(0, Math.min(1100, col * cellW + jitterX)),
        y: Math.max(0, Math.min(900, row * cellH + jitterY)),
        col,
        row
      })
    }
  }

  const getNode = (row, col) => {
    if (row < 0 || row > gridRows || col < 0 || col > gridCols) return null
    return nodes[row * (gridCols + 1) + col]
  }

  // Horizontal connections (streets running left-right)
  for (let row = 0; row <= gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const n1 = getNode(row, col)
      const n2 = getNode(row, col + 1)
      if (n1 && n2 && random() > 0.08) {
        const type = row % 4 === 0 ? 'artery' : random() > 0.7 ? 'street' : 'connector'
        paths.push({ d: `M${n1.x.toFixed(1)},${n1.y.toFixed(1)} L${n2.x.toFixed(1)},${n2.y.toFixed(1)}`, type })
      }
    }
  }

  // Vertical connections (streets running top-bottom)
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col <= gridCols; col++) {
      const n1 = getNode(row, col)
      const n2 = getNode(row + 1, col)
      if (n1 && n2 && random() > 0.08) {
        const type = col % 5 === 0 ? 'artery' : random() > 0.7 ? 'street' : 'connector'
        paths.push({ d: `M${n1.x.toFixed(1)},${n1.y.toFixed(1)} L${n2.x.toFixed(1)},${n2.y.toFixed(1)}`, type })
      }
    }
  }

  // Diagonal connections (cross-streets for more organic feel)
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const n1 = getNode(row, col)
      // Diagonal down-right
      if (random() > 0.75) {
        const n2 = getNode(row + 1, col + 1)
        if (n1 && n2) {
          paths.push({ d: `M${n1.x.toFixed(1)},${n1.y.toFixed(1)} L${n2.x.toFixed(1)},${n2.y.toFixed(1)}`, type: 'connector' })
        }
      }
      // Diagonal down-left
      if (random() > 0.75) {
        const n3 = getNode(row + 1, col)
        const n4 = getNode(row, col + 1)
        if (n3 && n4) {
          paths.push({ d: `M${n4.x.toFixed(1)},${n4.y.toFixed(1)} L${n3.x.toFixed(1)},${n3.y.toFixed(1)}`, type: 'connector' })
        }
      }
    }
  }

  // Add curved arterial roads that span the viewport
  const arterials = [
    // Horizontal curved arteries
    { points: [[0, 200], [200, 180], [400, 220], [600, 190], [800, 210], [1000, 185], [1100, 200]] },
    { points: [[0, 450], [180, 430], [360, 470], [540, 440], [720, 460], [900, 435], [1100, 450]] },
    { points: [[0, 700], [220, 720], [440, 690], [660, 730], [880, 700], [1100, 715]] },
    // Vertical curved arteries
    { points: [[200, 0], [180, 150], [210, 300], [190, 450], [220, 600], [200, 750], [215, 900]] },
    { points: [[550, 0], [570, 180], [540, 360], [560, 540], [530, 720], [555, 900]] },
    { points: [[900, 0], [920, 150], [890, 300], [910, 450], [885, 600], [915, 750], [900, 900]] },
  ]

  arterials.forEach(artery => {
    const points = artery.points
    let d = `M${points[0][0]},${points[0][1]}`
    for (let i = 1; i < points.length; i++) {
      d += ` L${points[i][0]},${points[i][1]}`
    }
    paths.push({ d, type: 'artery' })
  })

  // Add some secondary curved roads for variety
  for (let i = 0; i < 20; i++) {
    const startCol = Math.floor(random() * (gridCols - 3))
    const startRow = Math.floor(random() * (gridRows - 3))
    const startNode = getNode(startRow, startCol)

    if (startNode) {
      const length = 3 + Math.floor(random() * 4)
      const horizontal = random() > 0.5
      const pathPoints = [startNode]

      for (let j = 1; j < length; j++) {
        const nextRow = horizontal ? startRow + Math.floor((random() - 0.5) * 2) : startRow + j
        const nextCol = horizontal ? startCol + j : startCol + Math.floor((random() - 0.5) * 2)
        const nextNode = getNode(Math.max(0, Math.min(gridRows, nextRow)), Math.max(0, Math.min(gridCols, nextCol)))
        if (nextNode) pathPoints.push(nextNode)
      }

      if (pathPoints.length > 1) {
        let d = `M${pathPoints[0].x.toFixed(1)},${pathPoints[0].y.toFixed(1)}`
        for (let k = 1; k < pathPoints.length; k++) {
          d += ` L${pathPoints[k].x.toFixed(1)},${pathPoints[k].y.toFixed(1)}`
        }
        paths.push({ d, type: 'street' })
      }
    }
  }

  // Add small connector segments for extra density
  for (let i = 0; i < 50; i++) {
    const row = Math.floor(random() * gridRows)
    const col = Math.floor(random() * gridCols)
    const n1 = getNode(row, col)
    if (n1) {
      // Create small offset segments
      const offsetX = (random() - 0.5) * cellW * 0.5
      const offsetY = (random() - 0.5) * cellH * 0.5
      const x2 = Math.max(0, Math.min(1100, n1.x + offsetX))
      const y2 = Math.max(0, Math.min(900, n1.y + offsetY))
      paths.push({ d: `M${n1.x.toFixed(1)},${n1.y.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`, type: 'connector' })
    }
  }

  return paths
}

// Helper to sample approximate points along a path for proximity detection
function samplePathPoints(d) {
  const points = []
  // Parse simple path commands and extract key coordinates
  const commands = d.match(/[MLQTCS][^MLQTCS]*/gi) || []

  for (const cmd of commands) {
    const type = cmd[0].toUpperCase()
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number)

    if (type === 'M' || type === 'L') {
      points.push({ x: coords[0], y: coords[1] })
    } else if (type === 'Q') {
      // Quadratic bezier - sample control and end point
      points.push({ x: coords[0], y: coords[1] })
      points.push({ x: coords[2], y: coords[3] })
    } else if (type === 'T') {
      points.push({ x: coords[0], y: coords[1] })
    } else if (type === 'C') {
      // Cubic bezier - sample control points and end
      points.push({ x: coords[0], y: coords[1] })
      points.push({ x: coords[2], y: coords[3] })
      points.push({ x: coords[4], y: coords[5] })
    } else if (type === 'S') {
      points.push({ x: coords[0], y: coords[1] })
      points.push({ x: coords[2], y: coords[3] })
    }
  }
  return points
}

function App() {
  const [mousePos, setMousePos] = useState({ x: -1, y: -1 })
  const heroRef = useRef(null)
  const fadeRef = useRef(null)

  // Intersection Observer for fade-in animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    if (fadeRef.current) {
      observer.observe(fadeRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Generate street network once using useMemo
  const streetPaths = useMemo(() => generateStreetNetwork(42), [])

  // Track mouse position relative to hero (in pixels for SVG)
  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    // Scale to SVG viewBox (1100 x 900)
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 1100,
      y: ((e.clientY - rect.top) / rect.height) * 900
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1, y: -1 })
  }, [])

  useEffect(() => {
    const hero = heroRef.current
    if (hero) {
      hero.addEventListener('mousemove', handleMouseMove, { passive: true })
      hero.addEventListener('mouseleave', handleMouseLeave)
      return () => {
        hero.removeEventListener('mousemove', handleMouseMove)
        hero.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [handleMouseMove, handleMouseLeave])

  // Calculate path opacity based on proximity to mouse
  const getPathStyle = (path, index) => {
    const baseOpacity = path.type === 'artery' ? 0.12 : path.type === 'street' ? 0.07 : 0.04

    if (mousePos.x < 0) {
      return { opacity: baseOpacity }
    }

    // Sample points along path to check proximity
    const pathPoints = samplePathPoints(path.d)
    let minDistance = Infinity

    for (const point of pathPoints) {
      const dx = mousePos.x - point.x
      const dy = mousePos.y - point.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      minDistance = Math.min(minDistance, dist)
    }

    const maxDistance = 120
    const proximity = Math.max(0, 1 - minDistance / maxDistance)
    const opacity = baseOpacity + proximity * 0.6

    return {
      opacity,
      filter: proximity > 0.3 ? `drop-shadow(0 0 ${proximity * 6}px var(--accent))` : 'none'
    }
  }

  return (
    <div className="site">
      {/* Hero - Glitch Landing */}
      <header className="hero" ref={heroRef}>
        {/* Street Network SVG */}
        <svg className="street-network" viewBox="0 0 1100 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {streetPaths.map((path, i) => (
            <path
              key={i}
              d={path.d}
              className={`street-path street-${path.type}`}
              style={getPathStyle(path, i)}
            />
          ))}
        </svg>
        {/* Scrolling Pixel Marquee */}
        <div className="pixel-marquee-container">
          <div className="pixel-marquee-track">
            <span className="pixel-title highlight">Keeping It <span className="urban">Urban</span></span>
            <span className="pixel-dot">·</span>
            <span className="pixel-title">Keeping It <span className="urban">Urban</span></span>
            <span className="pixel-dot">·</span>
            <span className="pixel-title highlight">Keeping It <span className="urban">Urban</span></span>
            <span className="pixel-dot">·</span>
            <span className="pixel-title">Keeping It <span className="urban">Urban</span></span>
            <span className="pixel-dot">·</span>
            <span className="pixel-title highlight">Keeping It <span className="urban">Urban</span></span>
            <span className="pixel-dot">·</span>
            <span className="pixel-title">Keeping It <span className="urban">Urban</span></span>
            <span className="pixel-dot">·</span>
          </div>
        </div>

        <p className="hero-tagline">
          <span className="tagline-highlight">Keeping It Urban: Art, Tech, Collective</span> is rethinking the <span style={{color: 'white'}}>future of human-centered cities.</span>
        </p>

        <div className="hero-event-info">
          <p className="hero-date">Tuesday, March 24, 2026 · <span className="hero-event-name">NYC Open Data Week</span></p>
          <p className="hero-location-text">Cornell Tech, NYC</p>
        </div>

      </header>

      {/* Sticky Nav Bar with CTA Buttons */}
      <nav className="bottom-nav">
        <div className="nav-cta-buttons">
          <a href="https://forms.gle/CaigJ8xr1Gj4JGJaA" target="_blank" rel="noopener noreferrer" className="cta-btn cta-primary">Open Call</a>
          <a href="https://forms.gle/YwJjzQFw2z2EJwNRA" target="_blank" rel="noopener noreferrer" className="cta-btn cta-primary">Startup Pitches</a>
          <a href="#attend" className="cta-btn cta-outline">Attend</a>
        </div>
      </nav>

      {/* Stats Section */}
      <section className="context stats-section">
        <div className="context-grid">
          <div className="signal">
            <span className="signal-number">150+</span>
            <span className="signal-label"><span className="signal-title">Participants</span></span>
          </div>
          <div className="signal">
            <span className="signal-number">20+</span>
            <span className="signal-label"><span className="signal-title">Speakers</span></span>
          </div>
          <div className="signal">
            <span className="signal-number">15+</span>
            <span className="signal-label"><span className="signal-title">Artists</span></span>
          </div>
          <div className="signal">
            <span className="signal-number">12+</span>
            <span className="signal-label"><span className="signal-title">Pitches</span></span>
          </div>
          <div className="signal">
            <span className="signal-number">4</span>
            <span className="signal-label"><span className="signal-title">Panels</span></span>
          </div>
        </div>
      </section>

      {/* Curatorial Statement */}
      <section className="statement" id="open-call">
        <div className="statement-content">
          <div className="statement-label">    </div>
          <div className="statement-text">
            <p>
              With over half the world population now living in cities, <span style={{color: '#ff3d00'}}>Keeping It Urban</span> is not about urbanism itself, rather the confluence of <span className="text-highlight-wave"><span style={{animationDelay: '0s'}}>tech,</span> <span style={{animationDelay: '0.1s'}}>arts,</span> <span style={{animationDelay: '0.2s'}}>and</span> <span style={{animationDelay: '0.3s'}}>culture</span></span> that is born only from the <span className="text-highlight-wave"><span style={{animationDelay: '0.4s'}}>density</span> <span style={{animationDelay: '0.5s'}}>of</span> <span style={{animationDelay: '0.6s'}}>cities.</span></span>
            </p>
            <p>
              The summit reclaims from top-down silos.
            </p>
            <p>
              We bring together cultural agents - artists, technologists, civic leaders, and funders - that have been independently shaping livable cities into the same room to <span className="text-highlight-wave orange"><span style={{animationDelay: '0s'}}>NOW</span></span> <span className="text-highlight-wave"><span style={{animationDelay: '0.1s'}}>build</span></span> <span className="text-highlight-wave orange"><span style={{animationDelay: '0.2s'}}>TOGETHER.</span></span>
            </p>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="context partners-context">
        {/* Partner Logos - Infinite Scroll Marquee */}
        <div className="partners-section">
          <h3 className="partners-title">Backed by</h3>
          <div className="marquee-container">
            <div className="marquee-track">
              {/* First set of logos */}
              <a href="https://tech.cornell.edu/" target="_blank" rel="noopener noreferrer" className="partner-logo">
                <img src="/logo/cornell.png" alt="Cornell University" />
              </a>
              <a href="https://www.nyc.gov/content/oti/pages/" target="_blank" rel="noopener noreferrer" className="partner-logo no-color-hover">
                <img src="/logo/nyc_oti.png" alt="NYC Office of Technology & Innovation" />
              </a>
              <a href="https://opendata.cityofnewyork.us/" target="_blank" rel="noopener noreferrer" className="partner-logo">
                <img src="/logo/nyc_open_data.png" alt="NYC Open Data" />
              </a>
              <a href="https://backslash.org/" target="_blank" rel="noopener noreferrer" className="partner-logo no-color-hover">
                <img src="/logo/backslash.png" alt="Backslash" />
              </a>
              <a href="https://opendataweek.nyc/" target="_blank" rel="noopener noreferrer" className="partner-logo">
                <img src="/logo/open_data_week.png" alt="Open Data Week" />
              </a>
              {/* Duplicate set for seamless loop */}
              <a href="https://tech.cornell.edu/" target="_blank" rel="noopener noreferrer" className="partner-logo">
                <img src="/logo/cornell.png" alt="Cornell University" />
              </a>
              <a href="https://www.nyc.gov/content/oti/pages/" target="_blank" rel="noopener noreferrer" className="partner-logo no-color-hover">
                <img src="/logo/nyc_oti.png" alt="NYC Office of Technology & Innovation" />
              </a>
              <a href="https://opendata.cityofnewyork.us/" target="_blank" rel="noopener noreferrer" className="partner-logo">
                <img src="/logo/nyc_open_data.png" alt="NYC Open Data" />
              </a>
              <a href="https://backslash.org/" target="_blank" rel="noopener noreferrer" className="partner-logo no-color-hover">
                <img src="/logo/backslash.png" alt="Backslash" />
              </a>
              <a href="https://opendataweek.nyc/" target="_blank" rel="noopener noreferrer" className="partner-logo">
                <img src="/logo/open_data_week.png" alt="Open Data Week" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* You Belong Here */}
      <section className="belong" id="attend">
        <h2 className="section-marker">You Belong Here</h2>
        <div className="placards fade-in-section" ref={fadeRef}>
          <article className="placard">
            <div className="placard-inner">
              <div className="placard-front">
                <span className="placard-front-label">Artists</span>
                <img src="/stakeholders/artists.png" alt="Artists" className="placard-front-img" />
              </div>
              <div className="placard-back">
                <a href="https://forms.gle/CaigJ8xr1Gj4JGJaA" target="_blank" rel="noopener noreferrer" className="placard-back-btn">Apply Now</a>
                <div className="pixel-icon pixel-artist" aria-hidden="true">
                  <div className="pixel-grid">
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
                  Your practice is research. Your work is evidence.
                </p>
                <span className="placard-role">Exhibitor / Panelist</span>
              </div>
            </div>
          </article>
          <article className="placard">
            <div className="placard-inner">
              <div className="placard-front">
                <span className="placard-front-label">Founders</span>
                <img src="/stakeholders/founders.png" alt="Founders" className="placard-front-img" />
              </div>
              <div className="placard-back">
                <a href="https://forms.gle/YwJjzQFw2z2EJwNRA" target="_blank" rel="noopener noreferrer" className="placard-back-btn">Submit Pitch</a>
                <div className="pixel-icon pixel-founder" aria-hidden="true">
                  <div className="pixel-grid">
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
                  or community infrastructure.
                </p>
                <span className="placard-role">Pitcher / Panelist</span>
              </div>
            </div>
          </article>
          <article className="placard">
            <div className="placard-inner">
              <div className="placard-front">
                <span className="placard-front-label">Venture Capitalists</span>
                <img src="/stakeholders/civic_leaders.png" alt="Venture Capitalists" className="placard-front-img" />
              </div>
              <div className="placard-back">
                <a href="mailto:aap253@cornell.edu,msh334@cornell.edu?subject=VC Inquiry" className="placard-back-btn">Get in Touch</a>
                <div className="pixel-icon pixel-civic" aria-hidden="true">
                  <div className="pixel-grid">
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
                <h3 className="placard-title">VCs</h3>
                <p className="placard-text">
                  Investors backing urban innovation, civic tech, and the future of cities.
                </p>
                <span className="placard-role">Judge / Investor</span>
              </div>
            </div>
          </article>
          <article className="placard">
            <div className="placard-inner">
              <div className="placard-front">
                <span className="placard-front-label">Civic Leaders</span>
                <img src="/stakeholders/community.png" alt="Civic Leaders" className="placard-front-img" />
              </div>
              <div className="placard-back">
                <a href="mailto:aap253@cornell.edu,msh334@cornell.edu?subject=Civic Leader Inquiry" className="placard-back-btn">Get in Touch</a>
                <div className="pixel-icon pixel-community" aria-hidden="true">
                  <div className="pixel-grid">
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
                <h3 className="placard-title">Civic Leaders</h3>
                <p className="placard-text">
                  Open data stewards, urban planners, policy designers, and public servants making systems more human.
                </p>
                <span className="placard-role">Panelist / Collaborator</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Program Snapshot */}
      <section className="program" id="program">
        <h2 className="section-marker">Program</h2>
        <div className="zones">
          <article className="zone">
            <div className="zone-index">01</div>
            <h3 className="zone-title" style={{color: '#ff3d00', fontSize: '1rem'}}>Multidisciplinary Panels</h3>
            <p className="zone-description" style={{fontFamily: "'Press Start 2P', cursive", fontSize: '0.65rem', lineHeight: '1.8'}}>Leaders from art, technology, and civic systems in conversation on the future of human-centered cities.<br /><br />Who builds, who benefits, and who decides?</p>
          </article>
          <article className="zone" id="pitches">
            <div className="zone-index">02</div>
            <h3 className="zone-title" style={{color: '#ff3d00', fontSize: '1rem'}}>Startup Pitches</h3>
            <p className="zone-description" style={{fontFamily: "'Press Start 2P', cursive", fontSize: '0.65rem', lineHeight: '1.8'}}>Hear from 12+ early-stage urban and civic ventures on how they're reshaping New York City, the mecca of cities.<br /><br />Spotlight on Cornell Tech's Startup Accelerator and Runway Postdocs Program.</p>
          </article>
          <article className="zone">
            <div className="zone-index">03</div>
            <h3 className="zone-title" style={{color: '#ff3d00', fontSize: '1rem'}}>Immersive Gallery</h3>
            <p className="zone-description" style={{fontFamily: "'Press Start 2P', cursive", fontSize: '0.65rem', lineHeight: '1.8'}}>Explore art as a way of knowing—not illustrating—urban futures.<br /><br />Contemplate, is art dying in the age of AI? And what is to become of cultural institutions that attract urbanites in the first place?</p>
          </article>
        </div>
      </section>

      {/* Our Team */}
      <section className="team-section" id="team">
        <h2 className="section-marker">Our Team</h2>
        <div className="team-grid">
          <div className="team-member">
            <a href="https://www.linkedin.com/in/atmikapai/" target="_blank" rel="noopener noreferrer">
              <img src="/team/atmika.png" alt="Atmika Pai" className="team-member-photo" />
            </a>
            <a href="https://www.linkedin.com/in/atmikapai/" target="_blank" rel="noopener noreferrer" className="team-member-name">Atmika Pai</a>
            <p className="team-member-role">Lead Organiser</p>
          </div>
          <div className="team-member">
            <a href="https://www.linkedin.com/in/michelle-hui/" target="_blank" rel="noopener noreferrer">
              <img src="/team/michelle.png" alt="Michelle Hui" className="team-member-photo" />
            </a>
            <a href="https://www.linkedin.com/in/michelle-hui/" target="_blank" rel="noopener noreferrer" className="team-member-name">Michelle Hui</a>
            <p className="team-member-role">Lead Organiser</p>
          </div>
          <div className="team-member">
            <a href="https://tech.cornell.edu/people/wendy-ju/" target="_blank" rel="noopener noreferrer">
              <img src="/team/wendy.png" alt="Wendy Ju" className="team-member-photo" />
            </a>
            <a href="https://tech.cornell.edu/people/wendy-ju/" target="_blank" rel="noopener noreferrer" className="team-member-name">Wendy Ju</a>
            <p className="team-member-role">Professor at Cornell Tech,<br />Center for Design Research at Stanford</p>
          </div>
{/* <div className="team-member">
            <a href="https://tech.cornell.edu/people/greg-pass/" target="_blank" rel="noopener noreferrer">
              <img src="/team/greg.png" alt="Greg Pass" className="team-member-photo" />
            </a>
            <a href="https://tech.cornell.edu/people/greg-pass/" target="_blank" rel="noopener noreferrer" className="team-member-name">Greg Pass</a>
            <p className="team-member-role">Founding Fellow at Cornell Tech,<br />xCTO of Twitter</p>
          </div> */}
          <div className="team-member">
            <a href="https://www.linkedin.com/in/arielkennan/" target="_blank" rel="noopener noreferrer">
              <img src="/team/ariel.png" alt="Ariel Kennan" className="team-member-photo" />
            </a>
            <a href="https://www.linkedin.com/in/arielkennan/" target="_blank" rel="noopener noreferrer" className="team-member-name">Ariel Kennan</a>
            <p className="team-member-role">Sr. Dir. at Georgetown's Beeck Center,<br />xDesign Dir. of Sidewalk Labs</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-mark">Keeping it <span style={{color: '#ff3d00'}}>Urban</span> 2026</p>
          <a
            href="mailto:aap253@cornell.edu,msh334@cornell.edu?subject=Keeping it Urban Inquiry"
            className="footer-contact"
          >
           Collaborate With Us
          </a>
        </div>
      </footer>

    </div>
  )
}

export default App
