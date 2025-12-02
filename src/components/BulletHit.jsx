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

const AnimatedSnowflake = ({ scale, target, speed, drift, color }) => {
  const ref = useRef();
  const time = useRef(0);
  const initialScale = useRef(scale);

  useFrame((_, delta) => {
    if (ref.current.scale.x > 0) {
      time.current += delta;

      // Gentle shrinking
      const newScale = initialScale.current * (1 - time.current * speed * 0.8);
      if (newScale > 0) {
        ref.current.scale.x =
          ref.current.scale.y =
          ref.current.scale.z =
            newScale;
      } else {
        ref.current.scale.x = ref.current.scale.y = ref.current.scale.z = 0;
      }

      // Move toward target with gentle floating motion
      ref.current.position.lerp(target, speed * 0.5);

      // Add gentle downward drift and side-to-side wobble (like falling snow)
      ref.current.position.y -= drift * delta * 0.5;
      ref.current.position.x +=
        Math.sin(time.current * 3 + drift * 10) * delta * 0.1;
      ref.current.position.z +=
        Math.cos(time.current * 2 + drift * 10) * delta * 0.1;
    }
  });

  return (
    <Instance ref={ref} scale={scale} position={[0, 0, 0]} color={color} />
  );
};

export const BulletHit = ({ nb = 120, position, onEnded }) => {
  const snowflakes = useMemo(
    () =>
      Array.from({ length: nb }, () => ({
        target: new Vector3(
          MathUtils.randFloat(-0.8, 0.8),
          MathUtils.randFloat(-0.3, 0.8), // Bias upward initially, then drift down
          MathUtils.randFloat(-0.8, 0.8),
        ),
        scale: MathUtils.randFloat(0.02, 0.08),
        speed: MathUtils.randFloat(0.08, 0.25),
        drift: MathUtils.randFloat(0.3, 1.0),
        color: snowColors[Math.floor(Math.random() * snowColors.length)],
      })),
    [nb],
  );

  useEffect(() => {
    setTimeout(() => {
      if (isHost()) {
        onEnded();
      }
    }, 800); // Slightly longer duration for snow to drift
  }, [onEnded]);

  return (
    <group position={[position.x, position.y, position.z]}>
      <Instances>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          toneMapped={false}
          emissive="#ffffff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
        {snowflakes.map((flake, i) => (
          <AnimatedSnowflake key={i} {...flake} />
        ))}
      </Instances>
    </group>
  );
};
