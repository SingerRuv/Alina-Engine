class StoryMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "StoryMenuScene" });
    this.weeks = [
      {
        key: "tutorial", bg: "stage", title: "tutorial",
        songs: [{ name: "Tutorial", id: "tutorial" }],
      },
      {
        key: "week1", bg: "stage", title: "week1",
        songs: [
          { name: "Bopeebo", id: "bopeebo" },
          { name: "Fresh", id: "fresh" },
          { name: "Dad Battle", id: "dadbattle" },
        ],
      },
      {
        key: "week2", bg: "halloween", title: "week2",
        songs: [
          { name: "Spookeez", id: "spookeez" },
          { name: "South", id: "south" },
          { name: "Monster", id: "monster" },
        ],
      },
      {
        key: "week3", bg: "philly", title: "week3",
        songs: [
          { name: "Pico", id: "pico" },
          { name: "Philly Nice", id: "philly-nice" },
          { name: "Blammed", id: "blammed" },
        ],
      },
      {
        key: "week4", bg: "limo", title: "week4",
        songs: [
          { name: "Satin Panties", id: "satin-panties" },
          { name: "High", id: "high" },
          { name: "M.I.L.F", id: "milf" },
        ],
      },
      {
        key: "week5", bg: "christmas", title: "week5",
        songs: [
          { name: "Cocoa", id: "cocoa" },
          { name: "Eggnog", id: "eggnog" },
          { name: "Winter Horrorland", id: "winter-horrorland" },
        ],
      },
      {
        key: "week6", bg: "school", title: "week6",
        songs: [
          { name: "Senpai", id: "senpai" },
          { name: "Roses", id: "roses" },
          { name: "Thorns", id: "thorns" },
        ],
      },
      {
        key: "week7", bg: "tank", title: "week7",
        songs: [
          { name: "Ugh", id: "ugh" },
          { name: "Guns", id: "guns" },
          { name: "Stress", id: "stress" },
        ],
      },
      {
        key: "weekend1", bg: "phillystreets", title: "weekend1",
        songs: [
          { name: "Darnell", id: "darnell" },
          { name: "Lit Up", id: "lit-up" },
          { name: "2Hot", id: "2hot" },
          { name: "Blazin", id: "blazin" },
        ],
      },
      { key: "lesserafim", bg: "lesserafim", title: "lesserafim", songs: [] },
    ];
    this.selectedWeek = 0;
    this.difficulties = ["easy", "normal", "hard"];
    this.selectedDifficulty = 1;

    this.bgSprite = null;
    this.diffSprite = null;
    this.titleSprites = [];
    this.leftArrow = null;
    this.rightArrow = null;
    this.songTexts = [];
    this.levelScoreText = null;
    this.levelScoreLabel = null;
    this.levelScoreLerp = 0;
    this.levelScoreTarget = 0;
    this.w = 0;
    this.h = 0;
    this.tracks = null;
  }

  preload() {
    this.load.atlasXML("arrowsMenu", "assets/images/menu/storymode/arrows.png", "assets/images/menu/storymode/arrows.xml");
    this.load.atlasXML("vinylDisk", "assets/images/menu/storymode/vinyl_disk/vinyl_disk.png", "assets/images/menu/storymode/vinyl_disk/vinyl_disk.xml");
    this.load.audio("scrollMenu", Path.sounds + "menu/scrollMenu.ogg");
    this.load.audio("confirmMenu", Path.sounds + "menu/confirmMenu.ogg");
    this.load.audio("cancelMenu", Path.sounds + "menu/cancelMenu.ogg");
    this.load.audio("freakyMenu", Path.music + "freakyMenu.ogg");
    this.load.image("TracksMenu", "assets/images/menu/storymode/Tracks.png");
    this.weeks.forEach(week => {
      this.load.image("bg" + week.key, "assets/images/menu/storymode/backgrounds/" + week.bg + ".png");
      this.load.image("title" + week.key, "assets/images/menu/storymode/titles/" + week.title + ".png");
    });
    this.difficulties.forEach(d => {
      this.load.image("diff_" + d, "assets/images/menu/storymode/difficults/" + d + ".png");
    });
    if (window.Alphabet) window.Alphabet.load(this);
  }

  create() {
    const { width: w, height: h } = this.scale;
    this.w = w;
    this.h = h;

    // Discord RPC: en storymode
    if (window.DiscordRPC && typeof window.DiscordRPC.setMenuScreen === "function") {
      window.DiscordRPC.setMenuScreen("Story Mode");
    }

    this.music = this.sound
      .getAllPlaying()
      .find((s) => ["introMusic", "freakyMenu"].includes(s.key));
    if (!this.music) this.music = this.sound.add("freakyMenu", { loop: true });
    if (!this.music.isPlaying) this.music.play();

    this.cameras.main.setBackgroundColor("#000000");

    if (this.textures.exists("vinylDisk")) {
      this.vinylDisk = this.add.sprite(w - 70, 259, "vinylDisk")
        .setOrigin(0.5, 0.5)
        .setScale(0.5)
        .setDepth(1);
 
      if (!this.anims.exists("vinylDiskLoop")) {
        const frames = this.textures.get("vinylDisk").getFrameNames().sort();
        if (frames.length > 0) {
          this.anims.create({
            key: "vinylDiskLoop",
            frames: frames.map((f) => ({ key: "vinylDisk", frame: f })),
            frameRate: 14,
            repeat: -1,
          });
        }
      }
      if (this.anims.exists("vinylDiskLoop")) {
        this.vinylDisk.play("vinylDiskLoop");
      }
    }

    this.levelScoreLabel = this.add.text(150, h - 150, "WEEK SCORE", {
      fontFamily: "vcr", fontSize: "48px", fill: "#FFFFFF",
    }).setOrigin(0, 1).setDepth(100);
    this.levelScoreText = this.add.text(150, h - 150, "0", {
      fontFamily: "vcr", fontSize: "48px", fill: "#888888",
    }).setOrigin(0, 0).setDepth(100);

    this.initTitleSprites();
    this.leftArrow = this.add.sprite(w - 600, h - 200, "arrowsMenu")
      .setDepth(100)
      .setFrame("leftIdle0000")
      .setScale(0.8);
    this.rightArrow = this.add.sprite(w - 80, h - 200, "arrowsMenu")
      .setDepth(100)
      .setFrame("rightIdle0000")
      .setScale(0.8);

    this.add.text(w - 20, h - 20, "ESC TO GO BACK", {
      fontSize: "14px", fill: "#666666", fontFamily: "vcr",
    }).setOrigin(1, 1);

    this.showWeek(this.selectedWeek);
    this.renderWeekList();
    this.renderTracklist();
    this.showDifficulty();
    this.updateLevelScore();

    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      if (deltaY > 0) this.changeWeek(1);
      else if (deltaY < 0) this.changeWeek(-1);
    });

    this.inputListener = (e) => {
      if (e.repeat) return;
      if (Controls.UI_UP(e)) {
        this.changeWeek(-1);
      } else if (Controls.UI_DOWN(e)) {
        this.changeWeek(1);
      } else if (Controls.UI_LEFT(e)) {
        this.changeDifficulty(-1);
      } else if (Controls.UI_RIGHT(e)) {
        this.changeDifficulty(1);
      } else if (Controls.ACCEPT(e)) {
        this.startCampaign();
      } else if (Controls.BACK(e) || e.keyCode === 27) {
        this.sound.play("cancelMenu");
        this.scene.start("MainMenuScene");
      }
    };
    window.addEventListener("keydown", this.inputListener);

    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", this.inputListener);
    });
  }

  update() {
    if (!this.levelScoreText) return;
    const diff = this.levelScoreTarget - this.levelScoreLerp;
    if (Math.abs(diff) < 1) {
      this.levelScoreLerp = this.levelScoreTarget;
    } else {
      this.levelScoreLerp += diff * 0.06;
    }
    const shown = Math.round(this.levelScoreLerp).toLocaleString("en-US");
    this.levelScoreText.setText(shown);
  }

  initTitleSprites() {
    this.titleSprites.forEach(s => s.destroy());
    this.titleSprites = [];
    this.weeks.forEach(week => {
      const spr = this.add.image(this.w / 2, 0, "title" + week.key)
        .setOrigin(0.5)
        .setScale(0.8)
        .setAlpha(0)
        .setDepth(-1);
      this.titleSprites.push(spr);
    });
  }

  showWeek(index) {
    const week = this.weeks[index];
    if (this.bgSprite) this.bgSprite.destroy();
    this.bgSprite = this.add.image(this.w / 2, this.h / 2 - 105, "bg" + week.key);
  }

  renderWeekList() {
    const n = this.weeks.length;
    // Sin vinilo: mostrar solo la semana seleccionada.
    if (!this.vinylDisk) {
      this.titleSprites.forEach((s, i) => {
        s.setAlpha(i === this.selectedWeek ? 1 : 0);
      });
      return;
    }
    // Sobre el vinilo: solo 3 semanas (prev, actual, next), centradas en el disco.
    const centerX = this.vinylDisk.x - 220;
    const centerY = this.vinylDisk.y;
    const spacing = 120;
    this.titleSprites.forEach((s) => s.setAlpha(0));
    [-1, 0, 1].forEach((off) => {
      const idx = Phaser.Math.Wrap(this.selectedWeek + off, 0, n);
      const spr = this.titleSprites[idx];
      if (!spr) return;
      const x = centerX - (off === 0 ? 140 : 0);
      spr.setPosition(x, centerY + off * spacing);
      spr.setAlpha(off === 0 ? 1 : 0.5);
      spr.setDepth(2);
    });
  }

  renderTracklist() {
    this.songTexts.forEach(t => t.destroy());
    this.songTexts = [];
    if (!this.tracks) {
      this.tracks = this.add.image(590, this.h - 220, "TracksMenu")
        .setOrigin(0, 1);
    }
    const week = this.weeks[this.selectedWeek];
    const songs = week.songs || [];
    const startY = this.h - 186 + 8;
    const centerX = this.tracks.x + this.tracks.width / 2;
    songs.forEach((song, i) => {
      const txt = this.add.text(centerX, startY + i * 36, song.name, {
        fontFamily: "vcr", fontSize: "32px", fill: "#E55777",
      }).setOrigin(0.5, 0.1);
      this.songTexts.push(txt);
    });
  }

  positionDifficultyRow() {
    const y = this.h - 160;
    this.diffSprite.setPosition(this.w - 290, y);
    this.leftArrow.setPosition(this.w - 450, y);
    this.rightArrow.setPosition(this.w - 140, y);
  }

  showDifficulty() {
    if (this.diffSprite) this.diffSprite.destroy();
    const diff = this.difficulties[this.selectedDifficulty];
    this.diffSprite = this.add.image(0, 0, "diff_" + diff)
      .setScale(0.8)
      .setDepth(100);
    if (this.leftArrow) this.positionDifficultyRow();
  }

  flashArrow(side) {
    const arrow = side === "left" ? this.leftArrow : this.rightArrow;
    const frame = side === "left" ? "leftConfirm0000" : "rightConfirm0000";
    if (arrow) {
      arrow.setFrame(frame);
      this.time.delayedCall(150, () => {
        if (arrow.active) arrow.setFrame(side === "left" ? "leftIdle0000" : "rightIdle0000");
      });
    }
  }

  updateLevelScore() {
    const week = this.weeks[this.selectedWeek];
    const diff = this.difficulties[this.selectedDifficulty].toUpperCase();
    const key = `genesis_levelscore_${week.key}_${diff}`;
    this.levelScoreTarget = parseInt(localStorage.getItem(key), 10) || 0;
  }

  changeWeek(dir) {
    this.selectedWeek = Phaser.Math.Wrap(this.selectedWeek + dir, 0, this.weeks.length);
    this.showWeek(this.selectedWeek);
    this.renderWeekList();
    this.renderTracklist();
    this.updateLevelScore();
    this.sound.play("scrollMenu");
  }

  changeDifficulty(dir) {
    this.flashArrow(dir < 0 ? "left" : "right");
    this.selectedDifficulty = Phaser.Math.Wrap(this.selectedDifficulty + dir, 0, this.difficulties.length);
    this.showDifficulty();
    this.updateLevelScore();
    this.sound.play("scrollMenu");
  }

  startCampaign() {
    const week = this.weeks[this.selectedWeek];
    const playlist = (week.songs || []).map(s => s.id);
    if (playlist.length === 0) return;
    this.sound.play("confirmMenu");
    this.registry.set("playLoadData", {
      CurrentSong: playlist[0],
      Difficulty: this.difficulties[this.selectedDifficulty],
      SceneOrigin: "storymode",
      Playlist: playlist,
      PlaylistIndex: 0,
      CampaignScore: 0,
      CampaignId: week.key,
    });
    this.scene.start("PlayScene");
  }
}
window.StoryMenuScene = StoryMenuScene;
if (window.game)
  window.game.scene.add("StoryMenuScene", window.StoryMenuScene);
