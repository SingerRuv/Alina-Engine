/**
 * Alina Engine - Script Preloader
 */

window.game = {
  _sceneQueue: [],
  scene: {
    add: function (key, sceneClass, autoStart) {
      window.game._sceneQueue.push({ key, sceneClass, autoStart });
    },
  },
};

async function loadScriptsOrderly() {
  try {
    const prefix = window.isReactNative ? "/engine/" : "";
    console.log(
      `%c ALINA PRELOADER %c Buscando config en: ${prefix}src/core/preload.scripts.jsonc`,
      "background: #004d40; color: white;",
      "color: unset;",
    );

    const response = await fetch(prefix + "src/core/preload.scripts.jsonc");

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status} al buscar el .jsonc`);
    }

    const text = await response.text();
    const cleanJson = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
    const scripts = JSON.parse(cleanJson);

    for (const src of scripts) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = prefix + src;
        script.onload = resolve;
        script.onerror = () => {
          reject(`Archivo no encontrado o bloqueado: ${prefix + src}`);
        };
        document.getElementById("scripts-container").appendChild(script);
      });
    }

    await bootEngine();
  } catch (error) {
    console.error(
      "%c ALINA %c Falló la secuencia de carga -> " +
        (error.message || error),
      "background: #b71c1c; color: white;",
      "color: unset;",
    );
  }
}

async function bootEngine() {
  // Comprobamos si las variables de entorno de Neutralino existen
  const isNeutralinoEnv =
    typeof Neutralino !== "undefined" && typeof window.NL_PORT !== "undefined";

  if (isNeutralinoEnv && !window.isReactNative) {
    Neutralino.init();
    console.log(
      "%c ALINA %c Neutralino inicializado (Modo PC).",
      "background: #004d40; color: white;",
      "color: unset;",
    );

    // Inicia el sistema de archivos
    await FileSystem.init();

    // INYECTA LOS SCRIPTS DE LOS MODS AQUÍ (Antes de arrancar Phaser y DataSongs)
    await FileSystem.injectModScripts();
  } else if (window.isReactNative) {
    console.log(
      "%c ALINA %c Neutralino ignorado (Modo React Native).",
      "background: #004d40; color: white;",
      "color: unset;",
    );
  } else {
    // Si estamos en un navegador web puro y no en React Native ni Neutralino
    console.log(
      "%c ALINA %c Neutralino ignorado (Modo Navegador Web).",
      "background: #004d40; color: white;",
      "color: unset;",
    );
    // Nota: Si dependes de FileSystem aquí, podrías necesitar una versión de
    // FileSystem diseñada para la web (ej. basada en LocalStorage o IndexedDB).
  }

  if (window.DataSongs) {
    await window.DataSongs.loadWeeks();
  }

  if (typeof window.StoragePatch !== "undefined") {
    await window.StoragePatch.init();
  }

  // Recargar controles después de sincronizar Neutralino → localStorage
  if (window.Controls && typeof window.Controls.init === "function") {
    window.Controls.init();
  }

  // Inicializar Discord RPC (solo desktop Neutralino)
  if (window.DiscordRPC && typeof window.DiscordRPC.init === "function") {
    window.DiscordRPC.init();
  }

  if (window.AlinaConfig) {
    const queuedScenes = window.game._sceneQueue || [];
    window.game = new Phaser.Game(window.AlinaConfig);

    queuedScenes.forEach((s) => {
      window.game.scene.add(s.key, s.sceneClass, s.autoStart);
    });

    console.log(
      `%c ALINA %c Boot completado. ${queuedScenes.length} escenas inyectadas.`,
      "background: #004d40; color: white;",
      "color: unset;",
    );

    // ponytail: atajo de teclado global para abrir la escena de debug/info KScene.
    // Si KScene ya esta activa, la cierra. Si no, la arranca. Funciona desde
    // cualquier escena (incluyendo PlayScene, menus, etc).
    // El listener espera a que Phaser exponga SceneManager (keys/run/stop/isActive).
    // Antes del bootEngine, window.game es un stub con solo `add`, asi que
    // cualquier intento de run/stop tira "not a function".
    window.__toggleKScene = (e) => {
      if (!window.game || !window.game.scene) return;
      const sm = window.game.scene;
      // Esperar a que el SceneManager real exista (con keys/run/etc).
      if (!sm.keys || typeof sm.isActive !== "function") return;
      const key = e && e.key ? e.key.toLowerCase() : "";
      const code = e && (e.keyCode || e.which);
      if (key !== "k" && code !== 75) return;
      const target = "KScene";
      const sceneObj = sm.keys[target];
      const active = sm.isActive(target);
      const sleeping = sm.isSleeping(target);
      if (active) {
        sm.stop(target);
      } else if (sleeping || sceneObj) {
        sm.run(target);
      } else {
        sm.start(target);
      }
    };
    if (!window.__kSceneListener) {
      window.__kSceneListener = window.__toggleKScene;
      window.addEventListener("keydown", window.__kSceneListener);
    }
  } else {
    console.error(
      "%c ALINA %c Error Fatal: AlinaConfig no está definido.",
      "background: #b71c1c; color: white;",
      "color: unset;",
    );
  }
}

loadScriptsOrderly();
