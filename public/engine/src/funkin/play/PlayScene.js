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

    this.events.once("shutdown", () => {
      this.events.off("gameover");
      window.removeEventListener("keydown", this._gameOverKeyListener);
      window.PlayRefereeShutdown.execute(this.referee);
    });
  }

  triggerGameOver() {
    this.sound.stopAll();
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