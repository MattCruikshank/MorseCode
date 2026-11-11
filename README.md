# Morse Code Trainer

A web page for learning Morse code, modeled on a pocket "Morse tree" card. Hold **Space**, or press the card or the **KEY** button. A short press is a dot and a long press is a dash. The path from the antenna lights up as you key: green for dots, red for dashes.

## Features

- **Free keying.** Letters decode onto a paper-tape strip after you pause.
- **Text to key.** Pick a passage (practice drills, Bible verses in the KJV, famous American statesmen) or type your own. The goal text sits on the paper tape and moves along as you key each symbol correctly.
- **Settings** are saved in your browser:
  - Light, dark or system theme
  - Turn letters, numbers and punctuation on or off. The tree re-lays itself out to match.
  - Show or hide the paper tape, the letters on the card, and hints
  - Speed in WPM, with optional Farnsworth spacing and a table of exact millisecond timings
  - Sidetone on/off, pitch and volume

## Run it locally

There's no build step and nothing to install.

- **Easiest:** double-click `index.html`. It works straight from `file://`.
- **Or serve it**, which is closer to how GitHub Pages behaves:
  ```sh
  python -m http.server 8000
  # then open http://localhost:8000
  ```

The only online dependency is Google Fonts. Offline, the page falls back to system fonts.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, go to **Settings → Pages → Build and deployment**. Pick **Deploy from a branch**, then branch `main` and folder `/ (root)`.
3. The site appears at `https://<user>.github.io/<repo>/`.

`.nojekyll` is included so GitHub serves the files as-is.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and the settings drawer |
| `style.css` | Theme tokens (light/dark), card, LEDs, tape |
| `js/morse.js` | Morse tables: letters, numbers, punctuation |
| `js/passages.js` | Passages for the "Text to key" picker |
| `js/tree.js` | Builds the Morse tree and lays it out card-style on a grid |
| `js/app.js` | Rendering, keyer, timing, audio, tape, settings |

### Timing

Timing follows the standard "PARIS" convention. One dot (unit) = 1200 ÷ WPM ms.

- A press of 2 units or longer counts as a dash.
- A silence of 3 gap-units ends a letter. A silence of 7 adds a word space.
- With Farnsworth spacing on, the gap-unit is stretched (ARRL formula) so the overall speed matches the "Overall speed" setting while the characters themselves stay at full speed.

See [ROADMAP.md](ROADMAP.md) for planned modes.
