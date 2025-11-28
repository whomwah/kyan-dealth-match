# Kyan Death Match

A multiplayer 3D arena shooter built with React Three Fiber and Playroom Kit. Players join via their phones and battle it out on the big screen!

## Features

- **Stream Mode**: Display the game on a big screen/TV while players control their characters from their phones
- **Real-time Multiplayer**: Powered by Playroom Kit for seamless multiplayer experience
- **3D Physics**: Built with React Three Rapier for realistic physics
- **Post-processing Effects**: Bloom effects and soft shadows for visual polish
- **Adaptive Performance**: Automatically adjusts quality for lower-end devices

## Tech Stack

- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React renderer for Three.js
- [React Three Drei](https://github.com/pmndrs/drei) - Useful helpers for R3F
- [React Three Rapier](https://github.com/pmndrs/react-three-rapier) - Physics engine
- [Playroom Kit](https://joinplayroom.com/) - Multiplayer infrastructure
- [Vite](https://vitejs.dev/) - Build tool

## Quick Start

```bash
yarn install
yarn dev
```

## Using Just

This project includes a [Justfile](https://github.com/casey/just) for common tasks:

```bash
# List all available commands
just

# Install dependencies
just install

# Start development server
just dev

# Build for production
just build

# Preview production build
just preview

# Update dependencies
just update
```

## How to Play

1. Start the development server
2. Open the game URL on a big screen/TV - this becomes the "stream screen"
3. Players scan the QR code or enter the room code on their phones
4. Each player controls their character using the on-screen joystick
5. Battle it out and check the leaderboard for scores!

## Deployment

This project is configured for deployment on [Deno Deploy](https://deno.com/deploy). Build the production assets with:

```bash
yarn build
```

The built files will be in the `dist` directory.

## License

See [LICENSE](LICENSE) for details.