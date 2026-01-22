# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Keeping It Urban is a single-page React website for a one-day summit during NYC Open Data Week (March 24, 2026) at Cornell Tech. The site promotes an event at the intersection of art, civic technology, and urban culture.

## Commands

```bash
# Development
npm run dev        # Start Vite dev server

# Build & Deploy
npm run build      # Build for production (outputs to dist/)
npm run preview    # Preview production build locally
npm run deploy     # Build and deploy to GitHub Pages (gh-pages -d dist)

# Linting
npm run lint       # Run ESLint
```

## Architecture

This is a minimal Vite + React 19 project with a single-page structure:

- **`src/App.jsx`** - The entire site as a single component (~675 lines). Contains:
  - Procedural street network SVG generation (`generateStreetNetwork`)
  - Mouse-interactive glow effects on street paths
  - All sections: Hero, Stats, Statement, Partners, Placards (flip cards), Program, Team, Footer

- **`src/App.css`** - All styles (~1900 lines). Uses CSS custom properties defined in `:root`. Key design elements:
  - `Press Start 2P` pixel font for headings
  - Accent color: `#ff3d00` (orange)
  - Dark theme with `#0a0a0a` background
  - Animated marquees, glitch effects, wave text animations

- **`public/`** - Static assets (partner logos, team photos, stakeholder images)

## Key Patterns

- No routing - single page application
- No state management library - uses React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`)
- The hero street network uses a seeded random number generator for deterministic SVG path generation
- CSS animations are used extensively (marquees, glitch effects, fade-ins)
- `prefers-reduced-motion` media query disables animations for accessibility

## Deployment

The site deploys to GitHub Pages at `keepingiturban.com` (custom domain configured via `public/CNAME`).
