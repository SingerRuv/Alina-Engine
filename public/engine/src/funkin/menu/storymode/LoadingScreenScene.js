// src/funkin/menu/storymode/LoadingScreenScene.js

class LoadingScreenScene extends Phaser.Scene {
  constructor() {
    super({ key: "LoadingScreenScene" });
  }

  preload() {
    this.load.image(
      "FunkayALT",
      window.Path.menuBG + "funkay.png",
    );
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Fondo a pantalla completa (escala para cubrir).
    this.bg = this.add
      .image(width / 2, height / 2, "FunkayALT")
      .setOrigin(0.5);
    const scale = Math.max(width / this.bg.width, height / this.bg.height);
    this.bg.setScale(scale);

    this.bg.setDepth(0);

    // Capa negra para el fade.
    this.blackFade = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000)
      .setDepth(10)
      .setAlpha(1);

    // Fade in.
    this.tweens.add({
      targets: this.blackFade,
      alpha: 0,
      duration: 250,
      ease: "Power2.Out",
    });

    // Lanza la siguiente escena (PlayScene) por encima.
    this.scene.launch("PlayScene");

    // Cuando PlayScene termine su create() -> emite 'play-scene-ready'.
    this.scene.get("PlayScene").events.once("play-scene-ready", () => {
      this.fadeOutAndStop();
    });

    // Fallback de seguridad: si el evento no llega en 8s, sale igual.
    this.time.delayedCall(8000, () => {
      if (this.scene.isActive("LoadingScreenScene")) this.fadeOutAndStop();
    });
  }

  fadeOutAndStop() {
    if (this._fading) return;
    this._fading = true;

    const width = this.scale.width;
    const height = this.scale.height;

    this.blackFade.setAlpha(0).setDepth(10);

    this.tweens.add({
      targets: this.blackFade,
      alpha: 1,
      duration: 350,
      ease: "Power2.In",
      onComplete: () => {
        this.scene.stop();
      },
    });
  }
}

window.LoadingScreenScene = LoadingScreenScene;
if (window.game) {
  window.game.scene.add("LoadingScreenScene", window.LoadingScreenScene);
}
