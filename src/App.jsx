import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

// Tessellation grid configuration
const GRID_COLS = 16
const GRID_ROWS = 10

function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const heroRef = useRef(null)
  const tilesRef = useRef([])

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
    const opacity = 0.03 + proximity * 0.15

    // Subtle shift toward mouse
    const shiftX = dx * proximity * 3
    const shiftY = dy * proximity * 3

    return {
      opacity,
      transform: `translate(${shiftX}px, ${shiftY}px)`,
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Thank you for reaching out. We will be in touch.')
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
          <div className="hero-marker">March 24, 2026</div>
          <h1 className="hero-title">
            <span className="title-main">Keeping Urban</span>
            <span className="title-sub">Art, Tech, Collective</span>
          </h1>
          <div className="hero-details">
            <p className="hero-location">Cornell Tech, NYC</p>
            <p className="hero-context">A one-day summit during NYC Open Data Week</p>
          </div>
          <nav className="hero-cta">
            <a href="#open-call" className="cta-button cta-primary">Open Call</a>
            <a href="#pitches" className="cta-button">Startup Pitches</a>
            <a href="#attend" className="cta-button">Attend</a>
          </nav>
        </div>
      </header>

      {/* Context & Reputability */}
      <section className="context">
        <div className="context-grid">
          <div className="signal">
            <span className="signal-number">150</span>
            <span className="signal-label">Participants</span>
          </div>
          <div className="signal">
            <span className="signal-number">15</span>
            <span className="signal-label">Artists<br/>Immersive Work</span>
          </div>
          <div className="signal">
            <span className="signal-number">16</span>
            <span className="signal-label">Founders<br/>Urban & Civic Ventures</span>
          </div>
        </div>
        <div className="affiliations">
          <span className="affiliation-tag">NYC Open Data Week</span>
          <span className="affiliation-tag">Backslash Arts</span>
          <span className="affiliation-tag">Cornell Tech</span>
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
        <div className="statement-content">
          <h2 className="statement-title">On Keeping Urban</h2>
          <div className="statement-text">
            <p>
              Cities are being reshaped—often without the people who live in them.
              Gentrification accelerates. Cultural spaces close. Technology arrives
              as solution before it arrives as question. The backlash to top-down
              tech is not irrational; it is a response to exclusion dressed as progress.
            </p>
            <p>
              Keeping Urban begins from a different premise: that art and culture
              are infrastructure, not decoration. That civic technology should serve
              communities, not extract from them. That the people most affected by
              urban change should be central to shaping it.
            </p>
            <p>
              This summit is a reclaiming—of narrative, of space, of who gets to
              imagine the city. It is a convergence of culture, civic technology,
              and community power. Not a pitch competition dressed as progress.
              Not an art fair dressed as activism. A space for dialogue, visibility,
              and collaboration.
            </p>
            <p className="statement-close">
              We are not here to disrupt. We are here to keep.
            </p>
          </div>
        </div>
      </section>

      {/* You Belong Here */}
      <section className="belong" id="attend">
        <h2 className="section-marker">You Belong Here</h2>
        <p className="belong-intro">
          Keeping Urban convenes across sectors. If you work at the intersection
          of cities, culture, and civic life—there is a place for you.
        </p>
        <div className="placards">
          <article className="placard">
            <h3 className="placard-title">Artists</h3>
            <p className="placard-text">
              Working with space, data, public intervention, or urban narrative.
              Your practice is research. Your work is evidence. Show with us,
              speak with us, or join as witness.
            </p>
            <span className="placard-role">Presenter / Exhibitor / Attendee</span>
          </article>
          <article className="placard">
            <h3 className="placard-title">Founders</h3>
            <p className="placard-text">
              Building for housing, mobility, public space, civic engagement,
              or community infrastructure. Pitch your venture. Meet collaborators.
              Find believers who understand the work.
            </p>
            <span className="placard-role">Pitcher / Panelist / Attendee</span>
          </article>
          <article className="placard">
            <h3 className="placard-title">Civic & Government Leaders</h3>
            <p className="placard-text">
              Open data stewards, urban planners, policy designers, and public
              servants. The people who make systems—and the people trying to
              make them more human.
            </p>
            <span className="placard-role">Panelist / Collaborator / Attendee</span>
          </article>
          <article className="placard">
            <h3 className="placard-title">Community Members & Urban Enthusiasts</h3>
            <p className="placard-text">
              Residents, organizers, students, and anyone who cares about the
              city they live in. You don't need a title. You need to show up.
            </p>
            <span className="placard-role">Attendee / Voice / Neighbor</span>
          </article>
        </div>
      </section>

      {/* Contact */}
      <section className="contact" id="contact">
        <h2 className="section-marker">Get in Touch</h2>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-field">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows="4" required></textarea>
          </div>
          <button type="submit" className="form-submit">Send</button>
        </form>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-mark">Keeping Urban 2026</p>
          <p className="footer-location">Cornell Tech, Roosevelt Island, NYC</p>
          <p className="footer-affiliation">
            Part of NYC Open Data Week · In collaboration with Backslash Arts
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
