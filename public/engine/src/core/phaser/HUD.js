// src/core/phaser/HUD.js

class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: "HUDScene" });
  }

  create() {
    this.scene.bringToTop();
    window.HUD = this;

    // Instanciar el monitor nativo de Phaser
    if (typeof DebugMonitor !== "undefined") {
      this.debugMonitor = new DebugMonitor(this);
    } else {
      console.warn("DebugMonitor no está definido.");
    }
  }

}

window.HUDScene = HUDScene;

window.game.scene.add("HUDScene", window.HUDScene, true);
