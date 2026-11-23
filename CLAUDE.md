# Portfolio build rules

This repo is Cameron Carrillo's public portfolio of websites and web tools. GitHub Pages serves `main` from the repo root at https://carrilloindustries.com/web/. Prospective clients browse it to see what working with Cameron gets them, so every piece must look and behave like real, finished client work.

`index.html` is Cameron's real marketing site: services, process, rates, about and a contact form. Its Work section reads `catalog.json`, so you never need to edit it to add an item. Leave `index.html`, `assets/` and `apps-script/` alone unless the routine prompt asks for a change there. The contact form on that page is real: it posts to the Apps Script in `apps-script/`, which emails Cameron. The forms in `sites/` and `tools/` never submit anywhere.

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
- Relative paths only: the site lives under `/web/`, so a root-relative path like `/css/x.css` breaks.
- External scripts only when they do real work, and only from cdnjs.cloudflare.com or cdn.jsdelivr.net with a pinned version.
- Each item has a small "← Portfolio" link back to `../../`.

## Quality bar

- Responsive from 360px to 1440px wide, with no horizontal scrolling.
- Accessible: semantic HTML, alt text, visible keyboard focus, WCAG AA contrast, and `prefers-reduced-motion` respected.
- Light: no frameworks, images compressed (WebP where possible, ideally under 200 KB each).
- A distinct visual identity per item: its own palette, type pairing and layout. Read `catalog.json` and don't repeat the look of earlier items.
- Websites feel like a real business: 4–7 sections, working anchor navigation, a working mobile menu, and forms that validate in the browser and show a success state. Forms never actually submit anywhere.
- Tools work entirely in the browser and open with useful defaults rather than an empty screen. Offer copy-to-clipboard and file downloads (PNG, SVG, CSS) where they make sense.

## Cutaway library (`tools/cutaways/`)

A library of animated cutaway illustrations that a service business could drop into its own website. It takes the house and building cutaways on the LAPS HVAC site (`sites/laps-hvac/index.html`, the `.dia` diagrams) and applies the idea to other careers. Study those diagrams for the look:

- flat technical cross-sections with 2–3 px outlines
- parts labeled in small uppercase text
- dashed lines that flow to show water, power or air moving
- small worker figures with a moving arm

Each animation is one self-contained SVG file, `tools/cutaways/anim/<slug>.svg`:

- **Format:**
  - `viewBox="0 0 600 420"`, a transparent background and under 40 KB.
  - No scripts, external files or web fonts. Labels use a system font stack.
- **Accessibility:** `role="img"`, a `<title>`, and a one-sentence `<desc>` that says what moves.
- **Colors:**
  - Every color comes from CSS custom properties declared at the top of the file's `<style>`: `--ink` (outlines), `--fill` (surfaces), `--accent` (the main thing that moves), `--accent-2` (a second flow) and `--label` (text).
  - The defaults must read well on both white and near-black backgrounds.
- **Motion:**
  - Use CSS keyframes or SMIL only, so the file still moves when a site uses it as `<img src>`.
  - Loop seamlessly in 4 to 12 seconds.
  - Inside `@media (prefers-reduced-motion: reduce)`, stop all motion and show a frame that still explains the idea.
- **Content:**
  - No logos, brand names or real products.
  - Keep the set consistent: the same line weights, label style and worker figure in every file.

`tools/cutaways/index.html` is the gallery:

- **Cards:** one card per animation, showing the animation, the career, and one line on where it fits on a site (hero, services, or a how-it-works section).
- **Pausing:**
  - Fetch each SVG file and place it inline, so the page can pause it.
  - Give each card a play/pause button, and add one that pauses everything.
  - Pause animations that are scrolled out of view.
- **Recoloring:** an accent color picker with a few presets that recolors every animation live.
- **Export:** "Copy SVG" and "Download .svg" on each card, with the chosen colors written into the file.
- **Look:** its own visual identity, distinct from the other portfolio items. Like everything else, it works from 360 px to 1440 px.

Build and commit rules:

- Commit each animation on its own as soon as it's finished (`Add <career> cutaway`), so finished work survives if the run ends early.
- Add the catalog entry (`"type": "tool"`), the thumbnail and the BACKLOG tick once the gallery works.
- If the run can't finish every animation a BACKLOG line asks for:
  - Open the pull request with what's done.
  - Add a new unchecked BACKLOG line that lists the rest.
- Later BACKLOG lines may add more animations to this library. Add them to the same gallery instead of making a new tool.
- Before each commit, also check that every SVG in `anim/` parses as XML, contains no `<script>`, and stays under 40 KB.

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
  "features": ["Up to four short highlights", "Each one a phrase, not a sentence"],
  "path": "sites/halyard-embedded/",
  "reference": "Layout studied: oxide.computer",
  "added": "YYYY-MM-DD",
  "thumb": "thumbs/halyard-embedded.png"
}
```

`type` is `"site"` or `"tool"`. Use `"thumb": ""` when no screenshot could be made; the Work section falls back to a title card. The card shows up to four `features`. Never add `"featured"`: Cameron sets it to pin a favorite to the first six cards on the home page.

## Checks before each commit

1. Confirm every file the new page references actually exists at that relative path.
2. Search the new folder for the reference's domain and brand name. There must be zero matches.
3. If Node is available, run `npx --yes html-validate "<folder>/**/*.html"` and fix all errors.
4. If a headless browser can be installed (`npx --yes playwright install chromium`), screenshot the item at 1280×800 into `thumbs/<slug>.png`, and at 390×844 to check the mobile layout. Otherwise leave `thumb` empty.
5. Confirm `catalog.json` is still valid JSON.

## Git

Work only on the `claude/...` branch the routine prompt names. Make one commit per finished item. Push the branch and open a pull request into `main`. Never push to `main` and never merge.
