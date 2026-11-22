# Portfolio build rules

This repo is Cameron Carrillo's public portfolio of websites and web tools. GitHub Pages serves `main` from the repo root at https://cam-carrillo.github.io/portfolio/. Prospective clients browse it to see what working with Cameron gets them, so every piece must look and behave like real, finished client work.

`index.html` is the gallery. It reads `catalog.json`; you never need to edit the gallery to add an item.

## Originality (non-negotiable)

Each website is a from-scratch rebuild of a layout idea taken from a real site (the "reference" named in `BACKLOG.md`).

- Study the reference for structure only: section order, grid, spacing rhythm, type hierarchy, navigation pattern, interactions.
- Never copy the reference's code, CSS, text, images, icons, logos, illustrations, font files or brand name. Write every line yourself.
- Invent a fictional brand for each site. Search the web to make sure the name isn't a well-known real company, and that it doesn't resemble the reference's brand.
- Write all copy for the fictional brand. No lorem ipsum, no placeholder text.
- Testimonials and team members, if any, use invented names. Never attribute quotes to real people or real companies, and never show real company logos ("as seen in", client logo strips and so on).
- Every site's footer carries this line: "Portfolio concept by Cameron Carrillo. <Brand> is a fictional company." Link "Cameron Carrillo" to `../../`.
- Images: prefer CSS, SVG or canvas-generated art. Photos only from sources that allow free commercial use (Unsplash, Pexels), saved into the item's folder, never hotlinked, and credited in `ATTRIBUTION.md`.
- Fonts: Google Fonts via `<link>`, or system font stacks.
- Icons: draw them as inline SVG, or copy from MIT/ISC-licensed sets (Lucide, Heroicons) and note the license in `ATTRIBUTION.md`.

Tools may borrow a reference tool's interaction model (for example, "press space to generate a new palette"), but their visual design and code must be original.

## Structure

- Websites: `sites/<slug>/index.html`, with any CSS, JS and assets inside that folder.
- Tools: `tools/<slug>/index.html`, same rule.
- No build step. Plain HTML, CSS and JS that work when GitHub Pages serves the folder.
- Relative paths only: the site lives under `/portfolio/`, so a root-relative path like `/css/x.css` breaks.
- External scripts only when they do real work, and only from cdnjs.cloudflare.com or cdn.jsdelivr.net with a pinned version.
- Each item has a small "← Portfolio" link back to `../../`.

## Quality bar

- Responsive from 360px to 1440px wide, with no horizontal scrolling.
- Accessible: semantic HTML, alt text, visible keyboard focus, WCAG AA contrast, and `prefers-reduced-motion` respected.
- Light: no frameworks, images compressed (WebP where possible, ideally under 200 KB each).
- A distinct visual identity per item: its own palette, type pairing and layout. Read `catalog.json` and don't repeat the look of earlier items.
- Websites feel like a real business: 4–7 sections, working anchor navigation, a working mobile menu, and forms that validate in the browser and show a success state. Forms never actually submit anywhere.
- Tools work entirely in the browser and open with useful defaults rather than an empty screen. Offer copy-to-clipboard and file downloads (PNG, SVG, CSS) where they make sense.

## Variety rules for new backlog ideas

When the backlog runs low, add ideas to the bottom of `BACKLOG.md` following these rules:

- About three websites for every tool.
- Spread across industries: local services (dental, HVAC, landscaping), restaurants and cafés, B2B SaaS, hardware and engineering startups (Cameron's niche, so keep some coming), real estate, fitness, nonprofits, creative portfolios, e-commerce product pages, events.
- Spread across styles: minimal, editorial, bold or brutalist, playful, luxury, technical.
- Name a reference site with a strong layout for each website idea.

## catalog.json entries

Append one object per finished item:

```json
{
  "slug": "halyard-embedded",
  "type": "site",
  "title": "Halyard Embedded",
  "industry": "Engineering consultancy",
  "style": ["technical", "dark"],
  "summary": "One sentence a client would understand.",
  "path": "sites/halyard-embedded/",
  "reference": "Layout studied: oxide.computer",
  "added": "YYYY-MM-DD",
  "thumb": "thumbs/halyard-embedded.png"
}
```

`type` is `"site"` or `"tool"`. Use `"thumb": ""` when no screenshot could be made; the gallery falls back to a title card.

## Checks before each commit

1. Confirm every file the new page references actually exists at that relative path.
2. Search the new folder for the reference's domain and brand name. There must be zero matches.
3. If Node is available, run `npx --yes html-validate "<folder>/**/*.html"` and fix all errors.
4. If a headless browser can be installed (`npx --yes playwright install chromium`), screenshot the item at 1280×800 into `thumbs/<slug>.png`, and at 390×844 to check the mobile layout. Otherwise leave `thumb` empty.
5. Confirm `catalog.json` is still valid JSON.

## Git

Work only on the `claude/...` branch the routine prompt names. Make one commit per finished item. Push the branch and open a pull request into `main`. Never push to `main` and never merge.
