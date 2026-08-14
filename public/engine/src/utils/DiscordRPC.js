// src/utils/DiscordRPC.js
// Cliente Discord Rich Presence para Alina Engine.
// Envía eventos a la extensión Neutralino "js.alina.discordrpc" según la escena activa.
class DiscordRPC {
  static EXT_ID = "js.alina.discordrpc";
  static enabled = false;
  static _lastKey = null;

  static init() {
    if (!window.Neutralino || !Neutralino.extensions) {
      console.warn("[DiscordRPC] Neutralino no disponible, RPC desactivado.");
      return;
    }
    // Leer preferencia del menú de opciones (opt-discord)
    const enabled = window.OptionsStorage
      ? window.OptionsStorage.load("opt-discord", "check", true)
      : true;
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
      return;
    }
    // Estado inicial: en el menú
    this.setMenu();
  }

  static _dispatch(event, data) {
    if (!this.enabled) return;
    try {
      Neutralino.extensions.dispatch(this.EXT_ID, event, data || {});
    } catch (e) {
      console.warn("[DiscordRPC] dispatch error:", e.message);
    }
  }

  // Activar/desactivar desde el menú de opciones (opt-discord)
  static setEnabled(enabled) {
    this.enabled = !!enabled;
    if (this.enabled) {
      this.setMenu();
    } else {
      // Limpiar siempre, aunque enabled sea false
      try {
        Neutralino.extensions.dispatch(this.EXT_ID, "clearActivity", {});
      } catch (e) {
        console.warn("[DiscordRPC] dispatch error:", e.message);
      }
    }
  }

  static _activity(key, details, state, startTimestamp, endTimestamp) {
    const act = {
      details: details || "",
      state: state || "",
      largeImageKey: "alina_logo",
      largeImageText: "Alina Engine",
    };
    if (startTimestamp) act.startTimestamp = startTimestamp;
    if (endTimestamp) act.endTimestamp = endTimestamp;
    this._lastKey = key;
    this._dispatch("setActivity", act);
  }

  // En el menú principal
  static setMenu() {
    this._activity("menu", "En el menú principal", "Alina Engine");
  }

  // En freeplay / storymode
  static setMenuScreen(screen) {
    this._activity("menu_" + screen, "En " + screen, "Alina Engine");
  }

  // Jugando una canción (con duración para el contador "termina en")
  static setPlaying(songName, difficulty, durationMs) {
    const start = Date.now();
    const end = durationMs ? start + durationMs : null;
    this._lastStart = start;
    this._lastEnd = end;
    this._activity(
      "playing",
      "Jugando: " + songName,
      "Dificultad: " + difficulty,
      start,
      end,
    );
  }

  // Actualizar estado en vivo (score, combo, accuracy, botplay)
  static updatePlaying(songName, difficulty, stats) {
    if (!this.enabled) return;
    const botplay = stats && stats.botplay;
    const state = botplay
      ? "BOTPLAY"
      : `Score: ${stats.score} | Combo: ${stats.combo} | ${stats.accuracy}%`;
    this._activity(
      "playing",
      "Jugando: " + songName,
      "Dificultad: " + difficulty + " | " + state,
      this._lastStart,
      this._lastEnd,
    );
  }

  // En pausa
  static setPaused(songName) {
    this._activity("paused", "En pausa", songName || "");
  }

  // Game over
  static setGameOver() {
    this._activity("gameover", "Game Over", "Alina Engine");
  }

  // Limpiar (al cerrar)
  static clear() {
    this._dispatch("clearActivity", {});
  }
}

window.DiscordRPC = DiscordRPC;
