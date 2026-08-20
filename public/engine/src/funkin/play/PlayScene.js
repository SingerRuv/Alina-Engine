// src/funkin/play/PlayScene.js
class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: "PlayScene" });
  }
  init() {
    // Intento temprano para entornos web
    if (window.Preferences && typeof window.Preferences.init === "function") {
      window.Preferences.init();
    }
    if (window.Controls && typeof window.Controls.init === "function") {
      window.Controls.init();
    }
    this.playData = new window.PlayData(this);
  }
  preload() {
    window.PlayRefereePreload.execute(this);
  }
  create() {
    // FIX DE LOCALSTORAGE (NEUTRALINO) Y CONDICIÓN DE CARRERA:
    // Esperamos explícitamente a create para recargar las teclas por si la persistencia demoró
    if (window.Preferences && typeof window.Preferences.init === "function") {
      window.Preferences.init();
    }
    if (window.Controls && typeof window.Controls.init === "function") {
      window.Controls.init();
    }
    this.sound.stopAll();
    this.referee = new window.PlayReferee(this);
    this.events.on("gameover", () => this.triggerGameOver());

    this.events.emit("play-scene-ready");

    // Discord RPC: jugando una canción
    if (window.DiscordRPC && typeof window.DiscordRPC.setPlaying === "function") {
      const songName = this.playData.songName || this.playData.songId || "?";
      const diff = this.playData.difficulty || "normal";
      const durationMs = this.referee.song && this.referee.song.instTrack
        ? this.referee.song.instTrack.duration * 1000
        : null;
      window.DiscordRPC.setPlaying(songName, diff, durationMs);
    }

    this._gameOverKeyListener = (e) => {
      if (e.key === "r" || e.key === "R") {
        this.triggerGameOver();
      }
    };
    window.addEventListener("keydown", this._gameOverKeyListener);

    // Registrar instancia para que Preferences.applyPreference() pueda notificarla.
    if (!window.PlayScene.instances) window.PlayScene.instances = [];
    window.PlayScene.instances.push(this);

    // Auto-pause: si la opcion esta activa, pausar cuando la ventana pierde foco.
    if (window.Preferences && window.Preferences.get("opt-autopause")) {
      this._autoPauseOnBlur = () => {
        if (!this.scene || !this.scene.isActive() || this.scene.isPaused()) return;
        // Pausar la scene (update/timers/tweens) y la musica explicitamente.
        this.scene.pause();
        if (this.sound && this.sound.pauseAll) this.sound.pauseAll();
      };
      this._autoResumeOnFocus = () => {
        if (!this.scene || !this.scene.isPaused()) return;
        this.scene.resume();
        if (this.sound && this.sound.resumeAll) this.sound.resumeAll();
      };
      this.game.events.on(Phaser.Core.Events.BLUR, this._autoPauseOnBlur);
      this.game.events.on(Phaser.Core.Events.FOCUS, this._autoResumeOnFocus);
    }

    this.events.once("shutdown", () => {
      this.events.off("gameover");
      window.removeEventListener("keydown", this._gameOverKeyListener);
      if (this._autoPauseOnBlur)
        this.game.events.off(Phaser.Core.Events.BLUR, this._autoPauseOnBlur);
      if (this._autoResumeOnFocus)
        this.game.events.off(Phaser.Core.Events.FOCUS, this._autoResumeOnFocus);
      window.PlayRefereeShutdown.execute(this.referee);
      if (Array.isArray(window.PlayScene.instances)) {
        const idx = window.PlayScene.instances.indexOf(this);
        if (idx !== -1) window.PlayScene.instances.splice(idx, 1);
      }
    });
  }

  // Hook runtime: aplicado por Preferences._apply al cambiar una opcion.
  applyPreference(key, value) {
    if (!this.referee) return;
    switch (key) {
      case "genesis_strum_bg_opacity":
      case "genesis_lane_opacity":
        if (this.referee.strumlines && typeof this.referee.strumlines.applyLaneOpacity === "function") {
          this.referee.strumlines.applyLaneOpacity();
        }
        break;
      case "genesis_hide_op_strums":
        if (this.referee.strumlines && this.referee.strumlines.opponent) {
          this.referee.strumlines.opponent.forEach((s) => s.setVisible(!value));
        }
        break;
      case "genesis_hide_op_notes":
        if (this.referee.notes && this.referee.notes.opponent) {
          this.referee.notes.opponent.forEach((n) => n.setVisible(!value));
        }
        break;
      default:
        break;
    }
  }

  triggerGameOver() {
    this.sound.stopAll();
    // Si instantrespawn esta activo, skipear la pantalla de GameOver.
    if (window.Preferences && window.Preferences.get("opt-instantrespawn")) {
      this.scene.start("PlayScene");
      return;
    }
    const data = this.registry.get("playLoadData") || {};
    this.scene.start("GameOverScene", {
      origin: this.playData.origin,
      songId: this.playData.songId,
      difficulty: this.playData.difficulty,
      playlist: data.Playlist,
      playlistIndex: data.PlaylistIndex,
      campaignScore: data.CampaignScore,
    });
  }

  update(time, delta) {
    window.PlayRefereeUpdate.execute(this.referee, time, delta);

    // Discord RPC: actualizar score/combo/accuracy en vivo (cada ~5s)
    if (
      window.DiscordRPC &&
      typeof window.DiscordRPC.updatePlaying === "function" &&
      this.referee &&
      this.referee.scoreLogic
    ) {
      const now = Date.now();
      if (!this._rpcLastUpdate || now - this._rpcLastUpdate > 5000) {
        this._rpcLastUpdate = now;
        const sl = this.referee.scoreLogic;
        const stats = sl.statsP1;
        const songName = this.playData.songName || this.playData.songId || "?";
        const diff = this.playData.difficulty || "normal";
        window.DiscordRPC.updatePlaying(songName, diff, {
          score: stats.score,
          combo: stats.combo,
          accuracy: sl.calculateAccuracy(stats),
          botplay: window.Preferences ? window.Preferences.botplay : false,
        });
      }
    }
  }
}
window.PlayScene = PlayScene;
window.game.scene.add("PlayScene", window.PlayScene);