# Agent Guidelines for Kyan Death Match

## Build/Test Commands
- Dev server: `yarn dev` or `just dev`
- Production build: `yarn build` or `just build`
- Preview build: `yarn preview`
- No test suite currently configured

## Code Style
- React functional components with hooks (useState, useEffect, useRef, useCallback)
- JSX file extensions (.jsx)
- Import order: external libs first, then local components, then utils
- Named exports for components (e.g., `export const Experience`)
- Use PascalCase for components, camelCase for functions/variables
- Use `useCallback` and `useMemo` for performance optimization
- Constants in UPPER_SNAKE_CASE at file top (e.g., MOVEMENT_SPEED, FIRE_RATE)
- Error handling: use `.catch(() => {})` for async operations like audio.play()
- Comments: inline for complex logic, JSDoc-style not required
- Audio refs preloaded in useEffect, played with try/catch
- Physics calculations only on host (isHost()), synced via state
- Responsive design: check isMobile/window.innerWidth for mobile vs desktop
