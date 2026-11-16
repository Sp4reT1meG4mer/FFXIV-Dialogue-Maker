# QA report · FFXIV Dialogue Maker Community Edition v1.1

**Date:** 2026-11-16  
**Build:** standalone HTML derived from v1.0, replacing external local artwork paths with 15 embedded data URLs and embedding CSS/JavaScript.

## v1.0 reference

The original v1.0 build passed 29/29 Node regression tests and four Chromium browser test scripts for dialogue editing, five frame styles, preview/export consistency, size limits, overflow and concurrency. Those tests target the previous multi-file development layout and are not included in the standalone end-user ZIP.

## v1.1 verification

- All 15 embedded PNG assets loaded; all five styles initialized.
- Actual user's **2048 × 1152** GPose screenshot exported with dialogue enabled for Talk, Shout, Dragon, Deity and Write.
- Full HD PNG export created a **1920 × 1080** output.
- Image comparison confirmed the dialogue overlay appears in output; without overlay the pixels differ.
- With a resized **1280 × 720** source, preview and exported image matched pixel-for-pixel across all five styles in a Chromium test.
- Text overflow disabled PNG export and clearing it restored export.
- No script/page errors and no external resource requests in the Chromium tests.
- Maintainer confirmed the v1.1 HTML works after direct local opening in **Chrome on Windows**, including dialogue-enabled PNG export.

## Limitations

Automated tests loaded the HTML into the Chromium page because the test environment restricts `file://` navigation; the user's real Windows/Chrome test covers direct local opening. Firefox, Safari, and Edge are not separately verified. Large PNGs may be memory-intensive; fonts vary across systems. Art redistribution permissions are independent of functional QA.

**Result:** Functional export fix confirmed in Chromium and by maintainer on Windows Chrome.
