// public/engine/src/funkin/menu/dev/KScene.js
// ponytail: escena de debug/info. Se abre pulsando la tecla 'K'.
// Muestra: FPS, texturas, scenes activas, entidades, modcharts Lua cargados,
// preferences, songs, characters, stages, version del engine.

class KScene extends Phaser.Scene {
  constructor() {
    super({ key: "KScene" });
  }

  preload() {
    if (window.Alphabet && typeof window.Alphabet.load === "function") {
      window.Alphabet.load(this);
    }
    this.load.image("BackgroundK", Path.menuBG + "menuBG.png");
    if (window.Path && window.Path.fonts) {
      this.load.font("Phantomuff", Path.fonts + "Phantomuff.ttf");
    }
    this.load.audio("cancelMenu", Path.sounds + "menu/cancelMenu.ogg");
  }

  create() {
    if (window.Alphabet && typeof window.Alphabet.createAtlas === "function") {
      window.Alphabet.createAtlas(this);
    }

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width / 2, height / 2, "BackgroundK").setAlpha(0.35);

    this.titleText = new window.Alphabet(this, width / 2, 40, "K DEBUG", true, 1);
    this.titleText.x = width / 2 - this.titleText.width / 2;

    const font = window.Path && window.Path.fonts ? "Phantomuff" : "Arial";

    this.infoText = this.add.text(20, 100, "", {
      fontFamily: font,
      fontSize: "14px",
      color: "#ffffff",
      align: "left",
      lineSpacing: 4,
    });

    this.hintText = this.add.text(width / 2, height - 20, "ESC: Volver  |  K: Refrescar", {
      fontFamily: font,
      fontSize: "13px",
      color: "#aaaaaa",
    });
    this.hintText.setOrigin(0.5);

    this.refreshInfo();

    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("MainMenuScene");
    });
    this.input.keyboard.on("keydown-K", () => {
      this.refreshInfo();
    });

    this.events.once("shutdown", () => {
      this.input.keyboard.off("keydown-ESC");
      this.input.keyboard.off("keydown-K");
    });
  }

  refreshInfo() {
    const game = this.game;
    const fps = Math.round(game.loop.actualFps || 0);
    const ms = game.loop.frame ? (1000 / Math.max(fps, 1)).toFixed(1) : "0.0";
    const textures = Object.keys(game.textures.list || {}).length;
    const drawCalls = game.renderer && game.renderer.drawCount ? game.renderer.drawCount : 0;

    const scenes = game.scene.getScenes(true).map((s) => s.scene.key).join(", ") || "(none)";
    const totalEntities = game.scene.getScenes(true).reduce(
      (sum, s) => sum + (s.children ? s.children.list.length : 0),
      0,
    );

    let mem = "N/A";
    if (performance && performance.memory) {
      const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
      const limit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(1);
      mem = `${used}MB / ${limit}MB`;
    }

    const env = window.Neutralino ? "Desktop (NeutralinoJS)" : "Web";
    const mods = window.FileSystem && window.FileSystem.activeMods
      ? window.FileSystem.activeMods.join(", ") || "(none)"
      : "(no FS)";

    let prefs = "(no prefs)";
    if (window.Preferences) {
      prefs = [
        "ghostTapping=" + window.Preferences.ghostTapping,
        "downscroll=" + window.Preferences.downscroll,
        "middleScroll=" + window.Preferences.middleScroll,
        "botplay=" + window.Preferences.botplay,
        "twoPlayers=" + window.Preferences.twoPlayers,
        "opponentGlow=" + window.Preferences.opponentGlow,
      ].join("  |  ");
    }

    const phaserVersion = "Phaser " + (game.config && game.config.version
      ? game.config.version
      : (window.Phaser && Phaser.VERSION) || "?");
    const songsCount = window.DataSongs && window.DataSongs.weeksData
      ? Object.keys(window.DataSongs.weeksData).length
      : 0;
    const charsCount = window.dataChars ? Object.keys(window.dataChars).length : 0;
    const stagesLoaded = Object.keys(game.cache.json.keys || {})
      .filter((k) => k.startsWith("stageData_"))
      .length;

    const audioTime = window.Conductor && game.sound && game.sound.masterVolume !== undefined
      ? Math.round(game.sound.context ? (game.sound.context.currentTime * 1000) : 0)
      : 0;
    const condTime = window.Conductor ? Math.round(window.Conductor.songPosition) : 0;
    const bpm = window.Conductor ? window.Conductor.bpm : 0;
    const beat = window.Conductor ? window.Conductor.currentBeat : 0;
    const step = window.Conductor ? window.Conductor.currentStep : 0;

    this.infoText.setText(
      `─── RENDER ───\n` +
        `FPS: ${fps} (${ms}ms/frame)\n` +
        `Draw Calls: ${drawCalls}\n` +
        `Textures: ${textures}\n` +
        `Memory: ${mem}\n\n` +
        `─── ENGINE ───\n` +
        `${phaserVersion}\n` +
        `Environment: ${env}\n` +
        `Mods: ${mods}\n` +
        `Scenes activas: ${scenes}\n` +
        `Total entities: ${totalEntities}\n\n` +
        `─── AUDIO ───\n` +
        `Audio time: ${audioTime}ms\n` +
        `Conductor time: ${condTime}ms\n` +
        `BPM: ${bpm} | Beat: ${beat} | Step: ${step}\n\n` +
        `─── DATA ───\n` +
        `Songs (weeks): ${songsCount}\n` +
        `Characters cached: ${charsCount}\n` +
        `Stages loaded: ${stagesLoaded}\n\n` +
        `─── PREFS ───\n` +
        prefs,
    );
  }
}

window.KScene = KScene;
if (window.game) {
  window.game.scene.add("KScene", window.KScene);
}
