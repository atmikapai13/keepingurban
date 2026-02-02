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

// Typewriter text component - types out text when scrolled into view
function TypewriterText({ children, speed = 100 }) {
  const ref = useRef(null)
  const [hasTriggered, setHasTriggered] = useState(false)
  const [displayText, setDisplayText] = useState('')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTriggered) {
          setHasTriggered(true)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasTriggered])

  useEffect(() => {
    if (!hasTriggered) return
    const text = children
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayText(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [hasTriggered, children, speed])

  return (
    <span ref={ref} className="typewriter-wrapper">
      <span className={hasTriggered ? 'typewriter-hidden' : ''}>{children}</span>
      {hasTriggered && (
        <span className="typewriter-overlay">
          {displayText}
          <span className="typewriter-cursor" />
        </span>
      )}
    </span>
  )
}

// Urban Tech Carousel - 3D circular carousel for "What Counts" section
function UrbanTechCarousel() {
  const [rotation, setRotation] = useState(-360)
  const [isIntroSpinning, setIsIntroSpinning] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const carouselRef = useRef(null)
  const autoPlayRef = useRef(null)
  const hasTriggered = useRef(false)
  const touchStartX = useRef(null)

  // Responsive radius — tighter on smaller screens
  const getRadius = () => {
    if (typeof window === 'undefined') return 420
    if (window.innerWidth <= 480) return 180
    if (window.innerWidth <= 768) return 280
    return 420
  }
  const [radius, setRadius] = useState(getRadius)
  useEffect(() => {
    const onResize = () => setRadius(getRadius())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const cards = [
    {
      index: '01',
      title: 'Physical AI',
      tagline: 'Intelligence that moves & senses through the world',
      examples: ['Robotics', 'Spatial Reasoning', 'AV', 'Sensors', 'Digital Twins'],
    },
    {
      index: '02',
      title: 'Agents',
      tagline: 'Copilots for the real world',
      examples: ['Autonomous Flows', 'Simulation Environments', 'Multi-agent coordination'],
    },
    {
      index: '03',
      title: 'Open-Source',
      tagline: 'Built on transparency and collaboration',
      examples: ['Github', 'Hugging Face','Public Protocals', 'Community-owned'],
    },
    {
      index: '04',
      title: 'Augmented Reality',
      tagline: 'Transforms shared physical space',
      examples: ['Pokemon Go', 'Meta Glasses', 'Google Maps'],
    },
    {
      index: '05',
      title: 'Culture & Media',
      tagline: 'Tools that amplify cultural production',
      examples: ['Substack', 'Luma', 'Podcast Networks', 'Design Tools (Figma, Are.na)'],
    }, 
    {
      index: '06',
      title: 'Mobility & Built-Environment',
      tagline: 'Reimagining how we move and build',
      examples: ['Uber','Sidewalk Labs', 'Gov/Pi Tech'],
    }
  ]

  const anglePerCard = 360 / cards.length

  // Trigger intro spin when scrolled into view
  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasTriggered.current) {
          hasTriggered.current = true
          setIsIntroSpinning(true)
          // After intro spin animation completes, enable auto-play
          setTimeout(() => {
            setIsIntroSpinning(false)
            setIntroComplete(true)
            setIsAutoPlaying(true)
          }, 5000)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Auto-rotate: step one card at a time
  useEffect(() => {
    if (!isAutoPlaying || isIntroSpinning) {
      clearInterval(autoPlayRef.current)
      return
    }
    autoPlayRef.current = setInterval(() => {
      setRotation((prev) => prev - anglePerCard)
    }, 4000)
    return () => clearInterval(autoPlayRef.current)
  }, [isAutoPlaying, isIntroSpinning, anglePerCard])

  const goTo = (index) => {
    setRotation(-360 - index * anglePerCard)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 8000)
  }

  const goNext = () => {
    setRotation((prev) => prev - anglePerCard)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 8000)
  }

  const goPrev = () => {
    setRotation((prev) => prev + anglePerCard)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 8000)
  }

  // Determine which card index is currently in front
  const normalizedAngle = (((-(rotation + 360)) % 360) + 360) % 360
  const activeIndex = Math.round(normalizedAngle / anglePerCard) % cards.length

  return (
    <div className="carousel-section" ref={carouselRef}>
      <div
        className="carousel-viewport"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return
          const diff = e.changedTouches[0].clientX - touchStartX.current
          touchStartX.current = null
          if (Math.abs(diff) > 40) {
            if (diff < 0) goNext()
            else goPrev()
          }
        }}
      >
        <button className="carousel-arrow carousel-arrow-left" onClick={goPrev} aria-label="Previous card">
          &#8592;
        </button>
        <div className="carousel-scene">
          <div
            className={`carousel-ring ${isIntroSpinning ? 'carousel-intro-spin' : ''}`}
            style={!isIntroSpinning ? {
              transform: `rotateY(${rotation}deg)`,
              transition: introComplete ? 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
            } : undefined}
          >
            {cards.map((card, i) => {
              const angle = i * anglePerCard
              return (
                <article
                  key={i}
                  className={`carousel-card ${activeIndex === i ? 'carousel-card-active' : ''}`}
                  style={{
                    transform: `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${radius}px)`,
                  }}
                  onClick={() => goTo(i)}
                >
                  {/* Folder tab */}
                  <div className="carousel-card-tab">
                    <span className="carousel-card-tab-label">{card.index}</span>
                  </div>
                  <div className="carousel-card-body">
                    <div className="carousel-card-glitch" aria-hidden="true"></div>
                    <div className="carousel-card-content">
                      <h4 className="carousel-card-title">{card.title}</h4>
                      <p className="carousel-card-tagline">{card.tagline}</p>
                    </div>
                    <div className="carousel-card-examples carousel-examples-visible">
                      {card.examples.map((ex, j) => (
                        <span key={j} className="carousel-example-tag">{ex}</span>
                      ))}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
        <button className="carousel-arrow carousel-arrow-right" onClick={goNext} aria-label="Next card">
          &#8594;
        </button>
      </div>
      <div className="carousel-dots">
        {cards.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === activeIndex ? 'carousel-dot-active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
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
          Not about urbanism itself. <br></br> <br></br> Instead: <span className="tagline-highlight">the energy of tech, arts, and culture</span> born only from the density of cities.
        </p>

        <div className="hero-event-info">
          <p className="hero-date">Friday, March 20, 2026 · <span className="hero-event-name">NYC Open Data Week</span></p>
          <p className="hero-location-text">Cornell Tech, NYC</p>
        </div>

      </header>

      {/* Sticky Nav Bar with CTA Buttons */}
      <nav className="bottom-nav">
        <div className="nav-cta-buttons">
          <a href="https://forms.gle/CaigJ8xr1Gj4JGJaA" target="_blank" rel="noopener noreferrer" className="cta-btn cta-primary">Artist Call</a>
          <a href="https://forms.gle/YwJjzQFw2z2EJwNRA" target="_blank" rel="noopener noreferrer" className="cta-btn cta-primary">Startup / Research Pitches</a>
          <a href="https://forms.gle/gGeJFiEhtLUZ7Md79" target="_blank" rel="noopener noreferrer" className="cta-btn cta-outline">Attend</a>
        </div>
      </nav>

      {/* Partners Section */}
      <section className="context partners-context">
        {/* Partner Logos - Infinite Scroll Marquee */}
        <div className="partners-section">
          <h3 className="partners-title section-marker">Backed by</h3>
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

      {/* Curatorial Statement */}
      <section className="statement" id="open-call">
        {/* Speakers */}
        <div className="speakers-section">
          <h3 className="speakers-title section-marker"><TypewriterText>Speaker Spotlights</TypewriterText></h3>
          <div className="speakers-split">
            <div className="speakers-grid">
              <div className="speaker">
                <a href="https://linkedin.com/in/dpstyles" target="_blank" rel="noopener noreferrer">
                  <img src="/team/dennis.png" alt="Dennis Crowley" className="speaker-photo" />
                </a>
                <a href="https://linkedin.com/in/dpstyles" target="_blank" rel="noopener noreferrer" className="speaker-name">Dennis Crowley</a>
                <p className="speaker-role">Co-Founder @ Foursquare,<br />Hopscotch Labs, Streets FC</p>
              </div>
              <div className="speaker">
                <a href="https://www.linkedin.com/in/jennyfielding/" target="_blank" rel="noopener noreferrer">
                  <img src="/team/jenny.png" alt="Jenny Fielding" className="speaker-photo" />
                </a>
                <a href="https://www.linkedin.com/in/jennyfielding/" target="_blank" rel="noopener noreferrer" className="speaker-name">Jenny Fielding</a>
                <p className="speaker-role">Co-founder @ Everywhere Ventures,<br />ex-Managing Director @ Techstars</p>
              </div>
              <div className="speaker">
                <a href="https://www.arielnoyman.com/" target="_blank" rel="noopener noreferrer">
                  <img src="/team/ariel_noyman.png" alt="Ariel Noyman" className="speaker-photo" />
                </a>
                <a href="https://www.arielnoyman.com/" target="_blank" rel="noopener noreferrer" className="speaker-name">Ariel Noyman</a>
                <p className="speaker-role">MIT Media Lab,<br />City Science Lab</p>
              </div>
              <div className="speaker">
                <a href="https://www.linkedin.com/in/arielkennan/" target="_blank" rel="noopener noreferrer">
                  <img src="/team/ariel.png" alt="Ariel Kennan" className="speaker-photo" />
                </a>
                <a href="https://www.linkedin.com/in/arielkennan/" target="_blank" rel="noopener noreferrer" className="speaker-name">Ariel Kennan</a>
                <p className="speaker-role">Georgetown's Beeck Center for Social Impact + Innovation,<br />ex-Design @ Google's Sidewalk Labs</p>
              </div>
              <div className="speaker">
                <a href="https://tech.cornell.edu/people/wendy-ju/" target="_blank" rel="noopener noreferrer">
                  <img src="/team/wendy.png" alt="Wendy Ju" className="speaker-photo" />
                </a>
                <a href="https://tech.cornell.edu/people/wendy-ju/" target="_blank" rel="noopener noreferrer" className="speaker-name">Wendy Ju</a>
                <p className="speaker-role">Cornell Tech and AAP,<br />ex-Director @ Stanford Center for Design Research</p>
              </div>
            </div>
            <div className="speakers-logo-cloud">
              <img src="/logo/techstars.png" alt="Techstars" className="cloud-logo no-color-hover" />
              <span className="cloud-logo-swap">
                <img src="/logo/everywhere.png" alt="Everywhere Ventures" className="cloud-logo cloud-logo-default" />
                <img src="/logo/everywhere.jpg" alt="Everywhere Ventures" className="cloud-logo cloud-logo-hover" />
              </span>
              <img src="/logo/media_lab.png" alt="MIT Media Lab" className="cloud-logo no-color-hover" />
              <img src="/logo/google.png" alt="Google" className="cloud-logo" />
              <img src="/logo/sidewalk.png" alt="Sidewalk Labs" className="cloud-logo no-color-hover" />
              <img src="/logo/stanford.png" alt="Stanford" className="cloud-logo" />
              <img src="/logo/beeck.png" alt="Beeck Center" className="cloud-logo" />
              <img src="/logo/Foursquare_logo.png" alt="Foursquare" className="cloud-logo" />
              <img src="/logo/hopscotch.png" alt="Hopscotch Labs" className="cloud-logo" style={{transform: 'scale(1.3)'}} />
            </div>
          </div>
        </div>
      </section>

      {/* Program Snapshot */}
      <section className="program" id="program">
        <h2 className="section-marker"><TypewriterText>What to expect?</TypewriterText></h2>
        <div className="context-grid program-stats">
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
            <span className="signal-number">3</span>
            <span className="signal-label"><span className="signal-title">Panels</span></span>
          </div>
        </div>
        <div className="zones">
          <article className="zone">
            <img src="/program/panels.png" alt="Multidisciplinary Panels" className="zone-image" />
            <div className="zone-index">01</div>
            <h3 className="zone-title" style={{color: '#ff3d00', fontSize: '1rem'}}>Multidisciplinary Panels</h3>
            <p className="zone-description">Leading voices in startups, venture, cities, and culture. <br></br> <br></br> Each panel tackles themes from the role of AR/VR in public space to how autonomous robots and physical AI is reshaping mobility. </p>
          </article>
          <article className="zone" id="pitches">
            <img src="/program/pitches.png" alt="Startup/Research Pitches" className="zone-image" />
            <div className="zone-index">02</div>
            <h3 className="zone-title" style={{color: '#ff3d00', fontSize: '1rem'}}>Startup / Research Pitches</h3>
            <p className="zone-description">Curated cohort of 12+ early-stage startups and civic ventures. <br></br> <br></br> Open-source, physical AI, simulation agents, AR/VR, platforms for artists, musicians, creators. </p>
          </article>
          <article className="zone">
            <img src="/program/artists.png" alt="Immersive Gallery" className="zone-image" />
            <div className="zone-index">03</div>
            <h3 className="zone-title" style={{color: '#ff3d00', fontSize: '1rem'}}>Immersive Gallery</h3>
            <p className="zone-description">Full-day exhibition featuring 15+ site installations, interactive demos, and research prototypes.
<br /><br />Non-linear art, novel interaction systems, glitch art, built environment models, data storytelling.</p>
          </article>
        </div>
        <a href="https://www.midjourney.com/@wizardofwoz?tab=spotlight" target="_blank" rel="noopener noreferrer" className="zones-credit">* Picture Credits @wizardofwoz on Midjourney</a>

        {/* Tracks - Rotating Carousel */}
        <h3 className="tracks-header section-marker"><TypewriterText>What counts, exactly?</TypewriterText></h3>
        <UrbanTechCarousel />
      </section>

      {/* You Belong Here */}
      <section className="belong" id="attend">
        <h2 className="section-marker"><TypewriterText>Who Should Join?</TypewriterText></h2>
        <div className="rolodex-grid" ref={fadeRef}>
          {[
            { title: 'Founders', tagline: 'Hire top AI talent early, pilot with users, pitch to funders.' },
            { title: 'Investors', tagline: 'Curated early-stage deal flow in AI and cultural startups.' },
            { title: 'Urbanists & Organizers', tagline: 'Move from policy papers to pilots. Stay fluent in the tech reshaping cities.' },
            { title: 'Artists & Designers', tagline: 'Collaborate with engineers who build tools, not just use them.' },
            { title: 'Engineers & Researchers', tagline: 'Demo prototypes to partners who can greenlight pilots.' },
          
          ].map((card, i) => (
            <article key={i} className="rolodex-card">
              <div className="rolodex-card-inner">
                <div className="rolodex-card-header">
                  <span className="rolodex-card-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="rolodex-card-why">Why Join?</span>
                </div>
                <div className="rolodex-card-body">
                  <h3 className="rolodex-card-label">{card.title}</h3>
                  <p className="rolodex-card-tagline">{card.tagline}</p>
                </div>
              </div>
              <div className="rolodex-card-scanlines" aria-hidden="true"></div>
            </article>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="statement" id="about">
        <h2 className="section-marker"><TypewriterText>Concept</TypewriterText></h2>
        <div className="statement-content">
          <div className="statement-text">
            <p>
              With over half the world population now living in cities, <span style={{color: '#ff3d00'}}>Keeping It Urban</span> is not about urbanism itself, rather the <span className="text-highlight-wave"><span style={{animationDelay: '0s'}}>energy</span> <span style={{animationDelay: '0.1s'}}>of</span> <span style={{animationDelay: '0.2s'}}>tech,</span> <span style={{animationDelay: '0.3s'}}>arts,</span> <span style={{animationDelay: '0.4s'}}>and</span> <span style={{animationDelay: '0.5s'}}>culture</span></span> that is born only from the <span className="text-highlight-wave"><span style={{animationDelay: '0.6s'}}>density</span> <span style={{animationDelay: '0.7s'}}>of</span> <span style={{animationDelay: '0.8s'}}>cities.</span></span>
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

      {/* Our Team */}
      <section className="team-section" id="team">
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
        </div>
        <h2 className="section-marker">Our Team</h2>
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
