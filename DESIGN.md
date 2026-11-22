---
name: Wordingo
description: AI Vocabulary Master - The Minimalist Study Deck
colors:
  primary: "#fafafa"
  primary-foreground: "#18181b"
  primary-hover: "#e4e4e7"
  neutral-bg: "#09090b"
  surface: "#18181b"
  surface-elevated: "#27272a"
  surface-active: "#1f1f23"
  border: "#27272a"
  border-subtle: "#3f3f46"
  text-primary: "#fafafa"
  text-secondary: "#a1a1aa"
  text-tertiary: "#52525b"
  status-success: "#22c55e"
  status-error: "#ef4444"
  status-warning: "#eab308"
  status-info: "#3b82f6"
typography:
  display:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  sheet: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
---

# Design System: Wordingo

## Overview

**Creative North Star: "The Minimalist Study Deck"**

Wordingo is designed as a focused, distraction-free study deck built for deep vocabulary retention. The visual philosophy strips away unnecessary AI decoration, gratuitous neon gradients, and visual noise in favor of a quiet, purposeful monochrome atmosphere. The interface is optimized to feel like a premium, tactile physical deck of cards translated into an intimate dark-mode mobile experience.

Depth is achieved not through heavy drop shadows, but through deliberate tonal layering of deep zinc surfaces (`#09090b` canvas to `#18181b` card surfaces to `#27272a` interactive elements). Micro-interactions are restrained yet tactile, employing subtle scale presses and crisp transitions that provide immediate physical feedback without breaking concentration.

**Key Characteristics:**
- **Monochrome Foundation:** Deep zinc tones dominate 95%+ of the interface; color is reserved strictly for functional status.
- **Tactile Feedback:** 12px to 16px rounded corners, springy active-state scale presses (0.96-0.98), and fluid bottom sheets.
- **Mobile-First Ergonomics:** 44px minimum touch targets, 100dvh dynamic viewport handling, and iOS safe-area support.
- **Zero AI Slop:** No purple-to-cyan decorative gradients, no unnecessary card-in-card nesting, and no vague decorative icons.

## Colors

The palette is strictly monochrome and functional. Zinc neutrals establish readability and hierarchy, while vibrant status accents are introduced only to provide immediate feedback on learning actions (correct, incorrect, warning).

### Primary
- **Zinc Light (#fafafa):** The primary foreground action color. High-contrast, stark, and immediately communicative for primary action triggers and active states.

### Neutral
- **Deep Void Canvas (#09090b):** The foundational application canvas (zinc-950).
- **Surface Elevation (#18181b):** Card, bottom sheet, and modal container surface (zinc-900).
- **Surface Interactive / Border (#27272a):** Secondary buttons, form inputs, list dividers, and subtle strokes (zinc-800).
- **Subtle Stroke (#3f3f46):** Active borders, dividers, and handle indicators (zinc-700).
- **Primary Ink (#fafafa):** Headlines, selected choices, and primary text (zinc-50).
- **Muted Ink (#a1a1aa):** Subtitles, metadata, and secondary labels (zinc-400).
- **Placeholder Ink (#52525b):** Empty inputs and disabled indicators (zinc-600).

### Status (Functional Feedback Only)
- **Correct Emerald (#22c55e):** Instant feedback for correct quiz answers and mastered words.
- **Error Rose (#ef4444):** Instant feedback for incorrect answers and destructive actions.
- **Warning Amber (#eab308):** In-progress indicators and review flags.
- **Info Blue (#3b82f6):** Neutral informative badges.

### Named Rules
**The Functional Accent Rule:** Color accents exist only to inform, never to decorate. A button or card must never use a colored or gradient background unless it directly represents a quiz result or status indicator.

## Typography

**Display & Body Font:** Inter (`'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)

**Character:** Clean, objective, and highly legible across both small phone viewports and expansive desktop screens. Strict tabular tracking for numbers and stats.

### Hierarchy
- **Display** (Bold 700, clamp(28px, 7vw, 36px), line-height: 1.2): Quiz target words, large splash numbers.
- **Headline** (Semi-Bold 600, clamp(20px, 5vw, 24px), line-height: 1.3): Page headers, modal titles, deck names.
- **Title** (Semi-Bold 600, clamp(16px, 4vw, 18px), line-height: 1.4): Card group headers, section groupings.
- **Body** (Regular 400 & Medium 500, 15px - 16px, line-height: 1.5): Vocabulary meanings, descriptions, form input values.
- **Label / Caption** (Semi-Bold 600, clamp(10px, 2.5vw, 12px), line-height: 1, letter-spacing: 0.02em): CEFR badges (A1-C2), stat counters, tabs.

### Named Rules
**The Zoom Prevention Rule:** All inputs and text areas must have a computed font-size of at least 16px on mobile viewports to prevent iOS Safari auto-zoom.

## Layout

- **Spatial Rhythm:** 4px baseline unit. Standard spacing scale uses 8px, 12px, 16px, 24px, and 48px.
- **Mobile-First Container:** Max content width centered at 640px for quiz and list focus, expanding to 1024px on desktop dashboards.
- **Viewport Resilience:** Full screen uses `min-height: 100dvh` to handle mobile address bar collapse smoothly.
- **Safe Area Insets:** Explicit padding applied with `env(safe-area-inset-bottom, 0px)` for floating action buttons, nav bars, and bottom sheets.

## Elevation & Depth

**Tonal Stepping Over Shadows:** Depth is structural rather than luminous. Surfaces step upwards through color values rather than blurry ambient drop shadows.

- **Level 0 (Canvas):** `#09090b`
- **Level 1 (Card & Content Surface):** `#18181b` with 1px border of `#27272a`.
- **Level 2 (Active Element & Inputs):** `#27272a` with subtle border `#3f3f46`.
- **Level 3 (Modals & Toasts):** `#18181b` with `backdrop-filter: blur(12px)` and focused elevation shadow `0 10px 40px rgba(0, 0, 0, 0.4)`.

### Named Rules
**The No-Float Rule:** Cards and list rows do not cast soft drop shadows at rest. They define their boundaries through 1px border contrast (`#27272a`) and surface contrast.

## Shapes

- **Radius Hierarchy:**
  - **8px (sm):** Status indicators, inner progress meters, tooltips.
  - **12px (md):** Buttons, inputs, search fields, list rows.
  - **16px (lg):** Deck cards, action popups, floating action buttons.
  - **20px (xl):** Modals, full dialogs, pill tags.
  - **24px (sheet):** Top radii of mobile bottom sheets.
- **Borders:** Crisp, 1px uniform solid borders (`#27272a`). No dashed or heavy outlines.

## Components

### Buttons
- **Shape:** 12px radius (`rounded.md`), min-height 44px for thumb touch accuracy.
- **Primary:** Background `#fafafa`, text `#18181b`. Active state compresses to `scale(0.96)`.
- **Secondary:** Background `#27272a`, border `1px solid #3f3f46`, text `#fafafa`. Active state background `#3f3f46`.
- **Ghost:** Transparent background, text `#a1a1aa`. Active background `#27272a`, text `#fafafa`.

### Cards & Deck Containers
- **Style:** Background `#18181b`, border `1px solid #27272a`, radius 16px (`rounded.lg`), padding 16px.
- **Interaction:** Active touch press compresses to `scale(0.98)` with background shift to `#1f1f23`.

### Inputs & Search Bars
- **Style:** Background `#09090b`, border `1px solid #27272a`, radius 12px, padding 14px 16px, font-size 16px.
- **Focus:** Border shifts to `#fafafa` with subtle ring `box-shadow: 0 0 0 2px rgba(250, 250, 250, 0.1)`.

### Status Badges (CEFR & Stats)
- **Style:** Inline-flex, radius 20px (pill), padding 4px 10px, font-size 12px, font-weight 600.
- **Variants:**
  - Success: Background `rgba(34, 197, 94, 0.15)`, text `#22c55e`, border `1px solid rgba(34, 197, 94, 0.3)`.
  - Error: Background `rgba(239, 68, 68, 0.15)`, text `#ef4444`, border `1px solid rgba(239, 68, 68, 0.3)`.
  - Neutral / CEFR: Background `#27272a`, text `#fafafa`, border `1px solid #3f3f46`.

### Quiz Option Tiles
- **Style:** Full-width button with 12px radius, min-height 52px, text-align left, padding 16px.
- **Resting:** Background `#18181b`, border `1px solid #27272a`, text `#fafafa`.
- **Correct State:** Background `rgba(34, 197, 94, 0.15)`, border `rgba(34, 197, 94, 0.5)`, text `#22c55e`.
- **Wrong State:** Background `rgba(239, 68, 68, 0.15)`, border `rgba(239, 68, 68, 0.5)`, text `#ef4444`.

## Do's and Don'ts

### Do:
- **Do** maintain a strict 44px minimum height for interactive elements to guarantee mobile thumb accessibility.
- **Do** use tonal surface progression (`#09090b` → `#18181b` → `#27272a`) to express hierarchy.
- **Do** keep quiz questions and options calm, clear, and high-contrast to prevent eye fatigue.
- **Do** preserve safe area padding for navigation and action bars (`env(safe-area-inset-bottom)`).

### Don't:
- **Don't** introduce purple/violet-to-cyan gradient cards, AI sparkle overlays, or colorful backgrounds on content tiles.
- **Don't** nest cards inside cards with redundant borders.
- **Don't** use font sizes smaller than 16px on form inputs to prevent browser viewport jumping.
- **Don't** use ambient drop shadows for resting card states.
