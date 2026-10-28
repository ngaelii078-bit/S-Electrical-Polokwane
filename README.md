# S-Electrical-Polokwane

A responsive HTML website demo for S² Electrical in Polokwane.

## Preview

Open `dist/index.html` in a browser, or serve the `dist` directory with a local web server.

## Features

- Responsive layouts and an animated hero entrance
- Scroll-controlled word-by-word heading reveals
- Reduced-motion support
- Floating WhatsApp button and WhatsApp enquiry form
- Scripted demo assistant (no live AI or API key required)

## Vercel deployment

Import this repository with the Root Directory set to the repository root (leave it blank in Vercel). The root `vercel.json` selects the static-site preset, skips installation and building, and publishes `dist`, which contains `index.html` and the website assets.

If an older deployment shows a 404, deploy the latest `main` commit. The existing deployment is not changed retroactively.

## Validation

Run `node check.cjs`, `node --check dist/script.js`, and `node --check dist/motion.js`.

`check-browser.cjs` runs additional browser checks and requires a local Windows Chrome installation.

Business details and project names are based on the S² Electrical website. Photography is illustrative and loads from Unsplash; fonts load from Google Fonts.
