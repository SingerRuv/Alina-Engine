/**
 * AutoUpdate.js
 * Sistema de auto-actualizaciones para Alina Engine.
 * Consulta un manifest remoto en GitHub, compara versiones semver
 * y muestra un popup DOM cuando hay una nueva version disponible.
 *
 * Endpoint: https://raw.githubusercontent.com/SingerRuv/Alina-Engine-Updates/main/package.json
 *
 * Manifest schema:
 * {
 *   "version": "X.Y.Z",
 *   "changelog": "string",
 *   "downloadUrl": "https://...",
 *   "minSupportedVersion": "X.Y.Z"   // opcional, update obligatorio
 * }
 */
class AutoUpdate {
  // Version local hardcodeada. El numero vive en package.json pero el motor
  // no lee package.json, asi que lo mantenemos sincronizado manualmente al release.
  static VERSION = "1.0.0";

  // URL del manifest. Cambiar si cambia el repo.
  static MANIFEST_URL =
    "https://raw.githubusercontent.com/SingerRuv/Alina-Engine-Updates/main/package.json";

  // Throttle: no volver a chequear si pasaron menos de 1 hora desde el ultimo check.
  static THROTTLE_KEY = "alina_autoupdate_lastcheck";
  static THROTTLE_MS = 60 * 60 * 1000; // 1 hora

  // Toggle del menu de opciones (opt-updates).
  static isEnabled() {
    if (window.OptionsStorage) {
      return window.OptionsStorage.load("opt-updates", "check", false);
    }
    return false;
  }

  // Compara semver "X.Y.Z". Retorna 1 si a>b, -1 si a<b, 0 si iguales.
  static compareVersions(a, b) {
    if (a === b) return 0;
    const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
    const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const na = pa[i] || 0;
      const nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  // Consulta el manifest remoto. Llama a handleManifest(data) si hay update,
  // o a handleNoUpdate() si esta al dia. No hace nada si el toggle esta off
  // o si se chequeo recientemente (throttle).
  static async check(force = false) {
    if (!force && !this.isEnabled()) return;

    // Throttle: no repetir check dentro de THROTTLE_MS.
    if (!force) {
      const last = parseInt(localStorage.getItem(this.THROTTLE_KEY) || "0", 10);
      if (Date.now() - last < this.THROTTLE_MS) return;
    }

    try {
      const res = await fetch(this.MANIFEST_URL, { cache: "no-store" });
      if (!res.ok) {
        console.warn(
          "%c AUTOUPDATE %c Manifest HTTP " + res.status,
          "background: #b71c1c; color: white;",
          "color: unset;",
        );
        return;
      }
      const data = await res.json();
      localStorage.setItem(this.THROTTLE_KEY, String(Date.now()));

      const remote = data.version;
      const cmp = this.compareVersions(remote, this.VERSION);
      if (cmp > 0) {
        // Hay update.
        this.handleUpdate(data);
      } else if (cmp === 0) {
        console.log(
          "%c AUTOUPDATE %c v" + this.VERSION + " (al dia)",
          "background: #004d40; color: white;",
          "color: unset;",
        );
      } else {
        console.warn(
          "%c AUTOUPDATE %c Local v" +
            this.VERSION +
            " > remote v" +
            remote +
            " (build ahead?)",
          "background: #b71c1c; color: white;",
          "color: unset;",
        );
      }
    } catch (e) {
      console.warn("[AUTOUPDATE] fetch failed:", e.message || e);
    }
  }

  // Muestra el popup de update. Si minSupportedVersion > local, el update
  // es obligatorio (no se puede "Mas tarde").
  static handleUpdate(data) {
    const mandatory = data.minSupportedVersion
      ? this.compareVersions(this.VERSION, data.minSupportedVersion) < 0
      : false;

    console.log(
      "%c AUTOUPDATE %c Nueva version v" + data.version,
      "background: #004d40; color: white;",
      "color: unset;",
    );

    this.showUpdatePopup(data, mandatory);
  }

  // Popup DOM overlay. Se cierra con "Mas tarde" (si !mandatory) o "Descargar".
  static showUpdatePopup(data, mandatory) {
    // Si ya hay un popup, no duplicar.
    if (document.getElementById("alina-autoupdate-popup")) return;

    const overlay = document.createElement("div");
    overlay.id = "alina-autoupdate-popup";
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:99999;" +
      "display:flex;align-items:center;justify-content:center;font-family:sans-serif;z-index:99999;";

    const modal = document.createElement("div");
    modal.style.cssText =
      "background:#1a1a1a;border:2px solid #4d4d4d;border-radius:8px;padding:24px 32px;" +
      "max-width:480px;color:#fff;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.5);";

    const title = document.createElement("h2");
    title.textContent = "Nueva versión disponible";
    title.style.cssText =
      "margin:0 0 8px 0;font-size:20px;color:#66ff33;font-weight:bold;";
    modal.appendChild(title);

    const ver = document.createElement("p");
    ver.textContent = "v" + this.VERSION + " → v" + data.version;
    ver.style.cssText = "margin:0 0 12px 0;font-size:14px;color:#ccc;";
    modal.appendChild(ver);

    if (data.changelog) {
      const ch = document.createElement("p");
      ch.textContent = data.changelog;
      ch.style.cssText =
        "margin:0 0 20px 0;font-size:12px;color:#aaa;max-height:120px;" +
        "overflow-y:auto;white-space:pre-wrap;text-align:left;";
      modal.appendChild(ch);
    }

    const btnRow = document.createElement("div");
    btnRow.style.cssText =
      "display:flex;gap:12px;justify-content:center;";

    const mkBtn = (label, bg, fg, onClick) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText =
        "padding:10px 24px;border:none;border-radius:4px;cursor:pointer;" +
        "font-size:14px;font-weight:bold;background:" +
        bg +
        ";color:" +
        fg +
        ";";
      b.onmouseover = () => (b.style.opacity = "0.85");
      b.onmouseout = () => (b.style.opacity = "1");
      b.onclick = onClick;
      return b;
    };

    const dismiss = () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    btnRow.appendChild(
      mkBtn("Descargar", "#66ff33", "#000", () => {
        window.open(data.downloadUrl, "_blank");
        dismiss();
      }),
    );

    if (!mandatory) {
      btnRow.appendChild(
        mkBtn("Más tarde", "#4d4d4d", "#fff", dismiss),
      );
    }

    modal.appendChild(btnRow);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }
}

window.AutoUpdate = AutoUpdate;