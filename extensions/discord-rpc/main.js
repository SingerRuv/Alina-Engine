// extensions/discord-rpc/main.js
// Extensión Neutralino para Discord Rich Presence.
// Se conecta al servidor Neutralino por WebSocket y recibe eventos del engine.
const fs = require("fs");
const process = require("process");
const WS = require("ws");
const { Client } = require("discord-rpc");

const CLIENT_ID = "1532954080337727618";
const rpc = new Client({ transport: "ipc" });

let connected = false;
let currentActivity = null;

function setActivity(activity) {
  currentActivity = activity;
  if (!connected) return;
  rpc.setActivity(activity).catch((err) => {
    console.error("[DiscordRPC] setActivity error:", err.message);
  });
}

rpc.on("ready", () => {
  connected = true;
  console.log("[DiscordRPC] Conectado a Discord.");
  if (currentActivity) setActivity(currentActivity);
});

rpc.on("disconnected", () => {
  connected = false;
  console.log("[DiscordRPC] Desconectado de Discord.");
});

// Obtener params de conexión desde stdin (los envía Neutralino al arrancar la extensión)
const processInput = JSON.parse(fs.readFileSync(process.stdin.fd, "utf-8"));
const NL_PORT = processInput.nlPort;
const NL_TOKEN = processInput.nlToken;
const NL_CTOKEN = processInput.nlConnectToken;
const NL_EXTID = processInput.nlExtensionId;

const client = new WS(
  `ws://localhost:${NL_PORT}?extensionId=${NL_EXTID}&connectToken=${NL_CTOKEN}`
);

client.on("error", (err) => {
  console.error("[DiscordRPC] WS error:", err.message);
});

client.on("open", () => {
  console.log("[DiscordRPC] Conectado a Neutralino.");
  // Auto-conectar a Discord al arrancar
  rpc.login({ clientId: CLIENT_ID }).catch((err) => {
    console.error("[DiscordRPC] login error:", err.message);
  });
});

client.on("close", () => {
  console.log("[DiscordRPC] WS cerrado, saliendo.");
  process.exit();
});

client.on("message", (data) => {
  let msg;
  try {
    msg = JSON.parse(data.toString());
  } catch (e) {
    return;
  }
  const { event, data: payload } = msg;
  if (!event) return;

  switch (event) {
    case "setActivity":
      setActivity(payload || {});
      break;
    case "clearActivity":
      currentActivity = null;
      if (connected) rpc.clearActivity().catch(() => {});
      break;
    case "disconnect":
      if (connected) rpc.destroy().catch(() => {});
      break;
    default:
      break;
  }
});
