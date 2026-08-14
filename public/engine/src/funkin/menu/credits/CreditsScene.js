class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: "CreditsScene" });
    this.scrollIndex = 0;
    this.canInteract = false;
  }

  preload() {
    this.load.json("creditsData", window.Path.dataUI + "Credits.json");
    this.load.audio("scrollMenu", Path.sounds + "menu/scrollMenu.ogg");
    this.load.audio("confirmMenu", Path.sounds + "menu/confirmMenu.ogg");
    this.load.audio("cancelMenu", Path.sounds + "menu/cancelMenu.ogg");
    this.load.audio("freakyMenu", Path.music + "freakymenu.ogg");
  }

  create() {
    this.music = this.sound
      .getAllPlaying()
      .find((s) => ["introMusic", "freakyMenu"].includes(s.key));
    if (!this.music) {
      this.music = this.sound.add("freakyMenu", { loop: true });
    }
    if (!this.music.isPlaying) this.music.play();

    this.cameras.main.setBackgroundColor("#101014");
    const { width: w, height: h } = this.scale;

    this.titleText = this.add
      .text(w / 2, 40, "CREDITS", {
        fontFamily: '"VCR OSD Mono", "VCR", sans-serif',
        fontSize: "48px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0);

    this.bodyText = this.add
      .text(w / 2, 110, "", {
        fontFamily: '"VCR OSD Mono", "VCR", sans-serif',
        fontSize: "20px",
        color: "#eaeaea",
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0);

    this.hintText = this.add
      .text(w / 2, h - 40, "ESC / ENTER PARA VOLVER", {
        fontFamily: '"VCR OSD Mono", "VCR", sans-serif',
        fontSize: "14px",
        color: "#666666",
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0);

    this._parseCredits();
    this.canInteract = true;

    this.inputListener = (e) => {
      if (!this.canInteract) return;
      if (Controls.UI_UP(e)) this._scroll(-1);
      else if (Controls.UI_DOWN(e)) this._scroll(1);
      else if (Controls.BACK(e) || Controls.ACCEPT(e)) this.goBack();
    };
    window.addEventListener("keydown", this.inputListener);

    this.input.on("wheel", (pointer, go, dx, dy) => {
      if (!this.canInteract) return;
      this._scroll(dy > 0 ? 1 : -1);
    });

    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", this.inputListener);
    });
  }

  _parseCredits() {
    const data = this.cache.json.get("creditsData");
    this.rows = [];
    if (data && Array.isArray(data.credits)) {
      for (const team of data.credits) {
        if (team.title) this.rows.push({ type: "team", text: team.title });
        if (Array.isArray(team.sections)) {
          for (const sec of team.sections) {
            if (sec.title) this.rows.push({ type: "section", text: sec.title });
            if (Array.isArray(sec.users)) {
              for (const u of sec.users) {
                if (u && u.name) {
                  this.rows.push({
                    type: "user",
                    text: u.description ? `${u.name} — ${u.description}` : u.name,
                  });
                }
              }
            }
          }
        }
      }
    }
    if (this.rows.length === 0) {
      this.rows.push({ type: "team", text: "Alina Engine" });
    }
    this.maxScroll = Math.max(0, this.rows.length - 1);
    this._render();
  }

  _render() {
    const w = this.scale.width;
    let out = "";
    let line = 0;
    const visibleStart = Math.max(0, this.scrollIndex - 8);
    const visibleEnd = Math.min(this.rows.length, visibleStart + 17);
    for (let i = visibleStart; i < visibleEnd; i++) {
      const r = this.rows[i];
      if (r.type === "team") {
        out += `\n  ${r.text}\n`;
      } else if (r.type === "section") {
        out += `  ${r.text}\n`;
      } else {
        out += `    ${r.text}\n`;
      }
      line++;
    }
    this.bodyText.setText(out);
  }

  _scroll(dir) {
    const next = Phaser.Math.Clamp(this.scrollIndex + dir, 0, this.maxScroll);
    if (next !== this.scrollIndex) {
      this.scrollIndex = next;
      this.sound.play("scrollMenu");
      this._render();
    }
  }

  goBack() {
    this.canInteract = false;
    this.sound.play("cancelMenu");
    if (window.transitionTo) {
      window.transitionTo(this, "MainMenuScene");
    } else {
      this.scene.start("MainMenuScene");
    }
  }
}

window.CreditsScene = CreditsScene;
if (window.game && window.game.scene) {
  try {
    window.game.scene.add("CreditsScene", CreditsScene);
  } catch (e) { }
}
