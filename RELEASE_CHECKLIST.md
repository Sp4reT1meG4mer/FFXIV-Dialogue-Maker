# v1.0 Publication checklist

## Code and product readiness

- [x] Five PSD styles and their three required layers render
- [x] Drag, zoom, fixed width baseline, text edit, fade and export behavior tested in Chromium
- [x] Tiny, portrait, square, widescreen and 4K image export paths checked
- [x] Image-size and dialogue-overflow guards present
- [x] Export-concurrency and asynchronous style/custom-image race conditions addressed
- [x] Editor frozen until screenshot decoded; selector unlocks only after all 15 skin assets load; editing frozen during PNG export
- [x] 29 Node regression tests and four Chromium regression scripts pass
- [x] Offline runnable app, with no runtime dependencies or external connections
- [x] User and technical documentation, changelog, credits, QA notes included

## Pending before *public redistribution*

- [ ] **Asset rights:** verify permission/license for sprite graphics and for redistributing PNGs derived from `speech 1.psd`, or replace artwork
- [x] **New-code license:** CC0 1.0 Universal selected and applied to original source code, with the separate scope notice
- [ ] **Final cross-browser smoke test:** Firefox and Edge not independently verified by the QA environment
- [ ] **Final local-file test:** test the extracted final ZIP on the intended user's machine, especially `file://` loading of `assets/*.png`
- [ ] **Public attribution review:** ensure the credits match any permission/grant documentation received

**Decision:** v1.0 is functionally tested and packaged for local use. Do not label it a publicly rights-cleared release until the pending items are resolved.

**Code and third-party assets must remain separately licensed.** See `LICENSE_SCOPE.md` and `THIRD_PARTY_ASSETS.md`.
