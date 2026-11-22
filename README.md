# Portfolio

Websites and web tools designed and built by Cameron Carrillo, published with GitHub Pages at https://cam-carrillo.github.io/portfolio/.

Every brand shown is fictional. Each website rebuilds a layout idea from a site with strong structure, written from scratch with original code, copy and imagery.

## What's where

| Path | What it is |
| --- | --- |
| `index.html` | The gallery page. It reads `catalog.json`. |
| `sites/<slug>/` | One folder per website. |
| `tools/<slug>/` | One folder per web tool. |
| `thumbs/` | Gallery screenshots. |
| `catalog.json` | Gallery entries, newest last. |
| `BACKLOG.md` | What gets built next. Edit it to steer the weekly build. |
| `CLAUDE.md` | The build rules the agent follows. |
| `ATTRIBUTION.md` | Third-party assets and their licenses. |

## Weekly build

A scheduled Claude Code routine runs every Wednesday at 6 pm Pacific. It builds the next two unchecked items in `BACKLOG.md` on a `claude/portfolio-<date>` branch and opens a pull request. Review the pull request, then merge it to publish. Pause or edit the routine at https://claude.ai/code/routines.
