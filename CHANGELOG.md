# Changelog

## v1.0 · 2026-11-07

**First feature-complete Community Edition build** based on the tested v0.5.6 prototype.

### Included editor features

- Five selectable modern dialogue styles from PSD-derived artwork: Talk, Shout, Dragon, Deity, Write.
- Two-stage screenshot/dialogue editing with drag, keyboard nudge, and screenshot zoom.
- Speaker and dialogue entry, customizable font size, original wide name shadow with fade control.
- Original minimum frame width (668 baseline px), optional independent widening up to 1400, whole-frame scale 55–150%.
- PNG export at screenshot resolution (under safety caps) or scaled to fit Full HD.
- Local processing, no runtime dependencies, overflow warnings, file-size safety checks.

### Release hardening since v0.5.6

- Prevent simultaneous export jobs from repeated clicks; lock editing controls during the job and show an in-progress state.
- Freeze editing until a screenshot is successfully decoded (also during replacement uploads); restore access after success or failure.
- Preload all 15 PSD-style layers and unlock style selection only once all five skins are fully ready. Prevent partial rendering and reject premature selections.
- Wait for **all three** required assets (box, marker and name shadow) of the chosen style before enabling export.
- Prevent a still-loading custom frame from overriding an explicitly selected PSD style.
- Keep an untouched dialogue box anchored to its bottom margin while the user changes scale; preserve custom positioning after manual movement.
- Enforce both minimum and maximum independent widths in JavaScript, not just the slider.
- Clarify the show/hide overlay label, refresh in-app attribution, and add release documentation and license/rights caveats.
- Extend automated coverage from 20 to 29 Node tests; add a browser-level release regression suite with lock-state assertions.

### Scope note

Version 1.0 describes **feature completeness and local QA**, not authorization to redistribute separate third-party game assets. See `CREDITS_AND_RIGHTS.md`.

### GitHub release packaging update (documentation only)

- Added full CC0 1.0 legal text for Community Edition code and explicit scope exclusions.
- Added prominent README licensing notice, separate third-party asset rights explanation and a clear `© SQUARE ENIX` attribution.
- Marked the remaining artwork redistribution uncertainty as a publishing blocker.
- No program code or game-derived artwork changed in this packaging pass.
