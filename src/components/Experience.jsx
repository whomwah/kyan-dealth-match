import { Environment } from "@react-three/drei";
import {
  Joystick,
  insertCoin,
  isHost,
  myPlayer,
  onPlayerJoin,
  useMultiplayerState,
} from "playroomkit";
import { useEffect, useState, useMemo } from "react";

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

export const Experience = ({ downgradedPerformance = false }) => {
  const [players, setPlayers] = useState([]);
  const [ready, setReady] = useState(false);
  const isMobile = useMemo(() => isTouchDevice(), []);

  const start = async () => {
    // Start the game
    await insertCoin({ maxPlayersPerRoom: 10 });

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

    setReady(true);
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

  if (!ready) {
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
          downgradedPerformance={downgradedPerformance}
        />
      ))}
      {(isHost() ? bullets : networkBullets).map((bullet) => (
        <Bullet
          key={bullet.id}
          {...bullet}
          onHit={(position) => onHit(bullet.id, position)}
        />
      ))}
      {(isHost() ? hits : networkHits).map((hit) => (
        <BulletHit key={hit.id} {...hit} onEnded={() => onHitEnded(hit.id)} />
      ))}
      <Environment preset="sunset" />
    </>
  );
};
