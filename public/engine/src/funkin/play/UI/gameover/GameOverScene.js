class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
    this.gameOverData = null;
    this.bf = null;
    this.lossSound = null;
    this.gameOverMusic = null;
    this.inputListener = null;
    this.confirming = false;
    this.canInput = false;
    this.hasStartedAnimation = false;
  }

  init(data) {
    this.gameOverData = data || {};
  }

  preload() {
    this.load.atlasXML(
      "bfDead",
      Path.chars + "xml/BOYFRIEND_DEAD.png",
      Path.chars + "xml/BOYFRIEND_DEAD.xml",
    );
    this.load.audio("gameOverMusic", Path.music + "gameplay/gameover/gameOver.ogg");
    this.load.audio("gameOverEnd", Path.music + "gameplay/gameover/gameOverEnd.ogg");
    this.load.audio("fnfLoss", Path.sounds + "gameplay/gameover/fnf_loss_sfx.ogg");
  }

  create() {
    this.confirming = false;
    this.canInput = false;
    this.hasStartedAnimation = false;
    this.cameras.main.setBackgroundColor("#000000");

    // Discord RPC: game over
    if (window.DiscordRPC && typeof window.DiscordRPC.setGameOver === "function") {
      window.DiscordRPC.setGameOver();
    }

    const { width: w, height: h } = this.scale;

    this.bf = this.add.sprite(w / 2, h / 2, "bfDead").setOrigin(0.5, 0.5);

    this.createDeathAnims();

    // Sonido de "blue balled" (muerte) — inmediato, en paralelo
    this.lossSound = this.sound.add("fnfLoss");
    this.lossSound.play();

    // Input bloqueado 1 segundo para evitar skips accidentales (como el oficial)
    this.time.delayedCall(1000, () => {
      this.canInput = true;
    });

    this.logic = new window.GameOverLogic(this);

    this.inputListener = (e) => {
      if (this.confirming) return;
      if (Controls.ACCEPT(e)) {
        if (!this.canInput) return;
        this.confirmDeath();
      } else if (Controls.BACK(e) || e.keyCode === 27) {
        if (!this.canInput) return;
        this.logic.quit();
      }
    };
    window.addEventListener("keydown", this.inputListener);

    this.events.once("shutdown", this.shutdown, this);
  }

  update() {
    // Primer frame: reproducir animación de caída (como el oficial)
    if (!this.hasStartedAnimation) {
      this.hasStartedAnimation = true;
      this.bf.play("bfDies");
      this.bf.once("animationcomplete", () => {
        if (!this.bf || !this.bf.active) return;
        // Cuando termina firstDeath: música + deathLoop (patrón oficial)
        this.startDeathMusic();
        this.bf.play("bfDeadLoop");
      });
    }
  }

  startDeathMusic() {
    if (this.gameOverMusic) return;
    this.gameOverMusic = this.sound.add("gameOverMusic", { loop: true });
    this.gameOverMusic.play();
  }

  confirmDeath() {
    if (this.confirming) return;
    this.confirming = true;

    // Detener música de fondo y reproducir gameOverEnd (como el oficial)
    if (this.gameOverMusic) this.gameOverMusic.stop();
    this.sound.play("gameOverEnd");

    if (this.bf && this.anims.exists("bfDeadConfirm")) {
      this.bf.play("bfDeadConfirm");
      this.bf.once("animationcomplete", () => {
        this.cameras.main.fadeOut(500, 0, 0, 0, () => this.logic.retry());
      });
    } else {
      this.cameras.main.fadeOut(500, 0, 0, 0, () => this.logic.retry());
    }
  }

  createDeathAnims() {
    const tex = this.textures.get("bfDead");
    if (!tex || tex.key === "__MISSING") return;
    const allFrames = tex.getFrameNames();

    const framesFor = (prefix) =>
      allFrames
        .filter((f) => f.startsWith(prefix))
        .sort()
        .map((f) => ({ key: "bfDead", frame: f }));

    const dies = framesFor("BF dies");
    if (dies.length > 0 && !this.anims.exists("bfDies")) {
      this.anims.create({ key: "bfDies", frames: dies, frameRate: 24, repeat: 0 });
    }

    const loop = framesFor("BF Dead Loop");
    if (loop.length > 0 && !this.anims.exists("bfDeadLoop")) {
      this.anims.create({ key: "bfDeadLoop", frames: loop, frameRate: 24, repeat: -1 });
    }

    const confirm = framesFor("BF Dead confirm");
    if (confirm.length > 0 && !this.anims.exists("bfDeadConfirm")) {
      this.anims.create({ key: "bfDeadConfirm", frames: confirm, frameRate: 24, repeat: 0 });
    }
  }

  shutdown() {
    window.removeEventListener("keydown", this.inputListener);
    this.inputListener = null;
    if (this.lossSound) { this.lossSound.stop(); this.lossSound.destroy(); this.lossSound = null; }
    if (this.gameOverMusic) { this.gameOverMusic.stop(); this.gameOverMusic.destroy(); this.gameOverMusic = null; }
  }
}
window.GameOverScene = GameOverScene;
if (window.game)
  window.game.scene.add("GameOverScene", window.GameOverScene);
