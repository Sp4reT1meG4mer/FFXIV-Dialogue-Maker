# FFXIV-Dialogue-Maker
A modernized FFXIV Dialogue Maker based on the original project by Sebastian Scaini and F'ortuna Favore, featuring live previews, customizable dialogue boxes, and multiple in-game styles.


# FFXIV Dialogue Maker · Community Edition v1.0

A free, offline GPose dialogue editor: position your screenshot, pick an authentic dialogue style, add text and export a PNG.

## ⚖️ A Note on Licensing

**SOURCE CODE: CC0 1.0 UNIVERSAL.** The Community Edition's source code is dedicated to the public domain to the extent its contributors hold the applicable rights. You may use, edit, fork and redistribute that code, including commercially. See the full [LICENSE](LICENSE) and precise [LICENSE_SCOPE.md](LICENSE_SCOPE.md).

**IMPORTANT: FFXIV ARTWORK IS NOT COVERED BY CC0.** The dialogue-box PNGs, name shadows, and continuation markers in `assets/` are derived from *FINAL FANTASY XIV*-related graphics and **remain subject to the rights of Square Enix and other applicable rights holders**. We do not claim ownership of them, do not sublicense them, and do not grant anyone unrestricted permission to reuse or distribute them.

This free, non-commercial fan utility is intended to respect Square Enix's [official FFXIV Materials Usage Policy (Europe)](https://support.eu.square-enix.com/rule.php?id=5383&la=2&tag=authc). The policy's permissions are limited and revocable, vary by account region, and **do not clearly authorize redistribution of extracted UI PNGs inside a downloadable repository**. Everyone reusing or distributing those images must independently check the applicable terms and permissions. A disclaimer is **not** a substitute for rights clearance.

**© SQUARE ENIX** · Independent fan tool, not affiliated with or endorsed by Square Enix.

**Credits:** Original dialogue maker by **Sebastian Scaini** and **F'ortuna Favore**; PSD compilation by **milksnout**, crediting sprite extraction by **Clawbriar** of The Spriters Resource. See [CREDITS_AND_RIGHTS.md](CREDITS_AND_RIGHTS.md) and the complete [third-party artwork notice](THIRD_PARTY_ASSETS.md).

---

## Start in under a minute

**IMPORTANT: DOWNLOAD AND EXTRACT THE COMPLETE RELEASE ZIP.** This is a folder-based editor, not a standalone HTML file. Keep `Dialogue_Maker.html`, `editor.js`, `styles.css`, and the entire `assets/` folder together. **Do not open `Dialogue_Maker.html` inside the ZIP, or download only that file from GitHub.** Missing files will prevent the editor or styles from working.

1. **Extract the entire ZIP** to a folder. Do not run `Dialogue_Maker.html` from *inside* the ZIP.
2. Open **`Dialogue_Maker.html`** in a modern desktop browser. The app needs `editor.js`, `styles.css`, and the whole `assets/` folder beside it.
3. Select **Load GPose image** and choose a PNG, JPG, WebP, or AVIF screenshot. You can also drop a screenshot onto the upload area. **Other editing controls remain locked until the screenshot finishes loading**; the screenshot picker can replace a slow or unwanted pending file.
4. In **① Edit screenshot**, drag the background or use the mouse wheel / zoom control until the composition looks right. The dialogue box stays still.
5. Switch to **② Edit dialogue box**. Drag the box, choose a style, edit the name and dialogue, and optionally adjust scale, width, font size, or name-shadow fade.
6. Choose **Original screenshot size** or **Fit within 1920 × 1080** and click **Download PNG**.

All screenshot and frame file processing stays on your device. The application has no analytics, third-party scripts, remote fonts, or network calls. The footer contains source/credit links, which only open if you click them.

## Styles

The **Dialogue style** selector (above the speaker-name field) offers five art variants from the separate *Dialogue Template for Screenshots* PSD:

| Style | Appearance |
| --- | --- |
| **Talk** | Standard rounded dialogue box, default |
| **Shout** | More pointed, emphatic outline |
| **Dragon** | Frosty / weathered ornamental frame |
| **Deity** | Ornate framed dialogue |
| **Write** | Written-message / parchment-style panel |

Each has its own background art, continuation marker, and wide name shadow. **All 15 images preload before the style selector unlocks**, so switching is immediate and never displays a partially loaded skin. If any required asset fails to load, the selector remains locked and an on-screen status explains why. Switching styles keeps your entered name, dialogue, position, scale, width, and fade setting. If you loaded a *custom* frame, selecting a style replaces that custom image.

## Editor controls

| Control | Behavior |
| --- | --- |
| **① / ②** | Separately edit screenshot or dialogue box; the other layer is frozen |
| **Background zoom** | 40% to 350%; mouse wheel zooms toward pointer |
| **Drag preview** | Moves whichever layer is selected |
| **Arrow keys** | With preview focused, nudge selected layer by 1 preview pixel; Shift + arrow by 10 |
| **Whole-frame scale** | 55% to 150% of baseline; box and text scale together |
| **Unlock independent frame width** | Allows a frame width **from 668 to 1400 baseline pixels**, never less than 668 |
| **Dialogue text size** | 18–45 baseline pixels |
| **Nameplate fade** | 0% keeps the original wide shadow; 100% hides it, preserving the name text |
| **Center dialogue at bottom** | Restores centered positioning of the dialogue box |
| **Show dialogue overlay** | Shows or hides the entire overlay, including text |
| **Optional frame PNG** | Temporarily replaces the selected PSD bubble; supports PNG and WebP |
| **Use selected style frame** | Removes the custom-frame override |

The frame starts locked to its original width. On small images, its displayed pixel size scales with the screenshot; the width settings describe *baseline* dimensions, not a promise that every tiny screenshot will display a 668-pixel-wide dialogue box.

## Screenshot size and export

- Supported screenshot formats: **PNG, JPEG, WebP, AVIF** (browser support for AVIF varies).
- Individual uploaded image limit: **60 MiB** and **65 megapixels**. Files above these limits are rejected, but browsers must still decode some image data before dimensions can be checked.
- Preview is scaled to fit within **1920 × 1080**, preserving the screenshot's aspect ratio and never enlarging a small original.
- **Original size export:** same pixel dimensions as the screenshot, if at most **4096 px per side** and **16 megapixels**.
- **Fit within Full HD:** downscale if necessary to fit inside **1920 × 1080**, without cropping, stretching, or upscaling.
- If original-size export would exceed its safety limit, the editor selects the Full HD option automatically.
- When dialogue exceeds the available lines, the editor shows a warning and disables export until the text fits.
- **One export at a time:** when export begins, all editing controls and the screenshot picker are temporarily disabled. The app ignores repeated export requests until PNG encoding succeeds or fails and the job is released. It cannot observe when the browser finishes saving the file to disk; the lock ends once the browser receives the download action.

**Examples:** 640×640 exports as 640×640; 1280×720 stays 1280×720; 3840×2160 exports at 4K in original mode or 1920×1080 in Full HD mode; 2800×3200 keeps its portrait aspect ratio.

## Troubleshooting

**The preview is empty / frames are missing:** Extract the entire ZIP, preserving the `assets/` folder next to `Dialogue_Maker.html`. The app waits for complete style assets before allowing style changes, and PNG export stays disabled if the current style is incomplete. If assets fail to load, re-extract the complete folder and reopen `Dialogue_Maker.html`.

**Export button is disabled:** Load a screenshot and let it finish decoding, allow the current style images to load, and check for the dialogue-overflow warning. Export is also temporarily disabled while a PNG is being generated. If you're exporting a very large source, use **Fit within 1920 × 1080**.

**My custom frame looks stretched:** The custom PNG/WebP is fitted to the current dialogue rectangle. Use a transparent frame with a similar aspect ratio, or select one of the bundled styles.

**Text looks different across machines:** The editor uses browser/system fonts (system-ui and Georgia). Exact glyph appearance and line wrapping can differ slightly across operating systems and browsers.

**A 4K PNG causes heavy memory use:** Each full-size export requires an additional large canvas in memory. Close other memory-intensive tabs or switch to the Full HD export. File-size limits reduce but do not eliminate browser memory risks.

## Technical overview

- Plain `Dialogue_Maker.html`, `styles.css`, and `editor.js` with Canvas 2D; no frameworks, build pipeline, server, cookies, local storage, or external packages at runtime.
- Five dialogue skins composed from 15 transparent, PSD-derived PNG layers. Horizontal three-slice drawing preserves decorative edges when widening the box.
- A shared rendering pipeline draws both preview and exported PNG to keep compositions consistent.
- Async image-request counters reject stale uploads. Export lock prevents double encoding. Frame assets must all finish loading before enabling export.
- Development/testing requires optional **Node.js** and **Python** with Playwright, Pillow, and a Chromium executable. End users need none of these.

### Developer test commands

Run inside the extracted project folder:

```bash
node --check editor.js
node --test tests/qa.test.js
python tests/browser_qa.py
python tests/browser_nameplate_qa.py
python tests/browser_styles_qa.py
python tests/browser_release_qa.py
```

See [QA_REPORT.md](QA_REPORT.md) for the tested environments, checks and caveats, and [CHANGELOG.md](CHANGELOG.md) for v1.0 changes.

## Credits, rights, and publication

Source code: **CC0 1.0 Universal** ([LICENSE](LICENSE), [scope](LICENSE_SCOPE.md)). This does not license third-party graphics. See [credits](CREDITS_AND_RIGHTS.md) and [asset restrictions](THIRD_PARTY_ASSETS.md).

**Public-release caution:** Source code is ready for sharing under CC0, but permission to redistribute the bundled, PSD-derived artwork as part of a public GitHub release has **not** been verified. This ZIP is a **review-ready full build**, not a legal assurance of redistribution clearance. If necessary, publish a rights-cleared source-only version after adapting the program to support user-supplied frame assets.
