// src/utils/alphabet/Alphabet.js

class Alphabet extends Phaser.GameObjects.Container {
  constructor(scene, x, y, text, bold = false, scale = 1.0) {
    super(scene, x, y);
    this.scene = scene;
    this.text = text;
    this.bold = bold;
    this.scale = scale;
    this.letters = [];
    this.spacing = 0 * scale;
    this.width = 0;

    // PATCH Phaser 3.90: el patch del InputPlugin necesita scene.sys.input.
    // Alphabet suele crearse DESPUES de que scenes existan, asi que este
    // momento es seguro para hacer el patch lazy.
    Alphabet.__patchInputPlugin(scene);

    scene.add.existing(this);
    this.createLetters();
  }

  static __patchInputPlugin(scene) {
    if (Alphabet.__inputPluginPatched) return;
    let plugin = null;
    try {
      // El scene.sys.input es un InputPlugin instance. Tomamos su prototype.
      if (scene && scene.sys && scene.sys.input) {
        plugin = scene.sys.input.constructor;
      } else if (Phaser.Input && Phaser.Input.InputPlugin) {
        plugin = Phaser.Input.InputPlugin;
      } else if (Phaser.InputPlugins && Phaser.InputPlugins.InputPlugin) {
        plugin = Phaser.InputPlugins.InputPlugin;
      } else {
        for (const k in Phaser.Input) {
          const v = Phaser.Input[k];
          if (
            v &&
            v.prototype &&
            typeof v.prototype.pointWithinHitArea === "function"
          ) {
            plugin = v;
            break;
          }
        }
      }
    } catch (e) {}
    if (!plugin || !plugin.prototype) return;
    if (plugin.prototype.__alphabetPatched) {
      Alphabet.__inputPluginPatched = true;
      return;
    }
    const orig = plugin.prototype.pointWithinHitArea;
    if (typeof orig !== "function") return;
    plugin.prototype.pointWithinHitArea = function (gameObject, x, y) {
      const input = gameObject && gameObject.input;
      if (!input) return false;
      if (typeof input.hitAreaCallback !== "function") return false;
      const hitArea = input.hitArea;
      if (!hitArea) return false;
      return orig.call(this, gameObject, x, y);
    };
    plugin.prototype.__alphabetPatched = true;
    Alphabet.__inputPluginPatched = true;
  }

  static load(scene) {
    scene.load.image("alphabet", Path.UI + "alphabet.png");
  }

  static createAtlas(scene) {
    if (!scene.textures.exists("bold")) {
      const alphabetImg = scene.textures.get("alphabet").getSourceImage();
      scene.textures.addAtlas("bold", alphabetImg, window.AlphabetData);
    }
  }

  createLetters() {
    if (!this.scene.textures.exists("bold")) {
      Alphabet.createAtlas(this.scene);
    }

    this.removeAll(true);
    this.letters = [];
    let xPos = 0;

    const specialChars = {
      "#": "hashtag",
      $: "dollarsign",
      "%": "%",
      "&": "amp",
      "(": "start parentheses",
      ")": "end parentheses",
      "*": "*",
      "+": "+",
      "-": "-",
      0: "0",
      1: "1",
      2: "2",
      3: "3",
      4: "4",
      5: "5",
      6: "6",
      7: "7",
      8: "8",
      9: "9",
      ":": ":",
      ";": ";",
      "<": "<",
      "=": "=",
      ">": ">",
      "@": "@",
      "[": "[",
      "\\": "\\",
      "]": "]",
      "^": "^",
      _: "_",
      "'": "apostraphie",
      "!": "exclamation point",
      "?": "question mark",
      ".": "period",
      ",": "comma",
      "|": "|",
      "~": "~",
      "/": "forward slash",
      " ": null,
    };

    const bottomAlignedChars = [".", ",", "_"];

    for (let i = 0; i < this.text.length; i++) {
      const char = this.text[i];
      let prefix = "";

      if (specialChars[char] !== undefined) prefix = specialChars[char];
      else if (/^[A-Z]$/.test(char))
        prefix = char + (this.bold ? " bold" : " capital");
      else if (/^[a-z]$/.test(char)) prefix = char + " lowercase";
      else prefix = char;

      if (prefix === null) {
        xPos += 40 * this.scale;
        continue;
      }

      const animData = this.getOrCreateAnimation(prefix);

      if (animData) {
        const letter = this.scene.add.sprite(
          xPos,
          0,
          "bold",
          animData.firstFrame,
        );
        letter.play(animData.animKey);

        if (bottomAlignedChars.includes(char)) {
          letter.setOrigin(0.5, 1);
          letter.y = 35 * this.scale;
          letter.x += (letter.width * this.scale) / 2;
        } else {
          letter.setOrigin(0, 0.5);
          letter.y = 0;
        }

        letter.setScale(this.scale);
        this.add(letter);
        this.letters.push(letter);
        xPos += letter.width * this.scale + this.spacing;
      }
    }
    this.width = xPos;
  }

  getOrCreateAnimation(prefix) {
    const animKey = prefix;
    const texture = this.scene.textures.get("bold");
    const animationFrames = texture
      .getFrameNames()
      .filter((f) => f.startsWith(prefix));

    if (animationFrames.length > 0) {
      animationFrames.sort();
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: animationFrames.map((f) => ({ key: "bold", frame: f })),
          frameRate: 24,
          repeat: -1,
        });
      }
      return { animKey: animKey, firstFrame: animationFrames[0] };
    }
    return null;
  }
}

// ponytail: PATCH Phaser 3.90 - Container.shutdown() llama clear() que llama
// disable() en cada hit-area. Si el container nunca tuvo setInteractive() previo,
// this.input._drag / this.input._over no se inicializan como arrays y
// disable() rompe con "Cannot read properties of undefined (reading 'indexOf')".
//
// Tambien InputPlugin.pointWithinHitArea() se rompe en mouseMove/Down/Up con
// "hitAreaCallback is not a function" cuando hitAreaCallback es null.
// El codigo Phaser hace:
//   return !(!s || !s.hitAreaCallback(s.hitArea,e,i,t)) && (s.localX=e, s.localY=i, true)
// El `!` se aplica al RESULTADO de la llamada, no al valor pre-call. Si
// hitAreaCallback es null, tira "null is not a function".
//
// El patch del InputPlugin se aplica lazy en el constructor de Alphabet
// (cuando ya existe scene.sys.input). El patch del Container se aplica
// aqui en el IIFE (una sola vez por prototype).
(function () {
  if (typeof Phaser === "undefined") return;

  const Container = Phaser.GameObjects.Container;
  if (
    Container &&
    Container.prototype &&
    !Container.prototype.__alphabetPatched
  ) {
    const origShutdown = Container.prototype.shutdown;
    Container.prototype.shutdown = function () {
      try {
        if (this.input && !this.input.hitArea) {
          this.input = null;
        }
      } catch (e) {}
      try {
        return origShutdown.call(this);
      } catch (e) {}
    };

    const origPreDestroy = Container.prototype.preDestroy;
    Container.prototype.preDestroy = function () {
      try {
        if (this.input && !this.input.hitArea) {
          this.input = null;
        }
      } catch (e) {}
      try {
        return origPreDestroy.call(this);
      } catch (e) {}
    };

    Container.prototype.__alphabetPatched = true;
  }
})();

window.Alphabet = Alphabet;
