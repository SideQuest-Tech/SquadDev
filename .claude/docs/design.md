# Design System & Principles

## Philosophy

**Human first, not tech-first.**
Every design decision should feel approachable to a non-technical business owner.
No jargon, no overloaded UIs, no "AI-generated" aesthetic (excessive gradients, glows, sci-fi colors).

**Minimalistic as the baseline.**
Start with nothing. Add an element only when it carries information or guides the user.
If you can remove it without losing meaning, remove it.

**Concise over verbose.**
Labels guide, not explain. One strong word beats a sentence. Icons plus a short label beats a paragraph.

---

## Tokens — use these, never hardcode values

```css
/* Colors */
--bg:      #0d0d0d   /* page background */
--bg-2:    #141414   /* alternate section / footer */
--panel:   #1c1c1c   /* cards, modals, elevated surfaces */
--ink:     #ece9e2   /* primary text */
--ink-2:   #9e9b96   /* secondary / muted text */
--ink-3:   #5a5754   /* disabled / placeholder */
--blue:    #2676ff   /* sole accent — CTAs, active states, links */
--blue-2:  #6da7ff   /* lighter accent for hover, highlights */
--line:    rgba(236,233,226,0.10)  /* borders, dividers */
--radius:  10px

/* Type scale — always use clamp(), never px fixed sizes in headings */
--text-xs:   clamp(8px,  0.75vw, 9px)
--text-sm:   clamp(10px, 0.95vw, 12px)
--text-base: clamp(14px, 1.1vw,  15px)
--text-md:   clamp(18px, 1.8vw,  24px)
--text-lg:   clamp(28px, 3.2vw,  39px)
--text-xl:   clamp(42px, 5vw,    63px)
--text-2xl:  clamp(46px, 6.8vw,  86px)
```

---

## Typography

| Role | Font | Weight |
|------|------|--------|
| Body copy, UI labels | DM Sans | 400–600 |
| Headings, logo, eyebrows | Manrope | 700–800 |

**Rules:**
- Never use more than 2 font families
- Headings use tight `letter-spacing: -0.03em` to -0.05em — keeps them modern without being technical
- Section eyebrows: ALL CAPS, `letter-spacing: 0.16em–0.18em`, `--blue`, 11–12px, 800 weight
- Body text sits at `--text-base`, line-height 1.6

---

## Spacing & Layout

- Container: `width: min(1180px, calc(100% - 48px)); margin: auto`
- Section padding: `68px 0` desktop → `52px 0` mobile
- Consistent gap rhythm: 8 / 12 / 20 / 28 / 48 / 68px — avoid arbitrary values
- Grid breakpoints: stack to single column at `≤800px`

---

## Component Patterns

### Buttons
```
Primary (btn):        --blue fill, white text, blue border
Secondary (btn-secondary): transparent, muted border, ink text
Ghost (btn-ghost):    no border, no bg, ink-2 text
Small (btn-small):    10px 15px padding, 13px font
```
- Always `display: inline-flex; align-items: center; gap: 9px`
- Icons at 14–16px, placed after label text
- Min touch target 44px on mobile

### Cards / Panels
- Background: `var(--panel)` `#1c1c1c`
- Border: `1px solid var(--line)`
- Radius: `var(--radius)` = 10px
- Padding: 24–28px

### Section Labels (eyebrow + rule)
```html
<div class="section-label">
  <span class="section-label-text">What we build</span>
  <div class="section-label-line"></div>
</div>
```
Always precedes section headings. Creates visual hierarchy without large decorative elements.

### Dot field / grid overlays
- Subtle `rgba(255,255,255,0.025)` grid lines, `52px 52px` size
- Masked with `linear-gradient(to bottom, black, transparent 92%)`
- Only in hero and CTA sections — not every section

---

## Dark Theme Rules

1. **Backgrounds alternate between `--bg` and `--bg-2`** — never the same consecutive section
2. **One accent color** — only `--blue`. No purple, no red, no teal as primaries
3. **Borders are subtle** — `var(--line)` at 10% opacity. Visible but not dominant
4. **White text on dark** — use `--ink` (#ece9e2), not pure #ffffff — easier on eyes

---

## What to Avoid

| ❌ Avoid | ✓ Use instead |
|---------|--------------|
| Multiple accent colors | Single `--blue` accent |
| Glassmorphism / heavy blur everywhere | Blur only on nav + modal overlays |
| Glow effects on text or cards | Subtle `box-shadow` with low opacity |
| Dense paragraphs in section intros | Max 2 sentences, then visuals |
| Technical jargon in labels | Plain business language |
| Centered body text in paragraphs | Left-aligned body copy |
| Animations on every element | Motion only for meaningful transitions |
| Inline `style={{}}` in JSX | CSS classes in `styles.css` |

---

## Mobile Rules

- Hamburger nav slides down as panel — `backdrop-filter: blur(20px)`
- Min touch target: `44px × 44px` for all interactive elements
- `100dvh` for full-height layouts (not `100vh`) — handles iOS bottom bar
- `env(safe-area-inset-*)` padding on modals/footers pinned to screen edges
- Hide decorative SVGs and sketch elements at `≤800px`
- Font sizes auto-scale via `clamp()` — no overriding needed at breakpoints for most text
