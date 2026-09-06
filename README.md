# Jaybond Holliete — Portfolio

A single-page portfolio with a "Player Console" theme: claymorphic game-HUD panels fused with crisp pixel-art accents. Pure HTML5, CSS3, and vanilla ES6+ JavaScript. No frameworks, no build step, no backend.

## Run it

Open `index.html` directly in a browser, or serve the folder with any static host:

```bash
# Python
python -m http.server 8080

# Node (no install)
npx serve .
```

Then visit `http://localhost:8080`.

## Structure

```
index.html              # all six sections + inline pixel-icon symbol defs
css/
  tokens.css            # color/type/space/radius custom properties (single source of truth)
  reset.css             # modern baseline
  layout.css            # nav, sections, grids, footer
  components.css        # clay panels, buttons, stat bars, badges, toasts, boot, cursor
  animations.css        # boot, blob drift, achievement pop, reduced-motion overrides
  responsive.css        # 375 / 414 / 768 / 1440 breakpoints
js/
  sound.js              # 8-bit WebAudio blips (muted by default)
  main.js               # boot, nav, smooth scroll, active link, copy email, to-top, toast
  scroll-reveal.js      # one-time skill-bar fill + achievement unlock (IntersectionObserver)
  particles-cursor.js   # pixel dot + easing trail (desktop only)
  easter-egg.js         # Konami code → toast + pixel confetti
assets/
  icons/                # hand-built 16x16 pixel-grid SVGs (also inlined as <symbol> in HTML)
  images/               # empty — drop real photos/screenshots here
```

## Before you publish — placeholders to replace

Search the HTML for these comments to find every spot that needs real content:

- `ABOUT BIO` — personalize the bio (school/org name, tone).
- `ASSET SLOT` — replace portrait + project screenshot placeholders with real images. Keep the wrapper dimensions.
- `PROJECT PLACEHOLDER` — replace each project's title, description, and screenshot.
- `ACHIEVEMENT ROLE` — if "Participant" should be "Finalist" / "Awardee", one-word find-and-replace.
- `TODO: add real profile link` — swap the `#` in Contact for real GitHub/LinkedIn URLs.

## Design tokens

All colors and fonts live in `css/tokens.css` as CSS custom properties. Never hardcode a hex or inline `font-family` elsewhere — change a token once, it propagates everywhere.

## Features

- **Boot sequence**: a ~1s pixel progress bar + hero assemble, plays once per session (session-stored flag).
- **Skills**: 5-tier segmented stat bars with a written tier label (not bar-length-only). Fills once on scroll-into-view.
- **Achievements**: trophy-case badges that "unlock" with a staggered scale+glow pop, once on scroll.
- **Custom cursor**: pixel dot + easing trail on desktop; disabled on touch and under reduced-motion.
- **Sound**: 8-bit UI blips on clicks/unlocks. Muted by default with a visible speaker toggle. Never autoplays.
- **Easter egg**: Konami code (↑ ↑ ↓ ↓ ← → ← → B A) → "ACHIEVEMENT UNLOCKED" toast + pixel confetti. Non-blocking.
- **Contact**: `mailto:` primary CTA + "Copy email" with toast confirmation. No backend.

## Accessibility

- No horizontal scroll at 375/414/768/1440px (`overflow-x: clip`).
- Visible keyboard focus states restyled to the theme.
- `prefers-reduced-motion` disables boot, blob drift, cursor trail, and achievement pop.
- Decorative blobs/icons are `aria-hidden`; stat bars carry `aria-label` with the tier name.

## Tech constraints

- Only external resource: Google Fonts CDN link.
- Zero console errors, zero build dependencies.
