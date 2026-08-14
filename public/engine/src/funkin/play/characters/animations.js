// public/engine/src/funkin/play/characters/animations.js
class CharacterAnimations {
  static generate(scene, charId) {
    const data = window.dataChars[charId] || scene.cache.json.get(`charData_${charId}`);
    if (!data || !data.animations) return;

    const cacheKey = `char_atlas_${charId}`;
    const texture = scene.textures.get(cacheKey);

    // ponytail: si la textura aun no esta lista (atlas cargado async), esperar al evento
    // addtexture y regenerar. Sin esto, las animaciones nunca se crean y el personaje
    // queda estatico aunque la textura llegue despues.
    if (!texture || texture.key === "__MISSING") {
      scene.textures.once("addtexture", (key) => {
        if (key === cacheKey) CharacterAnimations.generate(scene, charId);
      });
      return;
    }

    const allFrames = texture.getFrameNames();

    // FIX: Filtro estricto para evitar colisiones de prefijos (ej: "GF Dancing Beat" vs "GF Dancing Beat Landing")
    const isExactAnimation = (frameName, prefix) => {
        if (!frameName.startsWith(prefix)) return false;
        
        // Obtenemos lo que sobra del string después del prefijo
        const remainder = frameName.substring(prefix.length);
        
        // La regla: El resto solo puede tener espacios, números, o la palabra "instance" (típica de Flash CS6/Animate CC).
        // Si tiene otras letras (ej: " Landing 0000"), fallará y será rechazado.
        return /^(?:\s*instance\s*)?\d*$/i.test(remainder);
    };

    data.animations.forEach(anim => {
      // ponytail: el JSON real usa "name" (idle, singLEFT...) no "anim". Soportar ambos.
      const animName = anim.name || anim.anim;
      const animKey = `${charId}_${animName}`;
      
      if (scene.anims.exists(animKey)) return;

      let frames = [];
      const prefix = anim.prefix;
      // ponytail: el JSON real usa "frameIndices" (no "indices"). Soportar ambos.
      const indices = anim.indices || anim.frameIndices;

      if (indices && indices.length > 0) {
        // Usamos nuestro nuevo filtro estricto
        const prefixFrames = allFrames.filter(f => isExactAnimation(f, prefix)).sort();
        frames = indices.map(idx => ({ 
          key: cacheKey, 
          frame: prefixFrames[idx] || prefixFrames[0] 
        }));
      } else {
        // Usamos nuestro nuevo filtro estricto
        const validFrames = allFrames.filter(f => isExactAnimation(f, prefix)).sort();
        frames = validFrames.map(f => ({ key: cacheKey, frame: f }));
      }

      if (frames.length > 0) {
        scene.anims.create({
          key: animKey,
          frames: frames,
          frameRate: anim.fps !== undefined ? anim.fps : 24,
          // Si loop es true, se repite infinitamente (-1), si no, solo una vez (0)
          repeat: anim.loop || anim.looped ? -1 : 0 
        });
      }
    });
  }
}

window.CharacterAnimations = CharacterAnimations;