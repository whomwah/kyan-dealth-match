import { Instance, Instances } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { isHost } from "playroomkit";
import { useEffect, useMemo, useRef } from "react";
import { Color, MathUtils, Vector3 } from "three";

// Festive snow colors - white with a hint of ice blue
const snowColors = [
  new Color("#ffffff").multiplyScalar(2),
  new Color("#e8f4ff").multiplyScalar(2),
  new Color("#d4eaff").multiplyScalar(1.8),
  new Color("#c9e4ff").multiplyScalar(1.5),
];

export const BulletHit = ({ nb = 50, position, onEnded }) => {
  const groupRef = useRef();
  const instanceRefs = useRef([]);
  const time = useRef(0);

  const snowflakes = useMemo(
    () =>
      Array.from({ length: nb }, () => ({
        target: new Vector3(
          MathUtils.randFloat(-0.8, 0.8),
          MathUtils.randFloat(-0.3, 0.8),
          MathUtils.randFloat(-0.8, 0.8),
        ),
        initialScale: MathUtils.randFloat(0.02, 0.08),
        speed: MathUtils.randFloat(0.08, 0.25),
        drift: MathUtils.randFloat(0.3, 1.0),
        color: snowColors[Math.floor(Math.random() * snowColors.length)],
        // Track individual time offset for variety
        timeOffset: MathUtils.randFloat(0, Math.PI * 2),
      })),
    [nb],
  );

  // Single useFrame to update all instances
  useFrame((_, delta) => {
    time.current += delta;

    for (let i = 0; i < instanceRefs.current.length; i++) {
      const instance = instanceRefs.current[i];
      if (!instance || instance.scale.x <= 0) continue;

      const flake = snowflakes[i];
      const elapsed = time.current;

      // Faster shrinking
      const newScale = flake.initialScale * (1 - elapsed * flake.speed * 2.5);
      if (newScale <= 0) {
        instance.scale.setScalar(0);
        continue;
      }

      instance.scale.setScalar(newScale);
      instance.position.lerp(flake.target, flake.speed * 0.5);

      // Add gentle downward drift and side-to-side wobble
      instance.position.y -= flake.drift * delta * 0.5;
      instance.position.x +=
        Math.sin(elapsed * 3 + flake.timeOffset) * delta * 0.1;
      instance.position.z +=
        Math.cos(elapsed * 2 + flake.timeOffset) * delta * 0.1;
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isHost()) {
        onEnded();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [onEnded]);

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <Instances>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          toneMapped={false}
          emissive="#ffffff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
        {snowflakes.map((flake, i) => (
          <Instance
            key={i}
            ref={(el) => (instanceRefs.current[i] = el)}
            scale={flake.initialScale}
            position={[0, 0, 0]}
            color={flake.color}
          />
        ))}
      </Instances>
    </group>
  );
};
