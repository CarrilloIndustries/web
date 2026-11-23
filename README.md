# Portfolio

Cameron Carrillo's web design site and portfolio, published with GitHub Pages at https://cam-carrillo.github.io/portfolio/.

The home page markets Cameron's web design and development work. Its Work section shows every sample site and tool in this repo. Every brand in the samples is fictional. Each website rebuilds a layout idea from a site with strong structure, written from scratch with original code, copy and imagery.

## What's where

| Path | What it is |
| --- | --- |
| `index.html` | The home page: services, process, about, rates, questions and contact. Its Work section reads `catalog.json`. |
| `assets/` | The home page's stylesheet, script, icon and share image. |
| `sites/<slug>/` | One folder per website. |
| `tools/<slug>/` | One folder per web tool. |
| `thumbs/` | Gallery screenshots. |
| `catalog.json` | Work section entries, newest last. Add `"featured": true` to an entry to pin it to the first six cards. |
| `BACKLOG.md` | What gets built next. Edit it to steer the weekly build. |
| `CLAUDE.md` | The build rules the agent follows. |
| `ATTRIBUTION.md` | Third-party assets and their licenses. |

## Contact form

The home page form sends through [Formspree](https://formspree.io). To turn it on, create a free form there using cam.carrillo@carrilloindustries.com. Then, in `index.html`, paste the form's URL (`https://formspree.io/f/…`) into both the `action` and the `data-endpoint` attributes of `<form id="contact-form">`. Until then, sending the form opens the visitor's email app with their message filled in.

## Weekly build

A scheduled Claude Code routine runs every Wednesday at 6 pm Pacific. It builds the next two unchecked items in `BACKLOG.md` on a `claude/portfolio-<date>` branch and opens a pull request. Review the pull request, then merge it to publish. Pause or edit the routine at https://claude.ai/code/routines.
