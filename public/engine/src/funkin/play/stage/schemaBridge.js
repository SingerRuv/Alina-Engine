// src/funkin/play/stage/schemaBridge.js
// Adapta JSONs de stages escritos en formato FNF-Haxe ("props"+assetPath+zIndex+scroll+animations)
// al shape que ya entiende StageImages/StageXML/StageProps ("stage"+type+namePath+layer+scrollFactor+animation.play_list).
class StageSchemaBridge {
  static resolveFolder(stageName, jsonData) {
    if (jsonData && typeof jsonData.pathName === "string" && jsonData.pathName.length > 0) {
      return jsonData.pathName;
    }
    // ponytail: tabla stageName->folder real (cómo están organizadas las carpetas en assets/images/stages/).
    // Si no hay match, devuelve el directorio del JSON o el stageName como fallback.
    const FOLDER = {
      mainStage: "stage",
      mainStageErect: "stage",
      school: "weeb",
      schoolErect: "weeb",
      schoolEvil: "weeb",
      schoolEvilErect: "weeb",
      spookyMansion: "halloween",
      spookyMansionErect: "halloween",
      phillyStreets: "philly",
      phillyTrain: "philly",
      phillyStreetsErect: "philly",
      phillyTrainErect: "philly",
      phillyBlazin: "philly",
      limoRide: "limo",
      limoRideErect: "limo",
      mallXmas: "christmas",
      mallEvil: "christmas",
      mallXmasErect: "christmas",
      tankmanBattlefield: "tankman",
      tankmanBattlefieldErect: "tankman",
      weekend1: "weekend1",
      sserafim: "sserafim",
    };
    if (FOLDER[stageName]) return FOLDER[stageName];
    if (jsonData && typeof jsonData.directory === "string") {
      return jsonData.directory;
    }
    return stageName;
  }

  static isLegacyShape(jsonData) {
    if (!jsonData) return false;
    if (Array.isArray(jsonData.props)) return true;
    const items = jsonData.stage || jsonData.props;
    if (Array.isArray(items) && items.length > 0) {
      const first = items[0];
      // ponytail: una sola señal: presencia de assetPath en un item sin type.
      if (first && (first.assetPath !== undefined || (first.zIndex !== undefined && first.type === undefined))) {
        return true;
      }
    }
    return false;
  }

  // Convierte un item legacy {assetPath,name,position,scale,zIndex,scroll,isPixel,animations}
  // al shape nuevo {type,namePath,position,scale,layer,scrollFactor,...}.
  static bridgeItem(legacy) {
    const assetPath = legacy.assetPath || legacy.namePath || "";
    const hasAnimations = legacy.animations && legacy.animations.length > 0;
    const type = hasAnimations ? "spritesheet" : "image";
    const layer = (legacy.zIndex !== undefined) ? legacy.zIndex : (legacy.layer !== undefined ? legacy.layer : 0);
    const scroll = (legacy.scroll && legacy.scroll.length === 2) ? legacy.scroll.slice() : [1, 1];
    const flipX = !!(legacy.flipX || legacy.flip_x);
    const flipY = !!(legacy.flipY || legacy.flip_y);
    const opacity = (legacy.alpha !== undefined) ? legacy.alpha : (legacy.opacity !== undefined ? legacy.opacity : 1);

    const bridged = {
      type,
      namePath: assetPath,
      position: Array.isArray(legacy.position) ? legacy.position.slice() : [0, 0],
      scale: Array.isArray(legacy.scale) ? legacy.scale.slice() : [1, 1],
      origin: Array.isArray(legacy.origin) ? legacy.origin.slice() : [0, 0],
      layer,
      scrollFactor: scroll,
      visible: legacy.visible !== undefined ? !!legacy.visible : true,
      opacity,
      flip_x: flipX,
      flip_y: flipY,
      antialiasing: legacy.isPixel === true ? false : true,
    };

    if (legacy.chromaKey !== undefined) bridged.chromaKey = legacy.chromaKey;
    if (legacy.chromaTolerance !== undefined) bridged.chromaTolerance = legacy.chromaTolerance;
    if (legacy.chromaSensitivity !== undefined) bridged.chromaSensitivity = legacy.chromaSensitivity;

    if (hasAnimations) {
      const playList = {};
      let defaultFps = 24;
      for (const a of legacy.animations) {
        if (!a || !a.name) continue;
        playList[a.name] = {
          prefix: a.prefix || "",
          indices: Array.isArray(a.frameIndices) ? a.frameIndices : [],
        };
        if (a.frameRate) defaultFps = a.frameRate;
      }
      const hasLooped = legacy.animations.some((x) => x && x.looped);
      bridged.animation = {
        frameRate: defaultFps,
        play_mode: hasLooped ? "Loop" : "Loop",
        play_list: playList,
      };
    }
    return bridged;
  }

  // Devuelve una versión normalizada del JSON con shape nuevo (stage[]) y folder correcto.
  // No muta el original.
  static normalize(jsonData, stageName) {
    if (!jsonData) {
      return {
        data: { stage: [], background: null, name: stageName, version: "1.0.0" },
        folder: stageName,
      };
    }
    const folder = StageSchemaBridge.resolveFolder(stageName, jsonData);
    const sourceItems = Array.isArray(jsonData.stage)
      ? jsonData.stage
      : Array.isArray(jsonData.props) ? jsonData.props : [];
    const bridgedItems = sourceItems.map((it) => {
      if (it && (it.type === "image" || it.type === "spritesheet")) return it;
      return StageSchemaBridge.bridgeItem(it);
    });
    const data = {
      ...jsonData,
      stage: bridgedItems,
    };
    return { data, folder };
  }
}

if (typeof window !== "undefined") {
  window.StageSchemaBridge = StageSchemaBridge;
}
