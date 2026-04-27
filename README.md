# Kevin Dental Project — Farley Family Dental

A fresh, modern website for Farley Family Dental in Payson, Utah — a redesign of [farleyfamilydental.com](https://farleyfamilydental.com/) focused on clarity, speed, and a clean, professional feel.

## What's inside

| File         | Purpose                                                |
| ------------ | ------------------------------------------------------ |
| `index.html` | Single-page site with all sections (about, services, reviews, contact) |
| `styles.css` | All styles. No frameworks, no build step, fully editable |
| `script.js`  | Mobile nav toggle, footer year, scroll-spy nav highlight |

## Tech stack

Plain HTML, CSS, and JavaScript. No build tools, no npm install, no framework. Open `index.html` in any browser and it just works.

**Why this stack?** A dental practice site doesn't need a framework — and skipping one means:
- Loads instantly (no JS bundle to ship)
- Free hosting on GitHub Pages or Netlify
- Anyone can edit a section by opening the file
- Will still work in 10 years

## Run it locally

Just open `index.html` in your browser, or serve it for live-reload:

```bash
# Option 1 — Python (built into macOS/Linux/most systems)
python3 -m http.server 8000

# Option 2 — Node
npx serve .
```

Then visit `http://localhost:8000`.

## Editing content

All copy lives in `index.html`. Find the section you want, edit the text. Common edits:

- **Phone number** — search for `(801) 465-3256` and `+18014653256`
- **Address** — search for `Payson, UT 84651`
- **Hours** — search for `<ul class="hours-list">`
- **Services** — search for `<!-- ============ SERVICES ============ -->`
- **Booking link** — search for `elevatepractices.typeform.com`

Brand colors live as CSS variables at the top of `styles.css` — change `--color-primary` and the whole site re-themes.

## Deploying

The simplest free option is **GitHub Pages**:

1. Push this project to GitHub (see `SETUP-GITHUB.md`)
2. Repo → Settings → Pages → Source: `main` / root → Save
3. Your site goes live at `https://<your-username>.github.io/kevin-dental-project/`

For a custom domain (`farleyfamilydental.com`), point the domain's DNS at GitHub Pages and add the domain in the Pages settings.

## Roadmap ideas

- Replace placeholder dentist initials with real photos
- Add a real Google Maps embed in the contact section
- Pull in real Google reviews via the Places API
- Add a `/services/<service-name>` page for SEO depth
- Add a simple blog (could use Astro or 11ty if expanding)
