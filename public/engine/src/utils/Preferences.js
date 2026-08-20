/**
 * @class Preferences
 * @description Global class to manage and persist user preferences and settings across the game.
 *
 * Modelo: cada preference se declara con `define(key, defaultValue)` en `init()`.
 * - `get(key)` lee el valor actual.
 * - `set(key, value)` actualiza, persiste en localStorage y notifica a las scenes
 *   activas via `_apply(key, value)`.
 * - Las properties estaticas (`Preferences.ghostTapping`, etc.) son getters/setters
 *   que delegan al registry, manteniendo compatibilidad con el codigo existente.
 */
class Preferences {
  static _registry = {};

  static define(key, defaultValue) {
    if (this._registry[key]) {
      this._registry[key].defaultValue = defaultValue;
      return;
    }
    this._registry[key] = {
      defaultValue,
      currentValue: defaultValue,
    };
  }

  static get(key) {
    const entry = this._registry[key];
    return entry ? entry.currentValue : null;
  }

  static set(key, value) {
    if (!this._registry[key]) this.define(key, value);
    this._registry[key].currentValue = value;
    localStorage.setItem(key, this._serialize(value));
    this._apply(key, value);
  }

  static _serialize(value) {
    if (typeof value === "boolean") return String(value);
    if (typeof value === "number") return String(value);
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  }

  static _deserialize(key, raw) {
    const def = this._registry[key] ? this._registry[key].defaultValue : null;
    if (typeof def === "boolean") return raw === "true";
    if (typeof def === "number") {
      const n = parseFloat(raw);
      return Number.isNaN(n) ? def : n;
    }
    if (typeof def === "string") return raw;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return raw;
    }
  }

  // Hook runtime: notifica a las scenes que estén escuchando.
  static _apply(key, value) {
    if (window.PlayScene && Array.isArray(window.PlayScene.instances)) {
      window.PlayScene.instances.forEach((scene) => {
        if (scene && typeof scene.applyPreference === "function") {
          scene.applyPreference(key, value);
        }
      });
    }
    // Discord RPC: caso especial fuera del motor (extension externa).
    if (key === "opt-discord" && window.DiscordRPC) {
      window.DiscordRPC.setEnabled(value);
    }
  }

  static init() {
    // Declarar todas las preferences con sus defaults.
    this.define("genesis_ghost_tapping", false);
    this.define("genesis_downscroll", false);
    this.define("genesis_middle_scroll", "none");
    this.define("genesis_botplay", false);
    this.define("genesis_2players", false);
    this.define("genesis_note_splashes", true);
    this.define("genesis_opponent_glow", true);
    this.define("genesis_hide_op_strums", false);
    this.define("genesis_hide_op_notes", false);
    this.define("genesis_popup_anim", "default");
    this.define("genesis_popup_pos", [50, 42]);
    this.define("genesis_show_op_popup", true);
    this.define("genesis_tap_break_combo", false);
    this.define("genesis_strum_bg_opacity", 0.0);
    this.define("genesis_lane_opacity", 0.7);
    this.define("genesis_mute_miss_note", false);
    this.define("genesis_mute_miss_note_enemy", false);
    this.define("genesis_score_format", [
      "score",
      "rating",
      "accuracy",
      "misses",
      "combo",
      "maxCombo",
      "cps",
    ]);
    this.define("opt-discord", true);
    this.define("opt-autopause", false);
    this.define("opt-instantrespawn", false);

    // Cargar valores persistidos desde localStorage.
    for (const key of Object.keys(this._registry)) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        this._registry[key].currentValue = this._deserialize(key, raw);
      }
    }
  }

  static save() {
    for (const [key, entry] of Object.entries(this._registry)) {
      localStorage.setItem(key, this._serialize(entry.currentValue));
    }
  }
}

// Accesos legacy como getters/setters computados.
const _legacyKeys = [
  "ghostTapping",
  "downscroll",
  "middleScroll",
  "botplay",
  "twoPlayers",
  "noteSplashes",
  "opponentGlow",
  "hideOpStrums",
  "hideOpNotes",
  "popUpAnim",
  "popUpPos",
  "showOpPopUp",
  "tapBreakCombo",
  "strumBackgroundOpacity",
  "laneOpacity",
  "muteMissNote",
  "muteMissNoteEnemy",
  "scoreFormat",
];
_legacyKeys.forEach((alias) => {
  const key = "genesis_" + alias.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase())
    .replace(/^_/, "");
  // Mapeo especial para nombres que no siguen el patrón.
  const map = {
    ghostTapping: "genesis_ghost_tapping",
    downscroll: "genesis_downscroll",
    middleScroll: "genesis_middle_scroll",
    botplay: "genesis_botplay",
    twoPlayers: "genesis_2players",
    noteSplashes: "genesis_note_splashes",
    opponentGlow: "genesis_opponent_glow",
    hideOpStrums: "genesis_hide_op_strums",
    hideOpNotes: "genesis_hide_op_notes",
    popUpAnim: "genesis_popup_anim",
    popUpPos: "genesis_popup_pos",
    showOpPopUp: "genesis_show_op_popup",
    tapBreakCombo: "genesis_tap_break_combo",
    strumBackgroundOpacity: "genesis_strum_bg_opacity",
    laneOpacity: "genesis_lane_opacity",
    muteMissNote: "genesis_mute_miss_note",
    muteMissNoteEnemy: "genesis_mute_miss_note_enemy",
    scoreFormat: "genesis_score_format",
  };
  const realKey = map[alias] || key;
  Object.defineProperty(Preferences, alias, {
    get() {
      return Preferences.get(realKey);
    },
    set(value) {
      Preferences.set(realKey, value);
    },
    configurable: true,
    enumerable: true,
  });
});

window.Preferences = Preferences;
window.Preferences.init();
