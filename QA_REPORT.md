# Final QA report · FFXIV Dialogue Maker Community Edition v1.0

**Date:** 2026-11-07  
**Source audited:** local v0.5.6 code and PSD-derived assets, then v1.0 changes  
**Target:** offline browser application using Canvas 2D

## Review scope

Static source audit, JavaScript syntax, DOM event binding and state transitions, file input validation, async request races, memory safeguards, screenshot composition, five style layers, transparency, text overflow, resizing, PNG encode/download logic, test quality, documentation, and credit provenance.

## Findings addressed in v1.0

| Severity | Finding | Resolution |
| --- | --- | --- |
| Medium | Rapid export clicks could start concurrent encodes | Export mutex, all editor controls locked during PNG encoding, progress label |
| Medium | A selected style could be exported with only its box loaded | Require box, continuation marker and name shadow; never draw an incomplete skin |
| Medium | Style changes before image completion could show a half-loaded skin | Preload all 15 style assets; lock selector until all five styles are fully ready |
| Medium | Editing while a screenshot is still decoding could conflict with new composition dimensions | Freeze controls during initial and replacement screenshot decoding; restore safely on success/failure |
| Medium | Pending custom-frame image could override a subsequently selected style | Invalidate pending frame request on style change |
| Low | Scaling a default centered box could lower its bottom edge past canvas | Re-anchor unmodified box at the intended bottom margin; preserve manually moved positions |
| Low | JS relied on range slider to cap width above the baseline | Explicit clamp from 668 to 1400 baseline pixels |
| Documentation | Third-party PSD artwork was only credited as a supplied file | Identified template page/creator and upstream sprite credit; separated rights statements |
| UX copy | Show/hide label implied frame-only visibility, but hides all text | Label now specifies the entire dialogue overlay |

## Automated verification

**Syntax:** `node --check editor.js` passed.

**Node simulation tests:** **29 / 29 passed**. Covers DOM references, default states, scale/width bounds, modes, overlong text rejection, unsupported files, upload ordering, large resolution handling, custom overrides, local-only code surface, style distinctness, shadow fade, export mutex, required assets, pending frame race, and scale anchoring.

**Chromium (system binary) regression scripts:**

- `tests/browser_qa.py`: resolution detection and PNG export for **320×180**, **640×640**, **1280×720**, **3840×2160**, **2800×3200**, plus **4500×1000** export fallback.
- `tests/browser_nameplate_qa.py`: name-shadow transparency at **0%, 50%, 100%**; preview/export pixel fidelity, custom-frame state and editing modes.
- `tests/browser_styles_qa.py`: all five PSD styles visibly distinct, width/scale changes, 1920×1080 and square exports, style/custom-frame switching.
- `tests/browser_release_qa.py`: **pixel-for-pixel PNG equivalence for every one of the five styles** at native preview resolution; initial UI freeze; complete-style readiness; export double-click and editor-lock guards; tiny/square/portrait dimensions; overflow lockout; unsupported SVG rejection; no uncaught JS errors.

**Result:** all four browser scripts passed in Chromium with no uncaught page errors.

## Limitations and residual risks

- **No guarantee of flawless rendering in every browser:** Chromium was tested. Firefox, Safari and Edge were not independently verified. The original author's project historically noted Firefox issues, but this is a different implementation.
- The test environment blocks direct `file://` navigation. Browser tests inline the exact application code/assets in an isolated test page as a workaround; this is not identical to opening the ZIP on a user's desktop. The runtime code itself uses ordinary local relative paths.
- The browser may have to decode an image *before* learning its megapixel count. A malicious, corrupt or extremely large compressed file can still exhaust device resources despite upload limits.
- 4K PNG encoding and source decoding have memory costs; a browser or device can run out of memory even under the current safety caps.
- Display fonts are system-dependent. Text wrapping can differ across browsers and computers; users should inspect final exports, especially for long text and unusual characters.
- Moving or scaling the frame off-canvas is intentionally possible after manual dragging. The default centered position is kept on-canvas during proportional scaling.
- Custom PNG/WebP frame images are stretched to the dialogue rectangle and may distort if they have very different proportions.
- The export mutex releases after encoding and handing the download to the browser. Browser JavaScript cannot verify that the file has finished writing to disk.
- If a required style asset is missing or fails to decode, the style selector stays disabled rather than offering a partial skin.
- The editor handles a single panel at a time and does not save project state. No undo/history is provided.
- **Asset redistribution permission remains unverified.** The PSD template and upstream sprite files are distinct from the original dialogue maker's CC0 listing.
- The Community Edition source-code dedication has now been selected as CC0 1.0 Universal, with an explicit exclusion for bundled game artwork. These documentation changes do not establish third-party asset redistribution rights.

## Release decision

**PASS: complete local v1.0 build** for hands-on use/testing.  
**HOLD: public asset redistribution** until the separate PSD/sprite rights and new-code license are resolved.

## Final documentation-only packaging pass

Added the standard CC0 1.0 `LICENSE`, code scope, Square Enix / PSD-derived artwork notice, and prominent README disclaimer. The browser application logic and PNG assets are unchanged from the previously QA-tested v1.0 build.
