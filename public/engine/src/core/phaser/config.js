window.AlinaConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  // wide logic
  width: window.wide ? window.wide.calculatePanoramicWidth() : 1280,
  height: 720,
  dom: {
    createContainer: true,
  },
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  loader: {
    maxRetries: 3,
  },
  input: {
    activePointers: 12,
  },
};
