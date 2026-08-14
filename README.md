# Alina Engine

Motor de juego **Friday Night Funkin'** escrito en **JavaScript** sobre **Phaser 3**. Funciona en escritorio (Neutralino), web y móvil (React Native + Expo).

## Stack

- **Phaser 3** (vendado localmente en `public/engine/lib/`)
- **Neutralino** (desktop wrapper nativo)
- **React Native + Expo** (shell móvil)
- **Node.js** (extensión de Discord Rich Presence)
- **discord-rpc** + **ws** (RPC de Discord)

## Requisitos

- **Node.js** >= 18
- **npm**
- Para desktop: **Neutralino CLI** (`npm install -g @neutralinojs/neu`)

## Instalación

```bash
# 1. Clonar el repo
git clone <url>
cd Alina-Engine

# 2. Instalar dependencias raíz
npm install

# 3. Instalar dependencias de la extensión Discord RPC
cd extensions/discord-rpc
npm install
cd ../..
```

## Ejecución

### Desktop (Neutralino)

```bash
npx neu run
# o si tenés neu instalado globalmente:
neu run
```

La app se abre en una ventana nativa con el juego.

### Web (navegador)

Abrí `public/engine/index.html` en un navegador moderno. Limitaciones: no hay acceso a `FileSystem` nativo.

### Móvil (Expo)

```bash
npm start
```

Metro levanta el bundler. El shell RN abre `http://host:8081/engine/index.html` en un WebView.

## Estructura del proyecto

```
Alina-Engine/
├── src/                    # Shell móvil (React Native + Expo)
├── public/                 # Raíz Neutralino
│   └── engine/             # Motor de juego (Phaser)
│       ├── index.html      # Entry point
│       ├── lib/            # Phaser, PeerJS, FontAwesome (vendeados)
│       ├── src/            # Código del motor
│       │   ├── core/       # Bootstrap + manifest
│       │   ├── funkin/     # Escenas (play, menu, etc.)
│       │   └── utils/      # Utilidades globales
│       └── assets/         # Recursos (png, xml, ogg, json, fonts)
├── extensions/
│   └── discord-rpc/        # Extensión Neutralino para Discord RPC
├── components/             # Componentes Expo (template)
├── scripts/                # Utilidades de build
├── bin/                    # Binarios Neutralino (NO TOCAR)
├── icons/                  # Iconos de la app desktop
├── neutralino.config.json   # Config de Neutralino
└── app.json                # Config de Expo
```

## Features

- Gameplay rítmico con notas, sustains y botplay
- Personajes animables (formato BTA y Sparrow)
- Sistema de skins (JSON + assets intercambiables)
- Discord Rich Presence (menú, jugando, pausa, game over)
- Multijugador (PeerJS)
- Móvil (React Native)

## Comandos útiles

```bash
# Levantar el juego en desktop
npx neu run

# Dev con HMR (Hot Module Replacement)
npm run hmt

# Formatear código
npx eslint . --fix
```

## Contribuir

1. Leé `AGENTS.md` — contiene las reglas del proyecto y la estructura.
2. Hacé tus cambios en una branch.
3. Asegurate de que el manifest `public/engine/src/core/preload.scripts.jsonc` refleje cualquier archivo nuevo.
4. Probá con `neu run` antes de commitear.

## Licencia

Ver `LICENSE`.
