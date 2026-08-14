class GameOverLogic {
  constructor(scene) {
    this.scene = scene;
  }

  retry() {
    this.scene.sound.stopAll();
    this.scene.scene.start("PlayScene");
  }

  quit() {
    this.scene.sound.stopAll();
    const origin = this.scene.gameOverData ? this.scene.gameOverData.origin : "";
    const target =
      origin === "storymode"
        ? "StoryMenuScene"
        : origin === "freeplay"
          ? "FreeplayScene"
          : "MainMenuScene";
    if (window.transitionTo) {
      window.transitionTo(this.scene, target);
    } else {
      this.scene.scene.start(target);
    }
  }
}
window.GameOverLogic = GameOverLogic;
