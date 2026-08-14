// src/funkin/play/stage/bg.js
class StageBackground {
  static apply(scene, folder, bgValue, elementsArray) {
    if (typeof bgValue !== "string") return;
    // ponytail: string vacio (ej. mainStageErect background="") no es color ni imagen.
    // Sin este guard, se trataba como imagen con namePath="" -> intentaba cargar la
    // carpeta stages/stage/ -> 404.
    if (bgValue.length === 0) return;
    if (bgValue.startsWith("#")) {
      // 1. ES UN COLOR: Aplicar al fondo de la cámara
      scene.cameras.main.setBackgroundColor(bgValue);
      // FIX: Aseguramos que la subcámara de la clase referee herede el color
      if (
        scene.referee &&
        scene.referee.cameras &&
        scene.referee.cameras.game
      ) {
        scene.referee.cameras.game.setBackgroundColor(bgValue);
      }
    } else {
      // 2. ES UNA IMAGEN: Tratamos el string como namePath
      const itemData = {
        type: "image",
        namePath: bgValue,
        position: [0, 0],
        layer: -99999, // Profundidad extrema (detrás de todo)
        scrollFactor: 0, 
      };
      const bgObj = window.StageImages.build(scene, folder, itemData);
      if (bgObj) {
        window.StageProps.apply(bgObj, itemData);
        bgObj.setScrollFactor(0, 0);
        bgObj.setOrigin(0, 0);
        if (scene.referee && scene.referee.cameras) {
          scene.referee.cameras.add(bgObj, "game");
        } else {
          scene.add.existing(bgObj);
        }
        if (elementsArray) {
          elementsArray.push(bgObj);
        }
      }
    }
  }
}
window.StageBackground = StageBackground;