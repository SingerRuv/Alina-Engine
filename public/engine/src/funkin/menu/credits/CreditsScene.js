// public/engine/src/funkin/menu/credits/CreditsScene.js
class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: "CreditsScene" });
  }

  preload() {
    if (window.Alphabet && typeof window.Alphabet.load === "function") {
      window.Alphabet.load(this);
    }
    this.load.image("BackgroundCredits", Path.menuBG + "menuBG.png");
    if (window.Path && window.Path.fonts) {
      this.load.font("Phantomuff", Path.fonts + "Phantomuff.ttf");
    }
    this.load.audio("scrollMenu", Path.sounds + "menu/scrollMenu.ogg");
    this.load.audio("confirmMenu", Path.sounds + "menu/confirmMenu.ogg");
    this.load.audio("cancelMenu", Path.sounds + "menu/cancelMenu.ogg");
  }

  create() {
    if (window.Alphabet && typeof window.Alphabet.createAtlas === "function") {
      window.Alphabet.createAtlas(this);
    }

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width / 2, height / 2, "BackgroundCredits");

    this.titleText = new window.Alphabet(
      this,
      width / 2,
      40,
      "CREDITOS",
      true,
      1,
    );
    this.titleText.x = width / 2 - this.titleText.width / 2;

    this.bodyText = this.add.text(width / 2, height / 2, "Alina Engine\nFriday Night Funkin' remake", {
      fontFamily: window.Path && window.Path.fonts ? "Phantomuff" : "Arial",
      fontSize: "18px",
      color: "#ffffff",
      align: "center",
    });
    this.bodyText.setOrigin(0.5);

    this.hintText = this.add.text(width / 2, height - 20, "ESC: Volver", {
      fontFamily: window.Path && window.Path.fonts ? "Phantomuff" : "Arial",
      fontSize: "14px",
      color: "#aaaaaa",
    });
    this.hintText.setOrigin(0.5);

    this.input.keyboard.on("keydown-ESC", () => {
      this.scene.start("MainMenuScene");
    });

    this.events.once("shutdown", () => {
      this.input.keyboard.off("keydown-ESC");
    });
  }
}

window.CreditsScene = CreditsScene;
if (window.game) {
  window.game.scene.add("CreditsScene", window.CreditsScene);
}
