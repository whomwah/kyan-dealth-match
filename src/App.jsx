import { Loader, PerformanceMonitor, SoftShadows } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import {
  insertCoin,
  isStreamScreen,
  onPlayerJoin,
  Joystick,
} from "playroomkit";
import { Suspense, useState, useEffect } from "react";
import { ControllerUI } from "./components/ControllerUI";
import { Experience } from "./components/Experience";
import { Leaderboard } from "./components/Leaderboard";
import { WEAPONS } from "./components/Experience";

function App() {
  const [downgradedPerformance, setDowngradedPerformance] = useState(false);
  const [isStream, setIsStream] = useState(null); // null = loading, true = stream, false = controller
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const init = async () => {
      // Start the game - must complete before checking isStreamScreen
      await insertCoin({ streamMode: true });

      // Now we can check if this is the stream screen
      const streamScreen = isStreamScreen();
      setIsStream(streamScreen);

      // Set up player join handling
      onPlayerJoin((state) => {
        // Only create joystick UI on controller screens (phones), not on the stream screen
        const joystick = !streamScreen
          ? new Joystick(state, {
              type: "angular",
              buttons: [{ id: "fire", label: "Fire" }],
            })
          : null;

        const newPlayer = { state, joystick };

        // Assign random weapon
        const randomWeapon =
          WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
        state.setState("weapon", randomWeapon);
        state.setState("health", 100);
        state.setState("deaths", 0);
        state.setState("kills", 0);

        setPlayers((players) => [...players, newPlayer]);

        state.onQuit(() => {
          setPlayers((players) =>
            players.filter((p) => p.state.id !== state.id),
          );
        });
      });
    };

    init();
  }, []);

  // Loading state while waiting for insertCoin
  if (isStream === null) {
    return <Loader />;
  }

  // Controller screen (phone) - show only joystick and personal stats
  if (!isStream) {
    return <ControllerUI />;
  }

  // Stream screen (big screen/TV) - show full game with leaderboard
  return (
    <>
      <Loader />
      <Leaderboard />
      <Canvas
        shadows
        camera={{ position: [0, 30, 0], fov: 30, near: 2 }}
        dpr={[1, 1.5]} // optimisation to increase performance on retina/4k devices
      >
        <color attach="background" args={["#242424"]} />
        <SoftShadows size={42} />

        <PerformanceMonitor
          // Detect low performance devices
          onDecline={(fps) => {
            setDowngradedPerformance(true);
          }}
        />
        <Suspense>
          <Physics>
            <Experience
              downgradedPerformance={downgradedPerformance}
              players={players}
              setPlayers={setPlayers}
            />
          </Physics>
        </Suspense>
        {!downgradedPerformance && (
          // disable the postprocessing on low-end devices
          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={1} intensity={1.5} mipmapBlur />
          </EffectComposer>
        )}
      </Canvas>
    </>
  );
}

export default App;
