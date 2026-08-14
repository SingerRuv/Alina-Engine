// src/funkin/menu/debug/BTAConverterScene.js
// Herramienta de desarrollo: convierte personajes BTA (VSlice/Adobe Animate) a
// atlas Sparrow (atlas.png + atlas.xml) para que CharacterRenderer los cargue
// con atlasXML nativo. Se usa UNA VEZ por personaje; los assets quedan en disco.
// Acceso: F4 desde cualquier escena (o botón en DebugMonitor).
class BTAConverterScene extends Phaser.Scene {
  constructor() {
    super({ key: "BTAConverterScene" });
    this.charList = [];
    this.status = "";
    this.converting = false;
  }

  create() {
    this.cameras.main.setBackgroundColor("#1a1a1a");
    const W = this.scale.width, H = this.scale.height;

    this.add.text(W / 2, 40, "BTA -> Sparrow Converter", {
      fontFamily: "monospace", fontSize: "24px", color: "#ffffff",
    }).setOrigin(0.5, 0.5);

    this.statusText = this.add.text(W / 2, H - 40, "", {
      fontFamily: "monospace", fontSize: "14px", color: "#88ff88",
    }).setOrigin(0.5, 0.5);

    // Lista de personajes BTA (los que tienen Animation.json + spritemap1.*)
    this.charList = [
      "bf", "bf-car", "bf-dark", "bf-death", "bfFakeOut", "dad",
      "darnell", "darnellBlazin", "gf", "gf-christmas", "gf-dark", "gfCar",
      "momCar", "monster", "nene", "nene-christmas", "nene-dark", "otis",
      "parents-christmas", "pico-christmas", "pico-dark", "pico-holding-nene",
      "pico-speaker", "picoBlazin",
    ];

    // Botón convertir
    const btn = this.add.text(W / 2, 90, "[ CONVERT ALL ]", {
      fontFamily: "monospace", fontSize: "18px", color: "#88ff88",
    }).setOrigin(0.5, 0.5);
    btn.setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => this.convertAll());

    // Lista de personajes
    let yy = 130;
    for (const id of this.charList) {
      this.add.text(40, yy, id, {
        fontFamily: "monospace", fontSize: "12px", color: "#cccccc",
      }).setOrigin(0, 0);
      yy += 18;
    }

    // Esc para salir
    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.stop("BTAConverterScene");
      const prev = window.game._btaPrev;
      if (prev) { try { window.game.scene.wake(prev); } catch (e) {} }
    });
  }

  async convertAll() {
    if (this.converting) return;
    this.converting = true;
    this.setStatus("Cargando plugin BTA...", "#88ff88");

    // ponytail: los modulos BTA puros se cargan como scripts clasicos en el manifest
    // (window.BTA_utils/BTA_parser/BTA_renderer). NO webmaps.js (tiene auto-registro
    // en Phaser que reintroduce el bug del timing).
    const BTA = {
      ...(window.BTA_parser || {}),
      ...(window.BTA_renderer || {}),
    };
    if (!BTA.buildAtlas || !BTA.renderFrame) {
      this.setStatus("ERROR: modulos BTA no disponibles (orden de manifest incorrecto).", "#ff8888");
      this.converting = false;
      return;
    }

    let ok = 0, fail = 0;
    for (const id of this.charList) {
      this.setStatus("Convirtiendo " + id + "...", "#88ff88");
      try {
        const res = await this.convertOne(BTA, id);
        if (res) ok++; else fail++;
      } catch (e) {
        console.error("[BTA] fallo " + id, e);
        fail++;
      }
      // ponytail: espera entre personaje y personaje para que el navegador procese
      // las 2 descargas del anterior antes de lanzar las del siguiente. Sin esto, lanzar
      // 46 descargas seguidas hace que el navegador las bloquee y se cuelga.
      await this.wait(1500);
    }
    this.setStatus("Listo: " + ok + " OK, " + fail + " fallos.", ok > 0 ? "#88ff88" : "#ff8888");
    this.converting = false;
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async convertOne(BTA, charId) {
    const base = "assets/images/characters/" + charId;
    const png = base + "/spritemap1.png";
    const sm = base + "/spritemap1.json";
    const anim = base + "/Animation.json";

    // ponytail: reimplementar load() localmente (sin webmaps.js). Carga los 3 archivos
    // y construye el atlas con parser.buildAtlas.
    const atlas = await this.loadAtlas(BTA, png, sm, anim);
    const animations = BTA.getAnimations(atlas);
    if (!animations || animations.length === 0) {
      console.warn("[BTA] " + charId + ": sin animaciones");
      return false;
    }

    // Para cada label, renderizar sus frames y empaquetar en un atlas grande.
    const PAD = 2;
    const frames = []; // {name, w, h, canvas}
    for (const a of animations) {
      const b = BTA.computeBounds(atlas, a);
      const w = b ? Math.ceil(b.width) + PAD * 2 : 64;
      const h = b ? Math.ceil(b.height) + PAD * 2 : 64;
      const tx = b ? -Math.floor(b.minX) + PAD : 0;
      const ty = b ? -Math.floor(b.minY) + PAD : 0;

      for (let i = 0; i < a.duration; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        BTA.renderFrame(atlas, a, i, canvas, { tx, ty });
        const name = a.name + String(i).padStart(4, "0");
        frames.push({ name, w, h, canvas });
      }
    }

    if (frames.length === 0) return false;

    // ponytail: bin-packing real con el tamaño ORIGINAL de cada frame (no escalado al max).
    // Cada animacion conserva su sourceSize -> el renderer calcula anchors distintos por
    // animacion y el sprite no "salta" de tamaño al cambiar de pose (ej. singUP mas alto).
    // Si el atlas excede el limite de WebGL (8192), se escala TODO uniformemente.
    const MAX_TEX = 8192;

    // Shelf packing: coloca cada frame en filas, saltando a una nueva fila cuando no cabe.
    const layout = [];
    let atlasW = 0, atlasH = 0, rowW = 0, rowH = 0;
    for (const f of frames) {
      if (rowW + f.w > MAX_TEX) {
        atlasW = Math.max(atlasW, rowW);
        atlasH += rowH;
        rowW = 0; rowH = 0;
      }
      layout.push({ f, x: rowW, y: atlasH });
      rowW += f.w;
      rowH = Math.max(rowH, f.h);
    }
    atlasW = Math.max(atlasW, rowW);
    atlasH += rowH;

    // Escala global si excede el limite.
    let scale = 1;
    if (atlasW > MAX_TEX || atlasH > MAX_TEX) {
      scale = Math.min(MAX_TEX / atlasW, MAX_TEX / atlasH);
      scale = Math.max(0.25, scale);
    }

    const outW = Math.max(1, Math.floor(atlasW * scale));
    const outH = Math.max(1, Math.floor(atlasH * scale));

    // Canvas del atlas final.
    const out = document.createElement("canvas");
    out.width = outW;
    out.height = outH;
    const ctx = out.getContext("2d");
    ctx.clearRect(0, 0, outW, outH);

    // XML Sparrow con frameX/frameY/frameWidth/frameHeight (sourceSize/offset reales).
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<TextureAtlas imagePath="atlas.png">\n';
    for (const l of layout) {
      const x = Math.floor(l.x * scale);
      const y = Math.floor(l.y * scale);
      const w = Math.max(1, Math.floor(l.f.w * scale));
      const h = Math.max(1, Math.floor(l.f.h * scale));
      ctx.drawImage(l.f.canvas, x, y, w, h);
      // frameX/frameY = offset del contenido dentro del frame (0 porque el canvas ya esta
      // recortado al bounds). frameWidth/frameHeight = sourceSize real del frame.
      xml += `  <SubTexture name="${l.f.name}" x="${x}" y="${y}" width="${w}" height="${h}" frameX="0" frameY="0" frameWidth="${l.f.w}" frameHeight="${l.f.h}"/>\n`;
    }
    xml += "</TextureAtlas>\n";

    // Descargar ambos (archivos planos en Descargas), con espera entre los dos.
    this.download(out.toDataURL("image/png"), charId + "_atlas.png");
    await this.wait(400);
    this.download("data:text/xml;charset=utf-8," + encodeURIComponent(xml), charId + "_atlas.xml");
    return true;
  }

  download(dataUrl, filename) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ponytail: carga los 3 archivos BTA (png + spritemap.json + Animation.json) y
  // construye el atlas con parser.buildAtlas. Reemplaza WebMaps.load sin side-effects.
  async loadAtlas(BTA, pngUrl, smUrl, animUrl) {
    const readText = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status + " " + url);
      return await res.text();
    };
    const readImage = (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("PNG load failed: " + url));
        img.src = url;
      });

    const [smText, animText, image] = await Promise.all([
      readText(smUrl),
      readText(animUrl),
      readImage(pngUrl),
    ]);
    return BTA.buildAtlas(image, smText, animText);
  }

  setStatus(msg, color) {
    this.status = msg;
    if (this.statusText) {
      this.statusText.setText(msg);
      this.statusText.setColor(color || "#88ff88");
    }
  }
}

if (typeof window !== "undefined") {
  window.BTAConverterScene = BTAConverterScene;
}
