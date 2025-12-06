import { Environment } from "@react-three/drei";
import {
  Joystick,
  insertCoin,
  isHost,
  myPlayer,
  onPlayerJoin,
  useMultiplayerState,
} from "playroomkit";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useThree } from "@react-three/fiber";

// Detect if device is mobile/touch
const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
};

export const WEAPONS = [
  "GrenadeLauncher",
  "AK",
  "Pistol",
  "Revolver",
  "Revolver_Small",
  "RocketLauncher",
  "ShortCannon",
  "SMG",
  "Shotgun",
  "Sniper",
  "Sniper_2",
];

import { Bullet } from "./Bullet";
import { BulletHit } from "./BulletHit";
import { CharacterController } from "./CharacterController";
import { Map } from "./Map";

const MAX_PLAYERS = 16;
const SPAWNS_PER_PLAYER = 3; // 1 initial spawn + 2 respawns (players have 3 lives)
const TOTAL_SPAWNS_NEEDED = MAX_PLAYERS * SPAWNS_PER_PLAYER; // 48

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const Experience = ({
  downgradedPerformance = false,
  onLaunch,
  gameReady = true,
}) => {
  const [players, setPlayers] = useState([]);
  const [lobbyComplete, setLobbyComplete] = useState(false);
  const isMobile = useMemo(() => isTouchDevice(), []);
  const spawnQueueRef = useRef([]);
  const spawnPointsRef = useRef(null);
  const scene = useThree((state) => state.scene);

  // Cache spawn points from the scene (only caches if spawns are found)
  const getSpawnPoints = useCallback(() => {
    if (spawnPointsRef.current && spawnPointsRef.current.length > 0) {
      return spawnPointsRef.current;
    }

    const spawns = [];
    for (let i = 0; i <= 15; i++) {
      const spawn = scene.getObjectByName(`spawn_${i}`);
      if (spawn) {
        spawns.push(spawn.position.clone());
      }
    }

    // Only cache if we found spawns (scene might not be ready yet)
    if (spawns.length > 0) {
      spawnPointsRef.current = spawns;
    }
    return spawns;
  }, [scene]);

  // Generate the spawn queue - called once when game starts
  const generateSpawnQueue = useCallback(() => {
    const spawnPoints = getSpawnPoints();
    console.log(
      "[Spawn] generateSpawnQueue called, found spawn points:",
      spawnPoints.length,
    );
    if (spawnPoints.length === 0) return;

    // Create array with each spawn point used once per round before repeating
    // Each batch is shuffled independently, ensuring all 16 points are used before any repeats
    const repeatedSpawns = [];
    const repeatsNeeded = Math.ceil(TOTAL_SPAWNS_NEEDED / spawnPoints.length);

    for (let i = 0; i < repeatsNeeded; i++) {
      repeatedSpawns.push(...shuffleArray(spawnPoints));
    }

    // Take only what we need (no final shuffle - preserves the round-robin guarantee)
    spawnQueueRef.current = repeatedSpawns.slice(0, TOTAL_SPAWNS_NEEDED);
    console.log(
      "[Spawn] Queue generated with",
      spawnQueueRef.current.length,
      "positions",
    );
  }, [getSpawnPoints]);

  // Track if spawn queue needs regeneration (set by first player detecting reset)
  const spawnQueueNeedsRegen = useRef(false);

  // Get next spawn position from the queue
  const getNextSpawn = useCallback(() => {
    console.log(
      "[Spawn] getNextSpawn called, queue length:",
      spawnQueueRef.current.length,
    );

    // Regenerate if flagged or exhausted
    if (spawnQueueNeedsRegen.current || spawnQueueRef.current.length === 0) {
      console.log("[Spawn] Regenerating spawn queue...");
      generateSpawnQueue();
      spawnQueueNeedsRegen.current = false;
    }

    // If queue has spawns, use it
    if (spawnQueueRef.current.length > 0) {
      const pos = spawnQueueRef.current.pop();
      console.log("[Spawn] Using queued position:", pos.x, pos.y, pos.z);
      return pos;
    }

    // Fallback: try to get spawn points directly (scene might be ready now)
    const spawns = getSpawnPoints();
    if (spawns.length > 0) {
      // Pick a random spawn point as fallback
      const pos = spawns[Math.floor(Math.random() * spawns.length)];
      console.log("[Spawn] Fallback random position:", pos.x, pos.y, pos.z);
      return pos;
    }

    // Last resort: return a default position
    console.warn("[Spawn] No spawn points found, using default position");
    return { x: 0, y: 1, z: 0 };
  }, [generateSpawnQueue, getSpawnPoints]);

  // Flag spawn queue for regeneration on game reset (called by first player detecting reset)
  const onGameReset = useCallback(() => {
    if (isHost()) {
      spawnQueueNeedsRegen.current = true;
    }
  }, []);

  const start = async () => {
    // Start the game - insertCoin shows lobby and resolves when host clicks Launch
    await insertCoin(
      {
        maxPlayersPerRoom: 16,
        reconnectGracePeriod: 5000,
      },
      // onLaunchCallback - fired when host clicks Launch
      () => {
        // Notify parent to show countdown
        onLaunch?.();
      },
    );

    // Lobby is complete - players have joined and host clicked Launch
    setLobbyComplete(true);

    // Create a joystick controller for each joining player (mobile only)
    onPlayerJoin((state) => {
      // Only create joystick UI on mobile/touch devices
      const joystick = isTouchDevice()
        ? new Joystick(state, {
            type: "angular",
            buttons: [{ id: "fire", label: "Fire" }],
          })
        : null;
      const newPlayer = { state, joystick };

      // Assign random weapon
      const randomWeapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
      state.setState("weapon", randomWeapon);
      state.setState("health", 100);
      state.setState("deaths", 0);
      state.setState("kills", 0);
      setPlayers((players) => [...players, newPlayer]);
      state.onQuit(() => {
        setPlayers((players) => players.filter((p) => p.state.id !== state.id));
      });
    });

    // Generate spawn queue after scene is ready (host only manages this)
    if (isHost()) {
      // Small delay to ensure scene objects are loaded
      setTimeout(() => {
        generateSpawnQueue();
      }, 100);
    }
  };

  useEffect(() => {
    start();
  }, []);

  const [bullets, setBullets] = useState([]);
  const [hits, setHits] = useState([]);

  const [networkBullets, setNetworkBullets] = useMultiplayerState(
    "bullets",
    [],
  );
  const [networkHits, setNetworkHits] = useMultiplayerState("hits", []);

  const onFire = (bullet) => {
    setBullets((bullets) => [...bullets, bullet]);
  };

  const onHit = (bulletId, position) => {
    setBullets((bullets) => bullets.filter((bullet) => bullet.id !== bulletId));
    setHits((hits) => [...hits, { id: bulletId, position }]);
  };

  const onExpired = (bulletId) => {
    setBullets((bullets) => bullets.filter((bullet) => bullet.id !== bulletId));
  };

  const onHitEnded = (hitId) => {
    setHits((hits) => hits.filter((h) => h.id !== hitId));
  };

  useEffect(() => {
    setNetworkBullets(bullets);
  }, [bullets]);

  useEffect(() => {
    setNetworkHits(hits);
  }, [hits]);

  const onKilled = (_victim, killer) => {
    const killerState = players.find((p) => p.state.id === killer).state;
    killerState.setState("kills", killerState.state.kills + 1);
  };

  if (!lobbyComplete) {
    return null;
  }

  return (
    <>
      <Map />
      {players.map(({ state, joystick }, index) => (
        <CharacterController
          key={state.id}
          state={state}
          userPlayer={state.id === myPlayer()?.id}
          joystick={joystick}
          isMobile={isMobile}
          onKilled={onKilled}
          onFire={onFire}
          getNextSpawn={getNextSpawn}
          onGameReset={onGameReset}
          downgradedPerformance={downgradedPerformance}
          gameReady={gameReady}
        />
      ))}
      {(isHost() ? bullets : networkBullets).map((bullet) => (
        <Bullet
          key={`bullet-${bullet.id}`}
          {...bullet}
          onHit={(position) => onHit(bullet.id, position)}
          onExpired={() => onExpired(bullet.id)}
        />
      ))}
      {(isHost() ? hits : networkHits).map((hit) => (
        <BulletHit
          key={`hit-${hit.id}`}
          {...hit}
          onEnded={() => onHitEnded(hit.id)}
        />
      ))}
      <Environment preset="sunset" />
    </>
  );
};
