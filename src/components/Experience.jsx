import { Environment, PerspectiveCamera } from "@react-three/drei";
import { isStreamScreen, myPlayer, useMultiplayerState } from "playroomkit";
import { useEffect, useState } from "react";

import { Bullet } from "./Bullet";
import { BulletHit } from "./BulletHit";
import { CharacterController } from "./CharacterController";
import { Map } from "./Map";

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

export const Experience = ({
  downgradedPerformance = false,
  players,
  setPlayers,
}) => {
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
    const killerState = players.find((p) => p.state.id === killer)?.state;
    if (killerState) {
      killerState.setState("kills", killerState.state.kills + 1);
    }
  };

  // Filter out players without valid profiles (prevents ghost players)
  const validPlayers = players.filter(({ state }) => state.state.profile?.name);

  // Check if this is the stream screen (no local player)
  const isStream = isStreamScreen();

  return (
    <>
      {/* Fixed overhead camera for stream screen to show entire map */}
      {isStream && (
        <PerspectiveCamera
          makeDefault
          position={[0, 35, 25]}
          fov={45}
          near={1}
          far={200}
          rotation={[-Math.PI / 3, 0, 0]}
        />
      )}
      <Map />
      {validPlayers.map(({ state, joystick }, index) => (
        <CharacterController
          key={state.id}
          state={state}
          userPlayer={state.id === myPlayer()?.id}
          joystick={joystick}
          onKilled={onKilled}
          onFire={onFire}
          downgradedPerformance={downgradedPerformance}
        />
      ))}
      {(isStreamScreen() ? bullets : networkBullets).map((bullet) => (
        <Bullet
          key={bullet.id}
          {...bullet}
          onHit={(position) => onHit(bullet.id, position)}
        />
      ))}
      {(isStreamScreen() ? hits : networkHits).map((hit) => (
        <BulletHit key={hit.id} {...hit} onEnded={() => onHitEnded(hit.id)} />
      ))}
      <Environment preset="sunset" />
    </>
  );
};
