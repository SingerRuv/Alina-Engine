// src/utils/animations/bta/rend/elements.js
// ponytail: convertido de ESM a script clasico. Expuesto via window.BTA_elements.
// Dependencias leidas de window.BTA_utils / BTA_filters / BTA_core.
function renderASI(ctx, atlas, asi) {
  const u = window.BTA_utils || {};
  const applyFilterAndDraw = window.BTA_filters && window.BTA_filters.applyFilterAndDraw;
  if (typeof applyFilterAndDraw !== "function") return;
  applyFilterAndDraw(ctx, asi, (targetCtx) => {
    const sp = atlas.spriteMap.get(asi.N);
    if (!sp) return;
    const M = u.getMX ? u.getMX(asi) : [1, 0, 0, 1, 0, 0];
    targetCtx.save();
    targetCtx.transform(M[0], M[1], M[2], M[3], M[4], M[5]);

    const blendASI = u.blendFromB ? u.blendFromB(asi.B) : null;
    if (blendASI) targetCtx.globalCompositeOperation = blendASI;

    if (asi.C) {
      const C = asi.C;
      let aMult = 1;
      if (C.M === "CA" || C.M === "Alpha" || C.M === "AD" || C.M === "Advanced")
        aMult = C.AM != null ? C.AM : 1;
      if (aMult !== 1) targetCtx.globalAlpha *= Math.max(0, Math.min(1, aMult));
    }

    if (sp.rotated) {
      targetCtx.translate(0, sp.w);
      targetCtx.rotate(-Math.PI / 2);
      targetCtx.drawImage(atlas.image, sp.x, sp.y, sp.w, sp.h, 0, 0, sp.w, sp.h);
    } else {
      targetCtx.drawImage(atlas.image, sp.x, sp.y, sp.w, sp.h, 0, 0, sp.w, sp.h);
    }
    targetCtx.restore();
  });
}

function renderSI(ctx, atlas, si, parentLocalFrame) {
  const u = window.BTA_utils || {};
  const applyFilterAndDraw = window.BTA_filters && window.BTA_filters.applyFilterAndDraw;
  const renderTimeline = window.BTA_core && window.BTA_core.renderTimeline;
  if (typeof applyFilterAndDraw !== "function") return;
  applyFilterAndDraw(ctx, si, (targetCtx) => {
    const sym = atlas.symbolMap.get(si.SN);
    if (!sym) return;
    const len = u.symbolLength ? u.symbolLength(sym) : 1;
    const FF = si.FF || 0;
    let cf;
    switch (si.LP || "LP") {
      case "SF": case "singleframe": cf = FF; break;
      case "PO": case "playonce": cf = Math.min(FF + parentLocalFrame, len - 1); break;
      default: cf = (((FF + parentLocalFrame) % len) + len) % len;
    }
    const M = u.getMX ? u.getMX(si) : [1, 0, 0, 1, 0, 0];
    targetCtx.save();
    targetCtx.transform(M[0], M[1], M[2], M[3], M[4], M[5]);

    if (si.C) {
      const C = si.C;
      let aMult = 1;
      if (C.M === "CA" || C.M === "Alpha" || C.M === "AD" || C.M === "Advanced")
        aMult = C.AM != null ? C.AM : 1;
      if (aMult !== 1) targetCtx.globalAlpha *= Math.max(0, Math.min(1, aMult));
    }

    const blend = u.blendFromB ? u.blendFromB(si.B) : null;
    if (blend) targetCtx.globalCompositeOperation = blend;

    if (typeof renderTimeline === "function") renderTimeline(targetCtx, atlas, sym.TL, cf);
    targetCtx.restore();
  });
}

if (typeof window !== "undefined") {
  window.BTA_elements = { renderASI, renderSI };
}
