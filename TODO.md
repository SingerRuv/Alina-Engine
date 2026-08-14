# Build v1
- [x] Add intro text menu
- [x] Add GF dance menu
- [x] Add options menu
- [x] Add main menu
- [x] Add notes logic and renderer
- [x] Add strumline logic and renderer
- [x] Add stage logic and renderer
- [x] Add multiplayer menu
- [x] Add local multiplayer
- [x] Add enemy playback
- [x] Add botplay
- [x] Add online multiplayer
- [x] Add health bar
- [x] Add time bar
- [x] Add score display (static)
- [ ] Add keybinds configuration

# Plugins no soportados / dormidos

## BTA / WebMaps (`public/engine/src/utils/animations/bta/`)
- **Estado**: cdigo muerto. NO integrado al motor. NO se carga en el manifest.
- **Por qu**: el plugin (Phing o Adobe Animate Better Texture Atlas loader) escrito en ESM, no
  compatible con el `preload.scripts.js` (inyecta `<script>` clsicos sin `type=module`).
- **Por qu NO se cable**: se intent en sesiones anteriores integrarlo via conversin ESM->clsico +
  registro en `WebMaps.registerPhaser(window.Phaser)`. Resultado: todas las animaciones de UI
  (storymode, options, menu) se aceleraron 2-3x. Tras revertir la integracin (ver `git log` o
  revertir el bloque del manifest), el ritmo normaliz. La causa exacta del timing no est
  aislada, pero la bisecin confirma que fue introducida por la integracin.
- **Decisin**: NO re-intentar hasta tener diagnstico runtime con logs (que %C phaser / sprites
  aceleran) o un conversor offline BTA -> Sparrow atlasXML que evite la necesidad del plugin.
- **Para volver a usar**: requera investigar el side-effect sobre `Sprite.anims.update /
  BTAGameObject.preUpdate` y posiblemente reescribir con `Sprite` nativo en vez de heredar de
  `Image`.
