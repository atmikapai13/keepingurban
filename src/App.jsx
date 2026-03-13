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
  const gridCols = 24
  const gridRows = 18
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

// Schedule Terminal - Retro console schedule display
const scheduleData = [
  {
    time: '9:30', endTime: '10:45', title: 'Panel 1: New Digital Interfaces', panelLabel: 'Multidisciplinary Panel', panelTopic: 'New Digital Interfaces', panelSubtopic: 'Future of the Media Economy and Emerging AR/VR Technologies.',
    detail: '45 min, 15 mins Q&A + buffer', venue: 'tata141', type: 'panel',
    speakers: [
      { name: 'Adaora Udoji', org: 'ex-VP @ PBS, RLab, Journalist @ ABC & CNN, Filmmaker & Juror @ Sundance, Tribeca, TIFF', photo: '/panelists/interfaces_adaora.png', logo: '/logo/pbs.png', noInvert: true, logo2: '/logo/sundance.png', url: 'https://www.newmuseum.org/person/2019-1-31-adaora-udoji/' },
      { name: 'Niko Koppel', org: 'Backslash Artist, VR Producer and Technologist @ NYT and CNN', photo: '/panelists/interfaces_niko.png', logo: '/logo/backslash.png', url: 'https://www.nikokoppel.com' },
      { name: 'Mauhan M. Zonoozy', org: '2x Founder @ A Vinyl Bar in Shibuya, ex-Head of Innovation @ Spotify', photo: '/panelists/mauhan.webp', logo: '/logo/spotify.png', noInvert: true, logo2: '/logo/shibuya.jpg', logo2Url: 'https://www.shibuyaaa.com/', url:'https://mauhan.com/' },
    ],
  },
  {
    time: '10:45', endTime: '12:00', title: 'Fireside Chat', subtitle: 'Jenny Fielding & Dennis Crowley', detail: '30 mins, 10 min Q&A', venue: 'tata141', type: 'keynote',
    speakers: [
      { name: 'Dennis C.', org: 'Co-Founder @ Hopscotch, Foursquare, Dodgeball, Stockade FC', photo: '/panelists/dennis.png', logo: '/logo/Foursquare_logo.png', logoHeight: 45, noInvert: true, url: 'https://denniscrowley.com/' },
      { name: 'Jenny F.', org: 'Co-founder & General Partner @ Everywhere Ventures, Managing Director @ Techstars', photo: '/panelists/jenny.png', logo: '/logo/everywhere.png', logoHeight: 65, darkLogo: true, url: 'https://www.linkedin.com/in/jennyfielding' },
    ],
  },
  { time: '12:00', endTime: '1:00', title: 'Lunch', detail: 'Cornell Tech Catering', venue: 'all', type: 'break' },
  { time: '1:00', endTime: '2:00', title: 'Interfaces Startup Pitches', detail: '2 speakers: 20-30 mins', venue: 'tata141', type: 'pitch',
    pitchSpeakers: [
      { name: 'Kevin Yoo', company: 'Haptic', role: 'CEO', url: 'https://haptic.works/', logo: '/logo/haptic_nav.webp', noInvert: true },
      { name: 'Adam Harder', company: 'Inpress', role: 'CEO', url: 'https://www.inpress.app/', logo: '/logo/inpress.webp' },
    ],
  },
  { time: '1:00', endTime: '2:00', title: 'Tinkerer Project Pitches', detail: '4 speakers: 15 minutes each', venue: 'tata151', type: 'pitch',
    pitchSpeakers: [
      { company: 'Noware', url: 'https://www.noware.nyc/', logo: '/logo/noware.png', noInvert: true },
      { company: 'Subway Builder', url: 'https://www.subwaybuilder.com/', logo: '/logo/subwaybuilder.png', rawLogo: true },
    ],
  },
  {
    time: '2:00', endTime: '3:15', title: 'Panel 2: Human-Robot Co-existence', panelLabel: 'Multidisciplinary Panel', panelTopic: 'Human-Robot Co-existence', panelSubtopic: 'Human-robot interaction dynamics.',
    detail: '45 min, 15 mins Q&A + buffer', venue: 'tata141', type: 'panel',
    speakers: [
      { name: 'Daniel L.', org: 'ex-Global Head of AI @ Samsung Research, Professor @ NYU, Cornell Tech, UPenn', photo: '/panelists/daniel.png', logo: '/logo/samsung.png', noInvert: true, url: 'https://tech.cornell.edu/people/daniel-d-lee/' },
      { name: 'Josh M.', org: 'CTO @ Fauna Robotics, ex-Research @ Meta & DeepMind', photo: '/panelists/robotics_josh.png', logo: '/logo/fauna_robotics.png', darkLogo: true, url: 'https://www.linkedin.com/in/josh-merel-9222b72a2' },
      { name: 'Michael S.', org: 'CEO / Director @ Media Architecture, Volvox Labs', photo: '/panelists/robotics_michael.png', logo: '/logo/volvox.png', darkLogo: true, url: 'https://www.linkedin.com/in/michaelluckschneider/' },
      { name: 'Jacob HR', org: 'Co-Founder & Executive Director @ NY Robotics', photo: '/panelists/jacob.jpg', logo: '/logo/nyrobotics.png', noInvert: true },
    ],
  },
  {
    time: '2:00', endTime: '3:15', title: 'Panel 3: Building for Belonging', panelLabel: 'Multidisciplinary Panel', panelTopic: 'Building for Belonging', panelSubtopic: 'Innovation within bureaucracy.',
    detail: '45 min, 15 mins Q&A + buffer', venue: 'tata151', type: 'panel',
    speakers: [
      { name: 'Ariel K.', org: "Georgetown's Beeck Center for Social Impact, ex-Design @ Google's Sidewalk Labs", photo: '/team/ariel.png', logo: '/logo/beeck.png', noInvert: true, url: 'https://linkedin.com/in/arielkennan' },
      { name: 'Ariel N.', org: 'Research Scientist @ MIT Media Lab, co-Founder @ City Science Living Labs', photo: '/panelists/ariel_noyman.png', logo: '/logo/media_lab.png', logoHeight: 45, url: 'https://linkedin.com/in/arielnoyman' },
      { name: 'Sonam V.', org: 'Co-founder @ Streetlife Ventures, ex-World Bank', photo: '/panelists/sonam.png', logo: '/logo/streetlife.png', logoHeight: 45, noInvert: true, url: 'https://www.linkedin.com/in/sonamvelani/' },
    ],
  },
  { time: '3:15', endTime: '4:00', title: 'Open Gallery Walk', detail: 'Coffee Break', venue: 'all', type: 'break' },
  { time: '4:00', endTime: '4:10', title: 'Reverse-engineering Claude Code', detail: '10 mins', venue: 'tata141', type: 'pitch', label: 'Lightning Talk',
    pitchSpeakers: [
      { company: 'TensorZero', url: 'https://www.tensorzero.com/', logo: '/logo/tensorzero.png', noInvert: true },
    ],
  },
  { time: '4:10', endTime: '5:00', title: 'Robotics Startup Pitches', detail: '2-3 speakers: 20-30 mins', venue: 'tata141', type: 'pitch',
    pitchSpeakers: [
      { company: 'Root Access', url: 'https://rootaccess.ai/', logo: '/logo/root_access.png', noInvert: true },
    ],
  },
  { time: '4:10', endTime: '5:00', title: 'Urban Startup Pitches', detail: '2-3 speakers: 20-30 mins', venue: 'tata151', type: 'pitch',
    pitchSpeakers: [
      { company: "It's Electric", url: 'https://itselectric.us/', logo: '/logo/its_electric.png', noInvert: true, logoHeight: 50 },
    ],
  },
]

const scheduleTabs = [
  { id: 'all', label: 'ALL' },
  { id: 'gallery', label: 'GALLERY' },
]

const venueLabels = { tata141: 'TATA 141', tata151: 'TATA 151' }

function ScheduleTerminal() {
  const [activeTab, setActiveTab] = useState('all')
  const [glitching, setGlitching] = useState(false)
  const terminalRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [expandedPanels, setExpandedPanels] = useState(new Set())

  useEffect(() => {
    const el = terminalRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleTabSwitch = (tabId) => {
    if (tabId === activeTab) return
    setGlitching(true)
    setTimeout(() => {
      setActiveTab(tabId)
      setGlitching(false)
    }, 150)
  }

  const togglePanel = (title) => {
    const event = scheduleData.find(e => e.title === title)
    const siblings = event
      ? scheduleData.filter(e => e.time === event.time && e.endTime === event.endTime && (e.type === 'panel' || e.type === 'pitch' || e.type === 'keynote'))
      : [{ title }]
    setExpandedPanels(prev => {
      const next = new Set(prev)
      const expanding = !next.has(title)
      siblings.forEach(s => {
        if (expanding) next.add(s.title)
        else next.delete(s.title)
      })
      return next
    })
  }

  const filtered = activeTab === 'all'
    ? scheduleData
    : scheduleData.filter(e => e.venue === activeTab || e.venue === 'all')

  // Group events by time slot for side-by-side display
  const timeSlots = []
  const seen = new Set()
  filtered.forEach(event => {
    const key = event.time + '-' + event.endTime
    if (!seen.has(key)) {
      seen.add(key)
      timeSlots.push({
        time: event.time,
        endTime: event.endTime,
        events: filtered.filter(e => e.time === event.time && e.endTime === event.endTime)
      })
    }
  })

  return (
    <div className={`schedule-terminal ${visible ? 'schedule-visible' : ''}`} ref={terminalRef}>
      {/* Terminal title bar */}
      <div className="schedule-titlebar">
        <div className="schedule-dots">
          <span className="schedule-dot-red" />
          <span className="schedule-dot-yellow" />
          <span className="schedule-dot-green" />
        </div>
        <span className="schedule-titlebar-text">&gt; SCHEDULE_</span>
      </div>

      {/* Tabs */}
      <div className="schedule-tabs">
        {scheduleTabs.map(tab => (
          <button
            key={tab.id}
            className={`schedule-tab ${activeTab === tab.id ? 'schedule-tab-active' : ''}`}
            onClick={() => handleTabSwitch(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Terminal content */}
      <div className={`schedule-content ${glitching ? 'schedule-glitch' : ''}`}>
        <div className="schedule-scanlines" aria-hidden="true" />

        {activeTab === 'gallery' ? (
          <div style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
            <img src="/gallery.jpeg" alt="Gallery Map" style={{ width: '100%', maxWidth: '600px', borderRadius: '4px' }} />
          </div>
        ) : (
        <div className="schedule-main-layout">
            <div className="schedule-slots-col">
            {timeSlots.map((slot, slotIdx) => {
              const isBreak = slot.events.length === 1 && slot.events[0].type === 'break'
              if (isBreak) {
                return (
                  <div key={slotIdx} className="schedule-slot schedule-slot-break" style={{ transitionDelay: `${slotIdx * 0.07}s` }}>
                    <div className="schedule-slot-time schedule-break-time">
                      {slot.time} &ndash; {slot.endTime}
                    </div>
                    <div className="schedule-break">
                      <span className="schedule-break-line" />
                      <span className="schedule-break-text">
                        {slot.events[0].title.toUpperCase()}
                      </span>
                      <span className="schedule-break-line" />
                    </div>
                  </div>
                )
              }
              return (
                <div key={slotIdx} className="schedule-slot" style={{ transitionDelay: `${slotIdx * 0.07}s` }}>
                  <div className="schedule-slot-time">
                    {slot.time} &ndash; {slot.endTime}
                  </div>
                  <div className="schedule-slot-events">
                    {slot.events.map((event, eventIdx) => {
                      if (event.type === 'panel') {
                        const isExpanded = expandedPanels.has(event.title)
                        const hasLogos = event.speakers && event.speakers.some(s => s.logo)
                        return (
                          <div
                            key={eventIdx}
                            className={`schedule-event schedule-event-panel ${isExpanded ? 'schedule-panel-expanded' : ''}`}
                            onClick={() => togglePanel(event.title)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePanel(event.title) } }}
                          >
                            <div className="schedule-panel-scanlines" aria-hidden="true" />
                            <div className="schedule-panel-header">
                              <div className="schedule-panel-header-left">
                                <div className="schedule-panel-label">
                                  {event.panelLabel}
                                  {venueLabels[event.venue] && (
                                    <span className="schedule-panel-venue"> &middot; {venueLabels[event.venue]}</span>
                                  )}
                                </div>
                                <div className="schedule-event-title">{event.panelTopic}</div>
                              </div>
                              <div className="schedule-panel-header-right">
                                <span className="schedule-panel-expand-hint" aria-hidden="true">
                                  {isExpanded ? '[−]' : '[+]'}
                                </span>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="schedule-panel-details">
                                {event.panelSubtopic && (
                                  <div className="schedule-panel-subtopic">{event.panelSubtopic}</div>
                                )}
                                {event.speakers && event.speakers.length > 0 && (
                                  <div className="schedule-panel-speakers">
                                    {event.speakers.map((speaker, si) => (
                                      <div key={si} className="schedule-panel-speaker">
                                        {speaker.photo && (
                                          speaker.url ? (
                                            <a href={speaker.url} target="_blank" rel="noopener noreferrer">
                                              <img src={speaker.photo} alt={speaker.name} className="schedule-panel-speaker-photo schedule-panel-speaker-photo-link" />
                                            </a>
                                          ) : (
                                            <img src={speaker.photo} alt={speaker.name} className="schedule-panel-speaker-photo" />
                                          )
                                        )}
                                        {speaker.url ? (
                                          <a href={speaker.url} target="_blank" rel="noopener noreferrer" className="schedule-panel-speaker-name schedule-panel-speaker-link">{speaker.name}</a>
                                        ) : (
                                          <span className="schedule-panel-speaker-name">{speaker.name}</span>
                                        )}
                                        <span className="schedule-panel-speaker-org">{speaker.org}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {hasLogos && (
                                  <div className="schedule-panel-logos">
                                    {event.speakers.filter(s => s.logo).flatMap((s, i) => [
                                      <img key={i} src={s.logo} alt={s.org} className={`schedule-panel-logo${s.darkLogo ? ' schedule-panel-logo-dark' : ''}${s.noInvert ? ' schedule-panel-logo-noinvert' : ''}`} style={s.logoHeight ? { height: s.logoHeight } : undefined} />,
                                      ...(s.logo2 ? [s.logo2Url ? <a key={`${i}-2`} href={s.logo2Url} target="_blank" rel="noopener noreferrer"><img src={s.logo2} alt={s.org} className={`schedule-panel-logo${s.logo2NoInvert ? ' schedule-panel-logo-noinvert' : ''}`} /></a> : <img key={`${i}-2`} src={s.logo2} alt={s.org} className={`schedule-panel-logo${s.logo2NoInvert ? ' schedule-panel-logo-noinvert' : ''}`} />] : []),
                                    ])}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      }
                      if (event.type === 'keynote') {
                        const isKeynoteExpanded = expandedPanels.has(event.title)
                        const hasKeynoteLogos = event.speakers && event.speakers.some(s => s.logo)
                        return (
                          <div
                            key={eventIdx}
                            className={`schedule-event schedule-event-panel ${isKeynoteExpanded ? 'schedule-panel-expanded' : ''}`}
                            onClick={() => togglePanel(event.title)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePanel(event.title) } }}
                          >
                            <div className="schedule-panel-scanlines" aria-hidden="true" />
                            <div className="schedule-panel-header">
                              <div className="schedule-panel-header-left">
                                <div className="schedule-panel-label">
                                  {event.title}
                                  {venueLabels[event.venue] && (
                                    <span className="schedule-panel-venue"> &middot; {venueLabels[event.venue]}</span>
                                  )}
                                </div>
                                {event.subtitle && (
                                  <div className="schedule-event-title">{event.subtitle}</div>
                                )}
                              </div>
                              <div className="schedule-panel-header-right">
                                {isKeynoteExpanded && hasKeynoteLogos && (
                                  <div className="schedule-panel-logos" style={{ marginTop: 0 }}>
                                    {event.speakers.filter(s => s.logo).flatMap((s, i) => [
                                      <img key={i} src={s.logo} alt={s.org} className={`schedule-panel-logo${s.darkLogo ? ' schedule-panel-logo-dark' : ''}${s.noInvert ? ' schedule-panel-logo-noinvert' : ''}`} style={s.logoHeight ? { height: s.logoHeight } : undefined} />,
                                      ...(s.logo2 ? [s.logo2Url ? <a key={`${i}-2`} href={s.logo2Url} target="_blank" rel="noopener noreferrer"><img src={s.logo2} alt={s.org} className={`schedule-panel-logo${s.logo2NoInvert ? ' schedule-panel-logo-noinvert' : ''}`} /></a> : <img key={`${i}-2`} src={s.logo2} alt={s.org} className={`schedule-panel-logo${s.logo2NoInvert ? ' schedule-panel-logo-noinvert' : ''}`} />] : []),
                                    ])}
                                  </div>
                                )}
                                {!isKeynoteExpanded && (
                                  <span className="schedule-panel-expand-hint" aria-hidden="true">[+]</span>
                                )}
                              </div>
                            </div>
                            {isKeynoteExpanded && (
                              <div className="schedule-panel-details">
                                {event.speakers && event.speakers.length > 0 && (
                                  <div className="schedule-panel-speakers">
                                    {event.speakers.map((speaker, si) => (
                                      <div key={si} className="schedule-panel-speaker">
                                        {speaker.photo && (
                                          speaker.url ? (
                                            <a href={speaker.url} target="_blank" rel="noopener noreferrer">
                                              <img src={speaker.photo} alt={speaker.name} className="schedule-panel-speaker-photo schedule-panel-speaker-photo-link" />
                                            </a>
                                          ) : (
                                            <img src={speaker.photo} alt={speaker.name} className="schedule-panel-speaker-photo" />
                                          )
                                        )}
                                        {speaker.url ? (
                                          <a href={speaker.url} target="_blank" rel="noopener noreferrer" className="schedule-panel-speaker-name schedule-panel-speaker-link">{speaker.name}</a>
                                        ) : (
                                          <span className="schedule-panel-speaker-name">{speaker.name}</span>
                                        )}
                                        <span className="schedule-panel-speaker-org">{speaker.org}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      }
                      // pitch
                      const isPitchExpanded = expandedPanels.has(event.title)
                      const hasPitchSpeakers = event.pitchSpeakers && event.pitchSpeakers.length > 0
                      return (
                        <div
                          key={eventIdx}
                          className={`schedule-event schedule-event-panel schedule-event-pitch ${event.label === 'Lightning Talk' ? 'schedule-event-lightning' : ''} ${isPitchExpanded ? 'schedule-panel-expanded' : ''}`}
                          onClick={hasPitchSpeakers ? () => togglePanel(event.title) : undefined}
                          style={hasPitchSpeakers ? { cursor: 'pointer' } : undefined}
                        >
                          <div className="schedule-panel-scanlines" aria-hidden="true" />
                          <div className="schedule-panel-header">
                            <div className="schedule-panel-header-left">
                              <div className="schedule-panel-label">
                                {event.label || 'Pitches'}
                                {venueLabels[event.venue] && (
                                  <span className="schedule-panel-venue"> &middot; {venueLabels[event.venue]}</span>
                                )}
                              </div>
                              <div className="schedule-event-title">{event.title}</div>
                            </div>
                            {hasPitchSpeakers && (
                              <div className="schedule-panel-header-right">
                                <span className="schedule-panel-expand-hint" aria-hidden="true">
                                  {isPitchExpanded ? '[-]' : '[+]'}
                                </span>
                              </div>
                            )}
                          </div>
                          {isPitchExpanded && hasPitchSpeakers && (
                            <div className="schedule-panel-details">
                              <div className="schedule-panel-logos">
                                {event.pitchSpeakers.filter(s => s.logo).map((s, i) => (
                                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer">
                                    <img src={s.logo} alt={s.company} className={`schedule-panel-logo${s.noInvert ? ' schedule-panel-logo-noinvert' : ''}${s.rawLogo ? ' schedule-panel-logo-raw' : ''}`} style={{ height: s.logoHeight || 30 }} />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        )}

        {/* Blinking cursor */}
        <div className="schedule-cursor">_</div>
      </div>
    </div>
  )
}

const gallerySlides = [
  {
    img: '/program/demo.jpg',
    alt: 'Immersive Gallery',
    title: 'Immersive Gallery',
    description: 'Full-day exhibition featuring 15+ interactive demos and prototypes.\n\nNon-linear art, novel interaction systems, glitch art, built environment models, data storytelling.',
  },
  {
    img: '/program/niko_work.png',
    alt: 'Niko Koppel Work',
    title: 'Niko Koppel',
    description: 'Community United Methodist Church in Pacific Palisades—tragically lost in this year’s Palisades Fire—is one of dozens of sites he captured in a navigable spatial record of the Palisades and Eaton fire aftermath. After 37,000+ acres burned and over 16,000+ structures destroyed across Pacific Palisades, Altadena, and Malibu, he 3D scanned homes, businesses, schools, and churches to convey the unimaginable scale of the disaster.',
  },
  {
    img: '/program/volvox_work.jpg',
    alt: 'Volvox Labs Work',
    title: 'Volvox Labs',
    description: 'Volvox partnered with Hovercraft to create a robot-driven basketball experience during the NBA All-Star Game in SF.',
  },
  {
    img: '/program/tianyi_work.png',
    alt: 'Tianyi Sun Work',
    title: 'Tianyi Sun',
    description: "40 Epochs is a hybrid-narrative film that explores spiritual displacement, fractured identity, and the unseen labor behind human-like technologies. Inspired by the artists\u2019 own experience training an AI model to reproduce Sun\u2019s voice, the film follows a voice donor in solitude as she performs reverent acts of reading, recording, and revising. What begins as ritual becomes rupture, as she reckons with the cost of entwining intimate gestures with the relentless demands of repetitive systems."
  },
  {
    img: "/program/collin_subway.png",
    alt: "Collin Miller - Subway Builder",
    title: "Collin Miller",
    description: "Subway Builder \u2014 a city-building game where you design and manage your own transit network.",
    objectPosition: "center 75%",
  },
];

function GallerySlideshow() {
  const [idx, setIdx] = useState(0);
  const slide = gallerySlides[idx];
  return (
    <article className="zone artist-gallery-card gallery-slideshow">
      <div className="gallery-slide-img-wrap">
        <img src={slide.img} alt={slide.alt} className="zone-image" style={slide.objectPosition ? {objectPosition: slide.objectPosition} : undefined} />
        <button className="gallery-arrow gallery-arrow--prev" onClick={() => setIdx((idx - 1 + gallerySlides.length) % gallerySlides.length)}>&#8592;</button>
        <button className="gallery-arrow gallery-arrow--next" onClick={() => setIdx((idx + 1) % gallerySlides.length)}>&#8594;</button>
        <div className="gallery-dots">
          {gallerySlides.map((_, i) => (
            <span key={i} className={`gallery-dot${i === idx ? ' gallery-dot--active' : ''}`} onClick={() => setIdx(i)} />
          ))}
        </div>
      </div>
      <div className="zone-index">{slide.label}</div>
      <h3 className="zone-title" style={{color: '#ff3d00', fontSize: '1rem'}}>{slide.title}</h3>
      <p className="zone-description">{slide.description}</p>
    </article>
  );
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

  // Auto-pulse: cycle a glow point across the network when mouse is idle
  const [autoPulse, setAutoPulse] = useState({ x: 550, y: 450 })
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoPulse({
        x: 100 + Math.random() * 900,
        y: 50 + Math.random() * 800
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Calculate path opacity based on proximity to mouse
  const getPathStyle = (path, index) => {
    const baseOpacity = path.type === 'artery' ? 0.12 : path.type === 'street' ? 0.07 : 0.04

    // Sample points along path to check proximity
    const pathPoints = samplePathPoints(path.d)

    // Use mouse position if active, otherwise use auto-pulse
    const isMouseActive = mousePos.x >= 0
    const targetX = isMouseActive ? mousePos.x : autoPulse.x
    const targetY = isMouseActive ? mousePos.y : autoPulse.y
    const maxDistance = isMouseActive ? 120 : 200
    const glowStrength = isMouseActive ? 0.6 : 0.4

    let minDistance = Infinity
    for (const point of pathPoints) {
      const dx = targetX - point.x
      const dy = targetY - point.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      minDistance = Math.min(minDistance, dist)
    }

    const proximity = Math.max(0, 1 - minDistance / maxDistance)
    const opacity = baseOpacity + proximity * glowStrength

    return {
      opacity,
      filter: proximity > 0.3 ? `drop-shadow(0 0 ${proximity * 6}px var(--accent))` : 'none',
      transition: isMouseActive ? 'none' : 'opacity 1.5s ease, filter 1.5s ease'
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

        <a href="https://luma.com/p202e71l" target="_blank" rel="noopener noreferrer" className="cta-btn cta-primary hero-attend-btn">Attend</a>

        <div className="hero-event-info">
          <p className="hero-date">Friday, March 20, 2026 · <span className="hero-event-name">NYC Open Data Week</span></p>
          <p className="hero-location-text">Cornell Tech, NYC</p>
          <p className="hero-funded-text">Supported by <a href="https://assembly.cornell.edu/shared-governance/graduate-and-professional-student-assembly" target="_blank" rel="noopener noreferrer" className="hero-event-name">Cornell GPSA</a></p>
        </div>

      </header>


      {/* Partners Section */}
      <section className="context partners-context">
        {/* Partner Logos - Infinite Scroll Marquee */}
        <div className="partners-section">
          <h3 className="partners-title section-marker">Partnering with</h3>
          <div className="marquee-container">
            <div className="marquee-track">
              {/* First set of logos */}
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
              <a href="#" className="partner-logo gpsa-logo">
                <img src="/logo/gpsa.png" alt="GPSA" />
              </a>
              {/* Duplicate set for seamless loop */}
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
              <a href="#" className="partner-logo gpsa-logo">
                <img src="/logo/gpsa.png" alt="GPSA" />
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
                  <img src="/panelists/dennis.png" alt="Dennis Crowley" className="speaker-photo" />
                </a>
                <a href="https://linkedin.com/in/dpstyles" target="_blank" rel="noopener noreferrer" className="speaker-name">Dennis Crowley</a>
                <p className="speaker-role">Co-Founder @ Foursquare,<br />Hopscotch Labs, Streets FC</p>
              </div>
              <div className="speaker">
                <a href="https://www.linkedin.com/in/jennyfielding/" target="_blank" rel="noopener noreferrer">
                  <img src="/panelists/jenny.png" alt="Jenny Fielding" className="speaker-photo" />
                </a>
                <a href="https://www.linkedin.com/in/jennyfielding/" target="_blank" rel="noopener noreferrer" className="speaker-name">Jenny Fielding</a>
                <p className="speaker-role">Co-founder @ Everywhere Ventures,<br />ex-Managing Director @ Techstars</p>
              </div>
              <div className="speaker">
                <a href="https://www.newmuseum.org/person/2019-1-31-adaora-udoji/" target="_blank" rel="noopener noreferrer">
                  <img src="/panelists/interfaces_adaora.png" alt="Adaora Udoji" className="speaker-photo" />
                </a>
                <a href="https://www.newmuseum.org/person/2019-1-31-adaora-udoji/" target="_blank" rel="noopener noreferrer" className="speaker-name">Adaora Udoji</a>
                <p className="speaker-role">ex-VP @ PBS, RLab,<br />Journalist @ ABC & CNN</p>
              </div>
              <div className="speaker">
                <a href="https://mauhan.com/" target="_blank" rel="noopener noreferrer">
                  <img src="/panelists/mauhan.webp" alt="Mauhan M. Zonoozy" className="speaker-photo" />
                </a>
                <a href="https://mauhan.com/" target="_blank" rel="noopener noreferrer" className="speaker-name">Mauhan M. Zonoozy</a>
                <p className="speaker-role">2x Founder @ A Vinyl Bar in Shibuya,<br />ex-Head of Innovation @ Spotify</p>
              </div>
              <div className="speaker">
                <a href="https://www.linkedin.com/in/josh-merel-9222b72a2" target="_blank" rel="noopener noreferrer">
                  <img src="/panelists/robotics_josh.png" alt="Josh Merel" className="speaker-photo" />
                </a>
                <a href="https://www.linkedin.com/in/josh-merel-9222b72a2" target="_blank" rel="noopener noreferrer" className="speaker-name">Josh Merel</a>
                <p className="speaker-role">CTO @ Fauna Robotics,<br />ex-Research @ Meta & DeepMind</p>
              </div>
            </div>
            <div className="speakers-logo-cloud">
              <img src="/logo/techstars.png" alt="Techstars" className="cloud-logo no-color-hover" />
              <img src="/logo/pbs.png" alt="PBS" className="cloud-logo no-color-hover" />
              <img src="/logo/spotify.svg" alt="Spotify" className="cloud-logo" style={{transform: 'scale(1.3)'}} />
              <img src="/logo/fauna_robotics.png" alt="Fauna Robotics" className="cloud-logo no-color-hover" />
              <img src="/logo/deepmind.webp" alt="DeepMind" className="cloud-logo no-color-hover" />
              <img src="/logo/Foursquare_logo.png" alt="Foursquare" className="cloud-logo" />
              <img src="/logo/hopscotch.png" alt="Hopscotch Labs" className="cloud-logo" style={{transform: 'scale(1.3)'}} />
              <span className="cloud-logo-swap">
                <img src="/logo/everywhere.png" alt="Everywhere Ventures" className="cloud-logo cloud-logo-default" />
                <img src="/logo/everywhere.jpg" alt="Everywhere Ventures" className="cloud-logo cloud-logo-hover" />
              </span>
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
        {/* Schedule
        <h3 className="tracks-header section-marker"><TypewriterText>What&apos;s happenin&apos;?</TypewriterText></h3> */}
        <ScheduleTerminal />

      </section>

      {/* Program continued */}
      <section className="program">
        {/* Tracks - Rotating Carousel */}
        <h3 className="tracks-header section-marker"><TypewriterText>What counts, exactly?</TypewriterText></h3>
        <UrbanTechCarousel />

        {/* Artist Gallery */}
        <h3 className="tracks-header section-marker"><TypewriterText>Artist Spotlight</TypewriterText></h3>
        <div className="artist-gallery-split">
          <GallerySlideshow />
          <div className="artist-gallery-speakers">
            <div className="artist-speakers-row">
              <div className="speaker">
                <a href="https://www.volvoxlabs.com/" target="_blank" rel="noopener noreferrer">
                  <img src="/panelists/robotics_michael.png" alt="Michael Schneider" className="speaker-photo" />
                </a>
                <a href="https://www.volvoxlabs.com/" target="_blank" rel="noopener noreferrer" className="speaker-name">Michael Schneider</a>
                <p className="speaker-role">CEO / Director @ Media Architecture, Volvox Labs</p>
              </div>
              <div className="speaker">
                <a href="https://backslash.org/" target="_blank" rel="noopener noreferrer">
                  <img src="/panelists/interfaces_niko.png" alt="Niko Koppel" className="speaker-photo" />
                </a>
                <a href="https://backslash.org/" target="_blank" rel="noopener noreferrer" className="speaker-name">Niko Koppel</a>
                <p className="speaker-role">AR Visual Journalist, Backslash, VR Producer @ NYT</p>
              </div>
            </div>
            <div className="artist-speakers-row artist-speakers-row--center">
              <div className="speaker">
                <img src="/panelists/tianyi.JPG" alt="Tianyi Sun" className="speaker-photo" />
                <span className="speaker-name">Tianyi Sun</span>
                <p className="speaker-role">Backslash Art Award @ Cornell Tech<br />Finalist, The 6th VH AWARD @ Hyundai Artlab</p>
              </div>
              <div className="speaker">
                <img src="/panelists/collin_mller.png" alt="Collin Miller" className="speaker-photo" />
                <span className="speaker-name">Collin Miller</span>
                <p className="speaker-role">Creator of Subway Builder,<br />Founder @ Redistricter</p>
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* Register */}
      <section className="register-section" id="register">
        <h2 className="section-marker"><TypewriterText>GET TICKETS!</TypewriterText></h2>
        <div className="register-embed">
          <iframe
            src="https://luma.com/embed/event/evt-wHAPSOlDgofkjku/simple"
            width="100%"
            height="350"
            frameBorder="0"
            scrolling="no"
            style={{ border: 'none', borderRadius: '4px', overflow: 'hidden' }}
            allow="fullscreen; payment"
            aria-hidden="false"
            tabIndex="0"
            title="Register for Event"
          />
        </div>
        <a href="https://luma.com/p202e71l" target="_blank" rel="noopener noreferrer" className="cta-btn cta-primary" style={{marginTop: 'var(--space-md)', display: 'block', width: 'fit-content', marginLeft: 'auto', marginRight: 'auto'}}>Attend</a>
      </section>

      {/* You Belong Here
      <section className="belong" id="attend">
        <h2 className="section-marker"><TypewriterText>Who Should Join?</TypewriterText></h2>
        <div className="rolodex-grid" ref={fadeRef}>
          {[
            { title: 'Founders', tagline: 'Hire top AI talent early, pilot with users, pitch to funders.' },
            { title: 'Investors', tagline: 'Curated early-stage deal flow in AI and cultural startups.' },
            { title: 'Urbanists & Organizers', tagline: 'Move from policy papers to pilots. Stay fluent in the tech reshaping cities.' },
            { title: 'Artists & Designers', tagline: 'Collaborate with engineers who build tools, not just use them.' },
            { title: 'Engineers & Tinkerers', tagline: 'Demo prototypes to partners who can greenlight pilots.' },
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
      </section> */}

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
        {/* <h2 className="section-marker">Our Team</h2> */}
        <div className="team-tiers">
          {/* Row 1 — Lead Organizers, centered */}
          <p className="team-tier-label" style={{textAlign: 'center'}}>Lead Organizers</p>
          <div className="team-tier" style={{justifyContent: 'center'}}>
            <div className="team-member">
              <a href="https://www.linkedin.com/in/michelle-hui/" target="_blank" rel="noopener noreferrer">
                <img src="/team/michelle.png" alt="Michelle Hui" className="team-member-photo" />
              </a>
              <a href="https://www.linkedin.com/in/michelle-hui/" target="_blank" rel="noopener noreferrer" className="team-member-name">Michelle Hui</a>
              <p className="team-member-role">Lead Organiser</p>
            </div>
            <div className="team-member">
              <a href="https://atmikapai.dev" target="_blank" rel="noopener noreferrer">
                <img src="/team/atmika.png" alt="Atmika Pai" className="team-member-photo" />
              </a>
              <a href="https://atmikapai.dev" target="_blank" rel="noopener noreferrer" className="team-member-name">Atmika Pai</a>
              <p className="team-member-role">Lead Organiser</p>
            </div>
          </div>
          {/* Row 2 — Operations + Faculty Advisors side by side */}
          <div className="team-row-split">
            <div className="team-subgroup">
              <p className="team-tier-label">Operation Leads</p>
              <div className="team-tier">
                <div className="team-member team-member--sm">
                  <a href="https://www.linkedin.com/in/ninamantegna/" target="_blank" rel="noopener noreferrer">
                    <img src="/team/nina.jpg" alt="Nina Mantegna" className="team-member-photo" />
                  </a>
                  <a href="https://www.linkedin.com/in/ninamantegna/" target="_blank" rel="noopener noreferrer" className="team-member-name">Nina Mantegna</a>
                  <p className="team-member-role">Operations</p>
                </div>
                <div className="team-member team-member--sm">
                  <a href="https://www.linkedin.com/in/gabriela-yaulli-herrera/" target="_blank" rel="noopener noreferrer">
                    <img src="/team/gabi.jpg" alt="Gabriela Yaulli Herrera" className="team-member-photo" />
                  </a>
                  <a href="https://www.linkedin.com/in/gabriela-yaulli-herrera/" target="_blank" rel="noopener noreferrer" className="team-member-name">Gabriela Yaulli Herrera</a>
                  <p className="team-member-role">Operations</p>
                </div>
                <div className="team-member team-member--sm">
                  <a href="https://www.instagram.com/cccliyay/?hl=en" target="_blank" rel="noopener noreferrer">
                    <img src="/team/cecilia.jpg" alt="Cecilia Chen" className="team-member-photo" />
                  </a>
                  <a href="https://www.instagram.com/cccliyay/?hl=en" target="_blank" rel="noopener noreferrer" className="team-member-name">Cecilia Chen</a>
                  <p className="team-member-role">Curator</p>
                </div>
              </div>
            </div>
            <div className="team-subgroup">
              <p className="team-tier-label">Faculty Advisors</p>
              <div className="team-tier">
                <div className="team-member team-member--sm">
                  <a href="https://techcrunch.com/2008/07/15/confirmed-twitter-acquires-summize-search-engine/" target="_blank" rel="noopener noreferrer">
                    <img src="/team/greg.png" alt="Greg Pass" className="team-member-photo" />
                  </a>
                  <a href="https://techcrunch.com/2008/07/15/confirmed-twitter-acquires-summize-search-engine/" target="_blank" rel="noopener noreferrer" className="team-member-name">Greg Pass</a>
                  <p className="team-member-role">Co-founder @ 4149 & Backslash, ex-CTO @ Twitter</p>
                </div>
                <div className="team-member team-member--sm">
                  <img src="/team/wendy.png" alt="Wendy Ju" className="team-member-photo" />
                  <span className="team-member-name">Wendy Ju</span>
                  <p className="team-member-role">Cornell Tech, ex-Center for Design Research @ Stanford University</p>
                </div>
                <div className="team-member team-member--sm">
                  <a href="https://www.fastcompany.com/3067006/how-ariel-kennan-solves-nycs-most-intractable-design-problems" target="_blank" rel="noopener noreferrer">
                    <img src="/team/ariel.png" alt="Ariel Kennan" className="team-member-photo" />
                  </a>
                  <a href="https://www.fastcompany.com/3067006/how-ariel-kennan-solves-nycs-most-intractable-design-problems" target="_blank" rel="noopener noreferrer" className="team-member-name">Ariel Kennan</a>
                  <p className="team-member-role">Georgetown's Beeck Center for Social Impact, ex-Design @ Google's Sidewalk Labs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-mark">Keeping it <span style={{color: '#ff3d00'}}>Urban</span> 2026</p>
          <a
            href="https://calendar.app.google/uftQ7pSVw5x32Fq1A"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-contact"
          >
           Chat With Us
          </a>
        </div>
      </footer>

    </div>
  )
}

export default App
