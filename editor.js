/*
 * FFXIV Dialogue Maker — Community Edition v1.0
 *
 * Local-only GPose compositing. No external requests, frameworks or build step.
 * Inspired by the CC0-listed dialogue tool by Sebastian Scaini and F'ortuna Favore.
 * The PSD-derived art comes from milksnout's Dialogue Template for Screenshots,
 * which credits Clawbriar's original sprite extraction. Separate rights apply.
 * See CREDITS_AND_RIGHTS.md before redistributing this archive.
 */
(() => {
  'use strict';

  // Preview is no larger than 1920×1080 and never upscales a small original.
  // Export renders separately at the selected resolution, keeping this UI responsive.
  const CANVAS = { width: 1920, height: 1080 };
  const PREVIEW_CAP = Object.freeze({ width: 1920, height: 1080 });
  const FIT_EXPORT = Object.freeze({ width: 1920, height: 1080 });
  const ORIGINAL_EXPORT_LIMIT = Object.freeze({ maxSide: 4096, maxPixels: 16_000_000 });
  const FRAME = Object.freeze({ width: 668, maxWidth: 1400, height: 187, bottomMargin: 46 });
  const PSD_FRAME = Object.freeze({ width: 816, height: 216 });
  const IMAGE_LIMITS = Object.freeze({ maxBytes: 60 * 1024 * 1024, maxPixels: 65_000_000 });
  const MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/avif']);

  const $ = (id) => document.getElementById(id);
  const canvas = $('stage');
  const previewCtx = canvas.getContext('2d');
  let ctx = previewCtx;
  const state = {
    photo: null,
    exportMode: 'original',
    customFrame: null,
    dialogueStyle: $('dialogueStyle').value,
    photoZoom: 1,
    photoX: 0,
    photoY: 0,
    speaker: $('speakerName').value,
    dialogue: $('dialogueText').value,
    fontSize: 27,
    nameplateFade: 0,
    frameScale: 1,
    frameWidth: FRAME.width,
    independentWidth: false,
    frameX: CANVAS.width / 2,
    frameY: CANVAS.height - FRAME.bottomMargin - FRAME.height / 2,
    frameMoved: false,
    showFrame: true,
    mode: 'photo'
  };

  // Five actual styles from the source PSD, exported to transparent PNGs.
  // Coordinates refer to the common 816 × 216 PSD document, NOT to cropped files.
  // Style-specific side caps preserve the irregular edges when frames grow wider.
  const DIALOGUE_STYLES = Object.freeze({
    talk:   { label: 'Talk',   cap: 130, pin: [735, 123, 18, 30], textY: 80 },
    shout:  { label: 'Shout',  cap: 125, pin: [733, 126, 14, 24], textY: 83 },
    dragon: { label: 'Dragon', cap: 125, pin: [736, 128, 12, 22], textY: 83 },
    deity:  { label: 'Deity',  cap: 125, pin: [757, 132, 14, 24], textY: 83 },
    write:  { label: 'Write',  cap: 110, pin: [789, 140, 14, 24], textY: 85 }
  });
  const styleArtwork = Object.fromEntries(Object.keys(DIALOGUE_STYLES).map((style) => [style, {
    box: null, pin: null, nameShadow: null
  }]));
  function currentStyle() {
    return DIALOGUE_STYLES[state.dialogueStyle];
  }
  function currentArtwork() {
    return styleArtwork[state.dialogueStyle];
  }
  // Preload every style before exposing the selector. Each subsequent switch is
  // synchronous and atomic: the editor never displays a half-loaded new skin.
  const failedArtwork = new Set();
  function allStylesReady() {
    return Object.values(styleArtwork).every((art) => art.box && art.pin && art.nameShadow);
  }
  function updateStyleStatus() {
    const ready = Object.values(styleArtwork).reduce((total, art) =>
      total + Number(Boolean(art.box)) + Number(Boolean(art.pin)) + Number(Boolean(art.nameShadow)), 0);
    $('styleStatus').textContent = failedArtwork.size
      ? 'Some dialogue artwork could not load. Keep the complete assets folder beside Dialogue_Maker.html.'
      : ready === 15 ? 'All five dialogue styles ready.' : `Loading dialogue styles… ${ready}/15 assets`;
  }
  function loadPSDArtwork() {
    for (const style of Object.keys(DIALOGUE_STYLES)) {
      for (const [key, filePart] of [['box', 'box'], ['pin', 'pin'], ['nameShadow', 'name-shadow']]) {
        const src = `assets/modern-${style}-${filePart}.png`;
        const image = new Image();
        image.onload = () => {
          styleArtwork[style][key] = image;
          updateStyleStatus();
          refreshDisplay();
        };
        image.onerror = () => {
          failedArtwork.add(src);
          console.error(`Could not load dialogue style asset: ${src}`);
          updateStyleStatus();
          refreshDisplay();
          if (style === state.dialogueStyle) notify(`Could not load ${currentStyle().label} artwork. Keep the assets folder with Dialogue_Maker.html.`);
        };
        image.src = src;
      }
    }
  }

  let drag = null;
  let renderPending = false;
  let toastTimer = null;
  let exporting = false;
  let photoLoading = false;
  const canEdit = () => Boolean(state.photo) && !photoLoading && !exporting;
  // Prevent a slow earlier upload from replacing a more recently chosen file.
  const imageRequests = { photo: 0, frame: 0 };
  const graphemeSegmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

  function notify(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function paintPlaceholder() {
    const { width: w, height: h } = CANVAS;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#102a47');
    sky.addColorStop(0.48, '#25455b');
    sky.addColorStop(1, '#111922');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#192d42';
    ctx.beginPath();
    ctx.moveTo(0, 675);
    for (const point of [[210, 490], [490, 668], [750, 430], [1020, 718], [1310, 505], [1610, 703], [1920, 440], [w, h], [0, h]]) {
      ctx.lineTo(...point);
    }
    ctx.fill();

    const shade = ctx.createLinearGradient(0, h * 0.7, 0, h);
    shade.addColorStop(0, '#02071200');
    shade.addColorStop(1, '#020712b5');
    ctx.fillStyle = shade;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f3ebd9';
    ctx.font = '600 43px system-ui, sans-serif';
    ctx.fillText('Your GPose screenshot goes here', w / 2, h * 0.37);
    ctx.fillStyle = '#d0dae7';
    ctx.font = '26px system-ui, sans-serif';
    ctx.fillText('Load an image, then drag it to compose your scene', w / 2, h * 0.42);
    ctx.textAlign = 'left';
  }

  function paintPhoto() {
    const { width: w, height: h } = CANVAS;
    if (!state.photo) {
      paintPlaceholder();
      return;
    }

    const image = state.photo;
    const baseScale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
    const scale = baseScale * state.photoZoom;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;

    ctx.fillStyle = '#090d15';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, (w - drawWidth) / 2 + state.photoX,
      (h - drawHeight) / 2 + state.photoY, drawWidth, drawHeight);
  }

  // Scale a baseline 1920×1080 frame with the preview resolution, while
  // respecting portrait and square screenshots. Users can further resize it.
  function frameUnit() {
    return Math.min(CANVAS.width / 1920, CANVAS.height / 1080);
  }

  function measureFrame() {
    const scale = frameUnit() * state.frameScale;
    const width = state.frameWidth * scale;
    const height = FRAME.height * scale;
    return {
      x: state.frameX - width / 2,
      y: state.frameY - height / 2,
      width,
      height
    };
  }

  function splitGraphemes(word) {
    return graphemeSegmenter
      ? Array.from(graphemeSegmenter.segment(word), (part) => part.segment)
      : Array.from(word);
  }

  // Works at the unscaled frame size; paintFrame scales the whole group uniformly.
  // This makes text layout consistent at every preview size and on PNG export.
  function wrapText(text, availableWidth) {
    const lines = [];
    for (const paragraph of String(text).replace(/\r/g, '').split('\n')) {
      if (!paragraph.trim()) {
        lines.push('');
        continue;
      }

      let line = '';
      for (const word of paragraph.trim().split(/\s+/u)) {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width <= availableWidth) {
          line = candidate;
          continue;
        }
        if (line) lines.push(line);
        line = '';

        if (ctx.measureText(word).width <= availableWidth) {
          line = word;
          continue;
        }
        let fragment = '';
        for (const character of splitGraphemes(word)) {
          if (fragment && ctx.measureText(fragment + character).width > availableWidth) {
            lines.push(fragment);
            fragment = '';
          }
          fragment += character;
        }
        line = fragment;
      }
      lines.push(line);
    }
    return lines;
  }

  function dialogueLayout() {
    const usingPSD = !state.customFrame && styleAssetsReady();
    const textY = usingPSD ? currentStyle().textY : 99;
    const textX = usingPSD ? 63 : 36;
    const usableWidth = state.frameWidth - textX - (usingPSD ? 36 : 34);
    const lineHeight = state.fontSize * 1.17;
    const bottomPadding = usingPSD ? 25 : 22;
    const maxLines = Math.max(1, Math.floor((FRAME.height - bottomPadding - textY) / lineHeight) + 1);
    ctx.save();
    ctx.font = `${state.fontSize}px Georgia, 'Times New Roman', serif`;
    const lines = wrapText(state.dialogue, usableWidth);
    ctx.restore();
    return { lines, lineHeight, maxLines, overflow: lines.length > maxLines, textX, textY };
  }

  function paintBuiltInFrame(width) {
    const height = FRAME.height;
    ctx.save();
    ctx.shadowColor = '#000b';
    ctx.shadowBlur = 23;
    ctx.shadowOffsetY = 7;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#f6efe0');
    gradient.addColorStop(0.25, '#e9e0ce');
    gradient.addColorStop(0.8, '#d8cfbd');
    gradient.addColorStop(1, '#c7b6a0');
    ctx.fillStyle = gradient;
    roundRect(8, 17, width - 16, height - 20, 44);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ac9e88';
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fbf6ea';
    roundRect(14, 23, width - 28, height - 32, 40);
    ctx.stroke();

    ctx.restore();
  }

  function paintCompactNameplate(width, textX) {
    ctx.save();
    ctx.font = '600 27px system-ui, sans-serif';
    const textWidth = ctx.measureText(state.speaker).width;
    const inset = Math.max(15, textX - 12);
    const plaqueWidth = Math.max(58, Math.min(width - inset - 16, textWidth + 34));
    const opacity = 1 - state.nameplateFade / 100;
    if (opacity > 0) {
      ctx.globalAlpha *= opacity;
      ctx.fillStyle = '#101116';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
      ctx.shadowBlur = 9;
      roundRect(inset, -6, plaqueWidth, 52, 19);
      ctx.fill();
    }
    ctx.restore();
  }

  // Preserve the original 429px-wide PSD shadow instead of creating a new tab.
  // It stays the same size when the dialogue panel becomes wider.
  function paintPSDNameShadow() {
    const shadow = currentArtwork().nameShadow;
    if (!shadow) return;
    const opacity = 1 - state.nameplateFade / 100;
    if (opacity <= 0) return;
    const unit = FRAME.height / PSD_FRAME.height;
    ctx.save();
    ctx.globalAlpha *= opacity;
    ctx.drawImage(shadow, 0, 0, 456, 52, 0, 0, 456 * unit, 52 * unit);
    ctx.restore();
  }

  // Horizontal 3-slice: protects the left/right frame edges, stretches only
  // the central section. All source PNGs retain the PSD's 816 × 216 canvas.
  function paintPSDFrame(width) {
    const image = currentArtwork().box;
    const sourceCap = currentStyle().cap;
    const unit = FRAME.height / PSD_FRAME.height;
    const destCap = sourceCap * unit;
    const centerWidth = Math.max(0, width - 2 * destCap);
    const sourceCenter = PSD_FRAME.width - 2 * sourceCap;
    ctx.drawImage(image, 0, 0, sourceCap, PSD_FRAME.height,
      0, 0, destCap, FRAME.height);
    ctx.drawImage(image, sourceCap, 0, sourceCenter, PSD_FRAME.height,
      destCap, 0, centerWidth, FRAME.height);
    ctx.drawImage(image, PSD_FRAME.width - sourceCap, 0, sourceCap, PSD_FRAME.height,
      width - destCap, 0, destCap, FRAME.height);
  }

  function paintPSDPin(width) {
    const pin = currentArtwork().pin;
    if (!pin) return;
    const [sourceX, sourceY, sourceWidth, sourceHeight] = currentStyle().pin;
    const unit = FRAME.height / PSD_FRAME.height;
    ctx.drawImage(pin, sourceX, sourceY, sourceWidth, sourceHeight,
      width - (PSD_FRAME.width - sourceX) * unit, sourceY * unit,
      sourceWidth * unit, sourceHeight * unit);
  }

  function paintBottomOrnament(width) {
    ctx.save();
    ctx.translate(width - 35, FRAME.height - 45);
    ctx.fillStyle = '#c6a05b';
    ctx.strokeStyle = '#6c562f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, 9);
    ctx.lineTo(0, 20);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function paintFrame() {
    // An incomplete asset set must never produce a partially drawn dialogue box.
    if (!state.showFrame || (!state.customFrame && !styleAssetsReady())) return;

    const { x, y } = measureFrame();
    const width = state.frameWidth;
    const layout = dialogueLayout();
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(state.frameScale * frameUnit(), state.frameScale * frameUnit());

    const usingPSD = !state.customFrame && styleAssetsReady();
    const textX = usingPSD ? 63 : 39;
    const textY = layout.textY;
    const insetX = layout.textX;
    if (state.customFrame) {
      ctx.shadowColor = '#0006';
      ctx.shadowBlur = 12;
      ctx.drawImage(state.customFrame, 0, 0, width, FRAME.height);
      ctx.shadowColor = 'transparent';
    } else if (usingPSD) {
      paintPSDFrame(width);
      paintPSDNameShadow();
    } else {
      paintBuiltInFrame(width);
      paintCompactNameplate(width, textX);
    }

    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.font = '600 27px system-ui, sans-serif';
    ctx.fillStyle = '#fff9e9';
    ctx.shadowColor = '#07090a';
    ctx.shadowBlur = 3;
    ctx.fillText(state.speaker, textX, 34, width - textX - 24);
    ctx.shadowBlur = 0;
    ctx.font = `${state.fontSize}px Georgia, 'Times New Roman', serif`;
    ctx.fillStyle = '#282a27';

    // Never silently clip text. An overflow warning disables PNG export.
    layout.lines.slice(0, layout.maxLines).forEach((line, index) => {
      ctx.fillText(line, insetX, textY + index * layout.lineHeight, width - insetX - 36);
    });
    if (layout.overflow) {
      ctx.fillStyle = '#985b4f';
      ctx.font = '19px system-ui, sans-serif';
      ctx.fillText('…', width - 45, FRAME.height - 22);
    }
    if (usingPSD) paintPSDPin(width);
    else if (!state.customFrame) paintBottomOrnament(width);
    ctx.restore();
  }

  // Identical draw pipeline for the small preview and high-resolution export.
  function renderTo(targetContext, width, height) {
    const previousContext = ctx;
    ctx = targetContext;
    ctx.save();
    try {
      ctx.setTransform(width / CANVAS.width, 0, 0, height / CANVAS.height, 0, 0);
      ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
      paintPhoto();
      paintFrame();
    } finally {
      ctx.restore();
      ctx = previousContext;
    }
  }

  function renderNow() {
    renderPending = false;
    renderTo(previewCtx, canvas.width, canvas.height);
  }

  function dimensionsForOutput() {
    if (!state.photo) return { width: CANVAS.width, height: CANVAS.height };
    const width = state.photo.naturalWidth;
    const height = state.photo.naturalHeight;
    const factor = state.exportMode === 'original' ? 1
      : Math.min(1, FIT_EXPORT.width / width, FIT_EXPORT.height / height);
    return { width: Math.max(1, Math.round(width * factor)),
      height: Math.max(1, Math.round(height * factor)) };
  }

  function originalExportAllowed(image) {
    return image.naturalWidth <= ORIGINAL_EXPORT_LIMIT.maxSide &&
      image.naturalHeight <= ORIGINAL_EXPORT_LIMIT.maxSide &&
      image.naturalWidth * image.naturalHeight <= ORIGINAL_EXPORT_LIMIT.maxPixels;
  }

  function updateResolutionUI() {
    if (!state.photo) {
      $('sourceResolution').textContent = 'No screenshot loaded';
      $('previewResolution').textContent = `${CANVAS.width} × ${CANVAS.height}`;
      $('outputResolution').textContent = 'Choose a screenshot';
      $('exportPill').textContent = 'Auto resolution';
      return;
    }
    const w = state.photo.naturalWidth, h = state.photo.naturalHeight;
    $('sourceResolution').textContent = `${w} × ${h} pixels`;
    $('previewResolution').textContent = `${CANVAS.width} × ${CANVAS.height} pixels`;
    const available = originalExportAllowed(state.photo);
    $('exportOriginal').disabled = !available || !canEdit();
    if (!available && state.exportMode === 'original') state.exportMode = 'fit';
    $('exportOriginal').checked = state.exportMode === 'original';
    $('exportFit').checked = state.exportMode === 'fit';
    $('exportFit').disabled = !canEdit();
    const dims = dimensionsForOutput();
    $('outputResolution').textContent = `${dims.width} × ${dims.height} PNG`;
    $('exportPill').textContent = `${dims.width} × ${dims.height} PNG`;
    $('exportNotice').textContent = available
      ? 'Original keeps every source pixel. Full HD fits within 1920 × 1080 without cropping, stretching, or upscaling.'
      : 'Original-size export disabled for safety above 4096 px per side or 16 megapixels. Full HD is still available.';
  }

  function resizeComposition(image) {
    const factor = Math.min(1, PREVIEW_CAP.width / image.naturalWidth,
      PREVIEW_CAP.height / image.naturalHeight);
    CANVAS.width = Math.max(1, Math.round(image.naturalWidth * factor));
    CANVAS.height = Math.max(1, Math.round(image.naturalHeight * factor));
    canvas.width = CANVAS.width;
    canvas.height = CANVAS.height;
    $('canvasFrame').style.maxWidth = `${Math.min(1280, CANVAS.width)}px`;
    $('aspectLabel').textContent = `${CANVAS.width} × ${CANVAS.height} · PREVIEW`;
    resetDialoguePosition();
    updateResolutionUI();
  }

  function scheduleRender() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(renderNow);
  }

  function styleAssetsReady() {
    const artwork = currentArtwork();
    return Boolean(artwork && artwork.box && artwork.pin && artwork.nameShadow);
  }

  // A single source of truth for interactivity. Before an image is decoded,
  // while a replacement image decodes, and during export, editing is locked.
  // The screenshot picker remains available during decoding, so a slow upload
  // can be replaced without reloading the page.
  function updateEditorLocks() {
    const ready = canEdit();
    const photoMode = state.mode === 'photo';
    $('dropzone').disabled = exporting;
    for (const id of ['editBackground', 'editDialogue', 'speakerName', 'dialogueText',
      'showBox', 'spriteBtn', 'clearSprite']) $(id).disabled = !ready;
    $('dialogueStyle').disabled = !ready || !allStylesReady();
    for (const id of ['zoom', 'resetPhoto', 'zoomOut', 'zoomIn']) {
      $(id).disabled = !ready || !photoMode;
    }
    for (const id of ['frameScale', 'fontSize', 'unlockWidth', 'resetDialog']) {
      $(id).disabled = !ready || photoMode;
    }
    $('boxWidth').disabled = !ready || photoMode || !state.independentWidth;
    $('nameplateFade').disabled = !ready || photoMode || Boolean(state.customFrame);
    $('exportOriginal').disabled = !ready || !originalExportAllowed(state.photo);
    $('exportFit').disabled = !ready;
    canvas.style.cursor = ready && (photoMode || state.showFrame) ? 'grab' : 'default';
  }

  function updateExportStatus() {
    const overflow = state.showFrame && dialogueLayout().overflow;
    $('overflowWarning').hidden = !overflow;
    $('overflowWarning').textContent = overflow
      ? 'Dialogue exceeds the space in the frame. Shorten the text, widen the frame, or reduce its font size before exporting.'
      : '';

    // Prevent exporting a substitute drawing while a style's PSD assets load.
    const artworkReady = Boolean(state.customFrame || styleAssetsReady());
    const canExport = canEdit() && !overflow && artworkReady;
    $('exportSide').disabled = !canExport;
    updateEditorLocks();
    return canExport;
  }

  function refreshDisplay() {
    $('scaleValue').textContent = `${Math.round(state.frameScale * 100)}%`;
    $('widthValue').textContent = `${Math.round(state.frameWidth * state.frameScale * frameUnit())} px`;
    $('fontValue').textContent = `${Math.round(state.fontSize * state.frameScale * frameUnit())} px`;
    $('zoomValue').textContent = `${Math.round(state.photoZoom * 100)}%`;
    $('nameplateFadeValue').textContent = `${state.nameplateFade}%`;
    updateExportStatus();
    scheduleRender();
  }

  function endDrag() {
    drag = null;
    canvas.classList.remove('dragging');
  }

  function setMode(mode) {
    if (mode !== 'photo' && !canEdit()) return;
    state.mode = mode;
    endDrag();
    const isPhoto = mode === 'photo';
    $('editBackground').setAttribute('aria-pressed', String(isPhoto));
    $('editDialogue').setAttribute('aria-pressed', String(!isPhoto));
    $('editBackground').classList.toggle('primary', isPhoto);
    $('editDialogue').classList.toggle('primary', !isPhoto);
    $('modeGuide').textContent = isPhoto
      ? 'Step 1: Position the screenshot. The dialogue frame stays locked in the lower center.'
      : 'Step 2: Screenshot locked. Drag the dialogue frame; adjust scale, text, or unlock its width.';
    $('previewMode').textContent = isPhoto ? 'BACKGROUND EDIT · BOX LOCKED' : 'DIALOGUE EDIT · PHOTO LOCKED';
    $('stageHint').textContent = isPhoto ? ' · Drag screenshot · frame locked' : ' · Drag dialogue box · photo locked';
    $('stageNote').textContent = isPhoto
      ? 'Stage ①: Move the screenshot. Then choose ② Edit dialogue box.'
      : 'Stage ②: Drag the dialogue box. Switch back to stage ① to adjust the screenshot.';
    updateEditorLocks();
    scheduleRender();
  }

  function selectDialogueStyle() {
    const next = $('dialogueStyle').value;
    if (!canEdit() || !allStylesReady() || !Object.hasOwn(DIALOGUE_STYLES, next)) {
      $('dialogueStyle').value = state.dialogueStyle;
      return;
    }
    state.dialogueStyle = next;
    // A still-loading custom PNG must not silently override this explicit style choice.
    ++imageRequests.frame;
    state.customFrame = null;
    $('spriteName').textContent = `Using ${currentStyle().label} frame (PSD)`;
    refreshDisplay();
  }

  function syncDialogue() {
    if (!canEdit()) return;
    state.speaker = $('speakerName').value;
    state.dialogue = $('dialogueText').value;
    state.fontSize = Number($('fontSize').value);
    state.nameplateFade = Math.max(0, Math.min(100, Number($('nameplateFade').value)));
    const priorScale = state.frameScale;
    state.frameScale = Math.min(1.5, Math.max(0.55, Number($('frameScale').value) / 100));
    state.showFrame = $('showBox').checked;
    state.independentWidth = $('unlockWidth').checked;
    // The original frame width is the hard minimum, even if an input is set programmatically.
    state.frameWidth = state.independentWidth
      ? Math.min(FRAME.maxWidth, Math.max(FRAME.width, Number($('boxWidth').value)))
      : FRAME.width;
    // An untouched frame should remain at its intended bottom margin as it scales.
    // After manual dragging, preserve the user's custom placement instead.
    if (priorScale !== state.frameScale && !state.frameMoved) resetDialoguePosition();
    refreshDisplay();
  }

  function zoomPhoto(value, pivotX = CANVAS.width / 2, pivotY = CANVAS.height / 2) {
    if (!canEdit() || state.mode !== 'photo') return;
    const next = Math.max(0.4, Math.min(3.5, value));
    const ratio = next / state.photoZoom;
    // Keep the image point underneath the cursor fixed while zooming.
    state.photoX = (pivotX - CANVAS.width / 2) - (pivotX - CANVAS.width / 2 - state.photoX) * ratio;
    state.photoY = (pivotY - CANVAS.height / 2) - (pivotY - CANVAS.height / 2 - state.photoY) * ratio;
    state.photoZoom = next;
    $('zoom').value = Math.round(next * 100);
    refreshDisplay();
  }

  function resetPhoto() {
    if (!canEdit()) return;
    state.photoZoom = 1;
    state.photoX = 0;
    state.photoY = 0;
    $('zoom').value = '100';
    refreshDisplay();
  }

  function resetDialoguePosition() {
    state.frameX = CANVAS.width / 2;
    state.frameY = CANVAS.height - (FRAME.bottomMargin + FRAME.height * state.frameScale / 2) * frameUnit();
    state.frameMoved = false;
    scheduleRender();
  }

  function positionFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * CANVAS.width / rect.width,
      y: (event.clientY - rect.top) * CANVAS.height / rect.height
    };
  }

  function onPointerDown(event) {
    if (event.button !== 0 || !canEdit()) return;
    if (state.mode === 'photo') {
      if (!state.photo) return;
      drag = { kind: 'photo', id: event.pointerId, startX: event.clientX, startY: event.clientY,
        originalX: state.photoX, originalY: state.photoY };
    } else {
      if (!state.showFrame) return;
      const p = positionFromEvent(event);
      const b = measureFrame();
      if (p.x < b.x || p.x > b.x + b.width || p.y < b.y || p.y > b.y + b.height) return;
      drag = { kind: 'frame', id: event.pointerId, startX: event.clientX, startY: event.clientY,
        originalX: state.frameX, originalY: state.frameY };
    }
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add('dragging');
  }

  function onPointerMove(event) {
    if (!canEdit() || !drag || event.pointerId !== drag.id) return;
    const rect = canvas.getBoundingClientRect();
    const moveX = (event.clientX - drag.startX) * CANVAS.width / rect.width;
    const moveY = (event.clientY - drag.startY) * CANVAS.height / rect.height;
    if (drag.kind === 'photo') {
      state.photoX = drag.originalX + moveX;
      state.photoY = drag.originalY + moveY;
    } else {
      state.frameX = drag.originalX + moveX;
      state.frameY = drag.originalY + moveY;
      state.frameMoved = true;
    }
    scheduleRender();
  }

  function onCanvasKeydown(event) {
    if (!canEdit()) return;
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction) return;
    const valid = state.mode === 'photo' ? Boolean(state.photo) : state.showFrame;
    if (!valid) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 1;
    if (state.mode === 'photo') {
      state.photoX += direction[0] * step;
      state.photoY += direction[1] * step;
    } else {
      state.frameX += direction[0] * step;
      state.frameY += direction[1] * step;
      state.frameMoved = true;
    }
    scheduleRender();
  }

  function isAllowedFile(file, kind) {
    if (!file || file.size === 0 || file.size > IMAGE_LIMITS.maxBytes) return false;
    const type = file.type.toLowerCase();
    const extension = file.name.split('.').pop().toLowerCase();
    const isRaster = MIME_TYPES.has(type) || (!type && ['png', 'jpg', 'jpeg', 'webp', 'avif'].includes(extension));
    if (!isRaster) return false;
    if (kind === 'frame') return type ? ['image/png', 'image/webp'].includes(type) : ['png', 'webp'].includes(extension);
    return true;
  }

  function loadImage(file, kind) {
    if (exporting || (kind === 'frame' && !canEdit())) return;
    if (!isAllowedFile(file, kind)) {
      if (kind === 'photo' && photoLoading) {
        ++imageRequests.photo;
        photoLoading = false;
        $('filename').textContent = state.photoName || 'No image loaded yet';
        refreshDisplay();
      }
      notify('Choose a supported raster image under 60 MB (PNG, JPG, WEBP or AVIF).');
      return;
    }

    const request = ++imageRequests[kind];
    if (kind === 'photo') {
      photoLoading = true;
      endDrag();
      $('filename').textContent = `Loading: ${file.name}`;
      refreshDisplay();
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    const releaseUrl = () => URL.revokeObjectURL(objectUrl);

    image.onload = () => {
      releaseUrl();
      if (request !== imageRequests[kind]) return;
      if (!image.naturalWidth || !image.naturalHeight ||
          image.naturalWidth * image.naturalHeight > IMAGE_LIMITS.maxPixels) {
        if (kind === 'photo') {
          photoLoading = false;
          $('filename').textContent = state.photoName || 'No image loaded yet';
          refreshDisplay();
        }
        notify('Image dimensions are unsupported or too large (maximum 65 megapixels).');
        return;
      }

      if (kind === 'photo') {
        state.photo = image;
        state.photoName = file.name;
        photoLoading = false;
        resizeComposition(image);
        $('filename').textContent = file.name;
        setMode('photo');
        resetPhoto();
        notify(`Screenshot detected: ${image.naturalWidth} × ${image.naturalHeight}.`);
      } else {
        state.customFrame = image;
        updateEditorLocks();
        $('spriteName').textContent = `Custom: ${file.name}`;
        const incomingRatio = image.naturalWidth / image.naturalHeight;
        const targetRatio = state.frameWidth / FRAME.height;
        if (Math.abs(incomingRatio / targetRatio - 1) > 0.15) {
          notify('Frame loaded. Note: its aspect ratio differs and it may look stretched.');
        } else {
          notify('Custom dialogue frame loaded.');
        }
        scheduleRender();
      }
    };
    image.onerror = () => {
      releaseUrl();
      if (request !== imageRequests[kind]) return;
      if (kind === 'photo') {
        photoLoading = false;
        $('filename').textContent = state.photoName || 'No image loaded yet';
        refreshDisplay();
      }
      notify('Could not read this image. Try a different file.');
    };
    image.src = objectUrl;
  }

  async function exportPNG() {
    if (exporting) return; // Guard independently of disabled button state.
    if (!updateExportStatus()) {
      notify(state.photo ? 'Please shorten overflowing dialogue before exporting.' : 'Load a GPose screenshot first.');
      return;
    }
    // Render to a separate off-screen canvas so the on-screen preview stays small.
    // This also avoids requiring a 4K-sized interactive canvas for 4K source images.
    const size = dimensionsForOutput();
    exporting = true;
    $('exportSide').textContent = '⏳ Exporting PNG…';
    updateExportStatus();
    try {
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = size.width;
      outputCanvas.height = size.height;
      const outputContext = outputCanvas.getContext('2d');
      if (!outputContext) throw new Error('Off-screen canvas is unavailable');
      renderTo(outputContext, size.width, size.height);
      const blob = await new Promise((resolve, reject) => {
        outputCanvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG creation failed')), 'image/png');
      });
      const safeName = (state.speaker.trim() || 'scene').replace(/[^a-z0-9_-]+/gi, '-').slice(0, 48);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `ffxiv-dialogue-${safeName}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      notify(`PNG exported at ${size.width} × ${size.height}.`);
    } catch (error) {
      console.error('PNG export failed:', error);
      notify('PNG export failed. Try a different browser or image format.');
    } finally {
      exporting = false;
      $('exportSide').textContent = '↓ Download PNG';
      updateExportStatus();
    }
  }

  function bindEvents() {
    $('editBackground').addEventListener('click', () => setMode('photo'));
    $('editDialogue').addEventListener('click', () => setMode('dialogue'));
    $('dialogueStyle').addEventListener('change', selectDialogueStyle);
    for (const id of ['speakerName', 'dialogueText', 'nameplateFade', 'fontSize', 'frameScale', 'boxWidth', 'unlockWidth', 'showBox']) {
      $(id).addEventListener('input', syncDialogue);
    }
    $('resetDialog').addEventListener('click', resetDialoguePosition);
    for (const id of ['exportOriginal', 'exportFit']) {
      $(id).addEventListener('change', () => {
        if (!canEdit()) return;
        state.exportMode = $('exportOriginal').checked ? 'original' : 'fit';
        updateResolutionUI();
      });
    }

    $('zoom').addEventListener('input', (event) => zoomPhoto(Number(event.target.value) / 100));
    $('zoomIn').addEventListener('click', () => zoomPhoto(state.photoZoom * 1.15));
    $('zoomOut').addEventListener('click', () => zoomPhoto(state.photoZoom / 1.15));
    $('resetPhoto').addEventListener('click', resetPhoto);

    $('dropzone').addEventListener('click', () => $('photoFile').click());
    $('photoFile').addEventListener('change', (event) => {
      if (event.target.files[0]) loadImage(event.target.files[0], 'photo');
      event.target.value = '';
    });
    $('spriteBtn').addEventListener('click', () => $('spriteFile').click());
    $('spriteFile').addEventListener('change', (event) => {
      if (event.target.files[0]) loadImage(event.target.files[0], 'frame');
      event.target.value = '';
    });
    $('clearSprite').addEventListener('click', () => {
      if (!canEdit()) return;
      ++imageRequests.frame; // Also cancels any unfinished custom-frame load.
      state.customFrame = null;
      updateEditorLocks();
      $('spriteName').textContent = `Using ${currentStyle().label} frame (PSD)`;
      scheduleRender();
    });

    for (const type of ['dragenter', 'dragover']) {
      $('dropzone').addEventListener(type, (event) => {
        event.preventDefault();
        $('dropzone').classList.add('over');
      });
    }
    for (const type of ['dragleave', 'drop']) {
      $('dropzone').addEventListener(type, (event) => {
        event.preventDefault();
        $('dropzone').classList.remove('over');
      });
    }
    $('dropzone').addEventListener('drop', (event) => {
      if (!exporting && event.dataTransfer.files.length) loadImage(event.dataTransfer.files[0], 'photo');
    });

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('lostpointercapture', endDrag);
    canvas.addEventListener('keydown', onCanvasKeydown);
    canvas.addEventListener('wheel', (event) => {
      if (!canEdit() || state.mode !== 'photo') return;
      event.preventDefault();
      const point = positionFromEvent(event);
      zoomPhoto(state.photoZoom * (event.deltaY > 0 ? 0.92 : 1.08), point.x, point.y);
    }, { passive: false });
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape') endDrag(); });
    $('exportSide').addEventListener('click', exportPNG);
  }

  if (!previewCtx) {
    document.body.textContent = 'This browser does not support Canvas 2D.';
    return;
  }
  bindEvents();
  loadPSDArtwork();
  setMode('photo');
  refreshDisplay();
  updateResolutionUI();
})();
