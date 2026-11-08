# Aldryl E-Portfolio — Independent Website Copy

This is a self-contained static website copy for Aldryl's Jose Rizal University e-portfolio. It uses plain HTML, CSS, and JavaScript, with no build step, package manager, git remote, or repository-specific deployment configuration.

## Contents

- `index.html` — site sections and written content
- `styles.css` and `portfolio-refresh.css` — styling and responsive design
- `site.js` — theme, mobile navigation, animated text, and content cards
- `assets/` — add the actual portrait and academic documents here
- `DEPLOY.md` — steps for publishing this independent copy

## Preview locally

From this folder, run:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000`. Opening `index.html` directly also works for most features, but a local server is recommended for PDF preview checks.

## Add original content

The supplied website uses placeholder academic work, project descriptions, reflections, and a profile illustration. Update these with approved information and files before submitting. Expected PDF paths are:

- `assets/docs/cp1-compiled-works.pdf`
- `assets/docs/project-documentation.pdf`

This package deliberately includes no preconfigured publishing workflow or link to the former repository. You can deploy it to a new hosting destination without changing the original site.
