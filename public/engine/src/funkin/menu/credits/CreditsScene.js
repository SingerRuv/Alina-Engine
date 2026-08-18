class CreditsScene extends Phaser.Scene {
    constructor() {
        super({ key: "CreditsScene" });
    }

    preload() {
        if (window.Alphabet) window.Alphabet.load(this);
        this.load.image("BackgroundCredits", Path.menuBG + "menuBG.png");
        this.load.font("Phantomuff", Path.fonts + "Phantomuff.ttf");
        this.load.audio("scrollMenu", Path.sounds + "menu/scrollMenu.ogg");
        this.load.audio("confirmMenu", Path.sounds + "menu/confirmMenu.ogg");
        this.load.audio("cancelMenu", Path.sounds + "menu/cancelMenu.ogg");
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Fondo.
        this.add.image(width / 2, height / 2, "BackgroundCredits");

        // Titulo con Alphabet (estilo FNF clasico).
        if (window.Alphabet) {
            window.Alphabet.createAtlas(this);
            this.titleText = new window.Alphabet(
                this,
                width / 2,
                40,
                "AGRADECIMIENTOS",
                true,  // bold
                1.0    // scale
            );
            // Centrar el contenedor.
            this.titleText.x = width / 2 - this.titleText.width / 2;
        }

        // Texto principal con Phantomuff.
        this.add.text(width / 2, height / 2, "Aqui van tus creditos", {
            fontFamily: "Phantomuff",
            fontSize: "18px",
            color: "#ffffff",
            align: "center",
        }).setOrigin(0.5);

        // Hint inferior con Phantomuff.
        this.add.text(width / 2, height - 20, "ESC: Volver", {
            fontFamily: "Phantomuff",
            fontSize: "14px",
            color: "#aaaaaa",
        }).setOrigin(0.5);

        // ESC para volver.
        this.input.keyboard.on("keydown-ESC", () => {
            this.scene.start("MainMenuScene");
        }, this);
    }
}

window.CreditsScene = CreditsScene;
if (window.game) window.game.scene.add("CreditsScene", window.CreditsScene);