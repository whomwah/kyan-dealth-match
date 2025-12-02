import { Loader, PerformanceMonitor, SoftShadows } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import { Suspense, useState, useCallback } from "react";
import { Experience } from "./components/Experience";
import { GameCountdown } from "./components/GameCountdown";
import { Leaderboard } from "./components/Leaderboard";

function App() {
  const [downgradedPerformance, setDowngradedPerformance] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [gameReady, setGameReady] = useState(false);

  const handleLaunch = useCallback(() => {
    setShowCountdown(true);
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    setGameReady(true);
  }, []);

  return (
    <>
      <Loader />
      {gameReady && <Leaderboard />}
      <GameCountdown
        isActive={showCountdown}
        onComplete={handleCountdownComplete}
      />
      <Canvas
        shadows
        camera={{ position: [0, 120, 0], fov: 45, near: 2 }}
        dpr={[1, 1.5]} // optimization to increase performance on retina/4k devices
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
              onLaunch={handleLaunch}
              gameReady={gameReady}
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
