# Support magnétique — tunnel de vente

One-product COD sales funnel (French, Algerian market) for the foldable magnetic multi-device stand, 2000 DA.

Static site, no build step: `index.html`, `styles.css`, `main.js`, `assets/`. Host it anywhere (GitHub Pages, Netlify, any web server) or open `index.html` locally.

## Configuration (`main.js`)

- `WILAYAS` — Stop Desk price per wilaya. Home delivery = Stop Desk + `HOME_EXTRA` (350 DA). Total = `PRICE` (2000 DA) + delivery.
- `ENDPOINT` — FormSubmit AJAX endpoint. The first submission triggers an activation email; orders arrive only after it is confirmed.
- `WHATSAPP` — number used for "Commander via WhatsApp".
- `CONFIG.stickyCta` / `CONFIG.showWhatsApp` — toggle the mobile sticky order bar and the WhatsApp button.

Note: Aïn Témouchent (46) is not listed because no delivery price was provided — add it to `WILAYAS` once known.
