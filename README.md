# FFXIV Dialogue Maker · Community Edition v1.1

A free, offline GPose dialogue editor. Move your screenshot, add an FFXIV dialogue box, and export a finished PNG.

## Quick start

**The editor is now one self-contained HTML file.**

1. Extract this ZIP, or download the HTML file by itself.
2. Double-click **`FFXIV_Dialogue_Maker_v1.1.html`** to open it in a modern desktop browser.
3. Choose **Load GPose image** (PNG, JPG, WebP or AVIF).
4. In **① Edit screenshot**, drag or zoom the screenshot. The dialogue box stays in place.
5. In **② Edit dialogue box**, drag the box, select a style and enter the speaker name and text.
6. Choose **Original screenshot size** or **Fit within 1920 × 1080**, then select **Download PNG**.

No installation, Python, localhost, internet, separate assets folder, or other files are required to run the HTML. Screenshot and custom-frame processing stays on your device; the editor does not upload pictures or use tracking or analytics. Credit links only open if you click them.

## What's new in v1.1

In v1.0, PNG export could fail when dialogue graphics loaded from local `assets/*.png` files were drawn into the export canvas. **v1.1 embeds all 15 PNGs directly inside the HTML** so the editor no longer needs to fetch separate local artwork. CSS, JavaScript and licensing/credit notices are also embedded. The maintainer confirmed that dialogue-enabled PNG export works after opening the HTML directly in Chrome on Windows. See [CHANGELOG.md](CHANGELOG.md) and [QA_REPORT.md](QA_REPORT.md).

## Five styles

| Style | Appearance |
| --- | --- |
| **Talk** | Standard rounded dialogue box |
| **Shout** | Pointed, emphatic outline |
| **Dragon** | Frosty / weathered ornamental frame |
| **Deity** | Ornate dialogue frame |
| **Write** | Written-message / parchment-style panel |

Each has its own frame, continuation marker, and wide name shadow. Switching styles preserves your text, position, scale, width and fade settings.

## Editor controls

| Control | Behavior |
| --- | --- |
| **① / ②** | Switch between screenshot and dialogue layer; the other stays fixed |
| **Background zoom** | 40–350%, also by mouse wheel |
| **Arrow keys** | Nudge active layer when preview is focused (Shift = larger step) |
| **Frame scale** | 55–150%; box and text scale together |
| **Independent width** | Optional frame widening from 668 to 1400 baseline pixels |
| **Dialogue text size** | 18–45 baseline pixels |
| **Nameplate fade** | 0% retains the wide shadow; 100% hides it but leaves speaker text |
| **Center dialogue at bottom** | Restore initial lower-center position |
| **Show dialogue overlay** | Show/hide entire frame, name and dialogue |
| **Optional frame PNG** | Override the selected style with your own PNG/WebP frame |
| **Use selected style frame** | Return from a custom frame to the built-in style |

## Screenshot and export limits

- Supported files: PNG, JPG, WebP, AVIF (depending on browser support).
- Per-upload limit **60 MiB** and **65 megapixels**.
- Preview fits within **1920 × 1080** without cropping or upscaling small images.
- Original-size PNG export retains screenshot dimensions up to **4096 pixels per side** and **16 megapixels**.
- Full HD export fits within **1920 × 1080** without cropping, stretching or upscaling.
- Dialogue overflow disables export until the text fits. Only one PNG export runs at a time.

## Troubleshooting

**Export disabled:** Wait until screenshot decoding completes, and check for a dialogue-overflow warning. Very large source images may need Full HD mode.

**PNG export failed:** Try a different image or browser. For a useful bug report, open a [GitHub issue](https://github.com/Sp4reT1meG4mer/FFXIV-Dialogue-Maker/issues) with your browser/version, screenshot dimensions and the browser console error. You do not need to share your personal screenshot.

**Custom frame stretched:** User-uploaded PNG/WebP frames fit the selected dialogue rectangle; use a similar aspect ratio or select one of the built-in styles.

**Text looks different across computers:** Font rendering and wrapping are system- and browser-dependent.

**Large export uses too much memory:** Select Full HD export and close heavy browser tabs.

## Technical overview

`FFXIV_Dialogue_Maker_v1.1.html` contains all HTML, CSS, JavaScript, 15 embedded PSD-derived PNG assets and inline copyright/credit notices. It has no runtime dependencies, backend, or server requirement. Its code remains inspectable within the HTML file. Developer tests from v1.0 were not shipped in this standalone user release, because they target the previous multi-file development layout.

## License, rights, credits

**Source code: CC0 1.0 Universal**, to the extent contributors hold the relevant rights. See [LICENSE](LICENSE) and [LICENSE_SCOPE.md](LICENSE_SCOPE.md).

**Embedded FFXIV artwork is NOT CC0.** The 15 dialogue graphics embedded in the HTML remain subject to rights held by Square Enix and other applicable parties. The CC0 dedication for code grants no right to redistribute the embedded artwork, even though it shares a file with the code. An attribution notice alone does not establish rights clearance.

Original dialogue-maker inspiration: **Sebastian Scaini** and **F'ortuna Favore**. PSD template: **milksnout**, crediting sprite extraction by **Clawbriar** of The Spriters Resource. See [CREDITS_AND_RIGHTS.md](CREDITS_AND_RIGHTS.md) and [THIRD_PARTY_ASSETS.md](THIRD_PARTY_ASSETS.md).

Free, unofficial FFXIV fan tool; not affiliated with or endorsed by Square Enix. See the applicable [FFXIV Materials Usage Policy](https://support.eu.square-enix.com/rule.php?id=5383&la=2&tag=authc) before using or redistributing game artwork.

**© SQUARE ENIX**
