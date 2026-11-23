# Portfolio

Cameron Carrillo's web design site and portfolio, published with GitHub Pages at https://carrilloindustries.com/web/.

The home page markets Cameron's web design and development work. Its Work section shows every sample site and tool in this repo. Every brand in the samples is fictional. Each website rebuilds a layout idea from a site with strong structure, written from scratch with original code, copy and imagery.

## What's where

| Path | What it is |
| --- | --- |
| `index.html` | The home page: services, process, about, rates, questions and contact. Its Work section reads `catalog.json`. |
| `assets/` | The home page's stylesheet, script, icon and share image. |
| `apps-script/` | The contact form's back end, a Google Apps Script. See "Contact form" below. |
| `sites/<slug>/` | One folder per website. |
| `tools/<slug>/` | One folder per web tool. |
| `thumbs/` | Gallery screenshots. |
| `catalog.json` | Work section entries, newest last. Add `"featured": true` to an entry to pin it to the first six cards. |
| `BACKLOG.md` | What gets built next. Edit it to steer the weekly build. |
| `CLAUDE.md` | The build rules the agent follows. |
| `ATTRIBUTION.md` | Third-party assets and their licenses. |

## Contact form

The home page form posts to a Google Apps Script web app, `apps-script/contact-form.gs`, which runs under Cameron's Google Workspace account at no cost. The script:

- emails each message to cam.carrillo@carrilloindustries.com, with Reply set to the visitor
- saves each message to a "Website inquiries" sheet in Google Drive
- ignores bots that fill the hidden field, and refuses more than 3 messages from one sender in 10 minutes or 30 from everyone in an hour

Until the form has an endpoint, sending it opens the visitor's email app with their message filled in.

To set it up:

1. Signed in as cam.carrillo@carrilloindustries.com, open https://script.google.com and click **New project**. Name it "Website contact form".
2. Replace everything in `Code.gs` with the contents of `apps-script/contact-form.gs`, then save.
3. Choose `setup` in the function list and click **Run**. Approve the permissions it asks for. It creates the sheet and emails you a link to it.
4. Click **Deploy → New deployment**, choose **Web app**, set **Execute as** to **Me** and **Who has access** to **Anyone**, then click **Deploy**.
5. Paste the web app URL (it ends in `/exec`) into the `data-endpoint` attribute of `<form id="contact-form">` in `index.html`.

To change the script later, paste the new version and save. Then open **Deploy → Manage deployments**, edit the deployment, pick **New version** and deploy. The URL stays the same.

## Weekly build

A scheduled Claude Code routine runs every Wednesday at 6 pm Pacific. It builds the next two unchecked items in `BACKLOG.md` on a `claude/portfolio-<date>` branch and opens a pull request. Review the pull request, then merge it to publish. Pause or edit the routine at https://claude.ai/code/routines.
