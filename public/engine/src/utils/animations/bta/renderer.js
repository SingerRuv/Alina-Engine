// src/utils/animations/bta/renderer.js
// ponytail: convertido de ESM a script clasico. Expone window.BTA_renderer con
// computeBounds + renderFrame (fachada, como antes). Sin auto-registro en Phaser.
if (typeof window !== "undefined") {
  window.BTA_renderer = {
    computeBounds: function (atlas, animation) {
      return window.BTA_bounds ? window.BTA_bounds.computeBounds(atlas, animation) : null;
    },
    renderFrame: function (atlas, animation, frameIndex, canvas, opts) {
      if (window.BTA_core && window.BTA_core.renderFrame) {
        window.BTA_core.renderFrame(atlas, animation, frameIndex, canvas, opts);
      }
    },
    renderTimeline: function (ctx, atlas, tl, frame) {
      if (window.BTA_core && window.BTA_core.renderTimeline) {
        window.BTA_core.renderTimeline(ctx, atlas, tl, frame);
      }
    },
    renderMaskedLayer: function (ctx, atlas, contentLayer, maskLayer, frame) {
      if (window.BTA_core && window.BTA_core.renderMaskedLayer) {
        window.BTA_core.renderMaskedLayer(ctx, atlas, contentLayer, maskLayer, frame);
      }
    },
  };
}
