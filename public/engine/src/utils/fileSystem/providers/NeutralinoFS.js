class NeutralinoFS {
  constructor() {
    this.basePath = "";
    this.modsPath = "";
  }

  async init() {
    try {
      let roamingPath = "";

      if (window.NL_OS === "Windows") {
        roamingPath = await Neutralino.os.getEnv("APPDATA");
      } else {
        roamingPath = await Neutralino.os.getPath("data");
      }

      this.basePath = `${roamingPath}/Alina`;
      this.modsPath = `${this.basePath}/mods`;

      const baseCreated = await this.ensureDirExists(this.basePath);
      if (baseCreated) {
        console.log(
          "%c NEUTRALINO FS %c Nueva carpeta base creada en: " + this.basePath,
          "background: #004d40; color: white;",
          "color: unset;",
        );
      }

      const modsCreated = await this.ensureDirExists(this.modsPath);
      if (modsCreated) {
        console.log(
          "%c NEUTRALINO FS %c Nueva carpeta de mods creada.",
          "background: #004d40; color: white;",
          "color: unset;",
        );
      } else {
        console.log(
          "%c NEUTRALINO FS %c Carpeta de mods detectada.",
          "background: #004d40; color: white;",
          "color: unset;",
        );
      }

      await this.scanMods();
    } catch (e) {
      console.error(
        "%c NEUTRALINO FS %c Error inicializando rutas:",
        "background: #b71c1c; color: white;",
        "color: unset;",
        e,
      );
    }
  }

  async ensureDirExists(path) {
    try {
      await Neutralino.filesystem.getStats(path);
      return false;
    } catch (e) {
      await Neutralino.filesystem.createDirectory(path);
      return true;
    }
  }

  async scanMods() {
    try {
      const entries = await Neutralino.filesystem.readDirectory(this.modsPath);
      const mods = entries.filter(
        (e) => e.entry !== "." && e.entry !== ".." && e.type === "DIRECTORY",
      );

      if (mods.length === 0) {
        console.log(
          "%c NEUTRALINO FS %c No se detectaron mods.",
          "background: #004d40; color: white;",
          "color: unset;",
        );
        FileSystem.activeMods = []; // Vaciamos la lista global
      } else {
        FileSystem.activeMods = mods.map((m) => m.entry); // Guardamos para el Monkey Patch
        const modList = FileSystem.activeMods.join("\n");
        console.log(
          `%c NEUTRALINO FS %c Se detectaron ${mods.length} mods:\n${modList}`,
          "background: #004d40; color: white;",
          "color: unset;",
        );
      }
    } catch (e) {
      console.error(
        "%c NEUTRALINO FS %c Error al escanear la carpeta de mods:",
        "background: #b71c1c; color: white;",
        "color: unset;",
        e,
      );
    }
  }

  async readDir(relativePath) {
    try {
      const fullPath = `${this.basePath}/${relativePath}`;
      const entries = await Neutralino.filesystem.readDirectory(fullPath);
      return entries.filter((e) => e.entry !== "." && e.entry !== "..");
    } catch (e) {
      return [];
    }
  }

  async readText(relativePath) {
    try {
      const fullPath = `${this.basePath}/${relativePath}`;
      return await Neutralino.filesystem.readFile(fullPath);
    } catch (e) {
      return null;
    }
  }

  async readMedia(relativePath) {
    try {
      const fullPath = `${this.basePath}/${relativePath}`;
      const binaryData = await Neutralino.filesystem.readBinaryFile(fullPath);

      let mimeType = "application/octet-stream";
      if (fullPath.endsWith(".png")) mimeType = "image/png";
      if (fullPath.endsWith(".ogg")) mimeType = "audio/ogg";

      const blob = new Blob([binaryData], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (e) {
      return null;
    }
  }

  async exists(relativePath) {
    try {
      const fullPath = `${this.basePath}/${relativePath}`;
      await Neutralino.filesystem.getStats(fullPath);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ponytail: escribe un archivo en una ruta absoluta del proyecto (no en mods/basePath).
  // El orquestador debe armar la ruta absoluta (cwd + public/engine/assets/...).
  // Crea los directorios padre si no existen.
  async writeProjectText(fullPath, content) {
    try {
      const dir = fullPath.replace(/[^\\/]+$/, "");
      if (dir && dir !== fullPath) await this.ensureDirExists(dir);
      await Neutralino.filesystem.writeFile(fullPath, content);
      return true;
    } catch (e) {
      console.error(
        "%c NEUTRALINO FS %c Error escribiendo " + fullPath,
        "background: #b71c1c; color: white;",
        "color: unset;",
        e,
      );
      return false;
    }
  }

  // ponytail: lee un archivo del proyecto en ruta absoluta (no de mods/basePath).
  async readProjectText(fullPath) {
    try {
      return await Neutralino.filesystem.readFile(fullPath);
    } catch (e) {
      return null;
    }
  }
}

window.NeutralinoFS = NeutralinoFS;
