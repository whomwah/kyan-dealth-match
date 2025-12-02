import { RigidBody, vec3 } from "@react-three/rapier";
import { isHost } from "playroomkit";
import { useEffect, useRef } from "react";
import { MeshBasicMaterial, LatheGeometry, Vector2 } from "three";
import { WEAPON_OFFSET } from "./CharacterController";

const BULLET_SPEED = 20;

const bulletMaterial = new MeshBasicMaterial({
  color: "#1a1a1a",
  toneMapped: false,
});

// Pre-load audio for cloning (avoids creating new Audio objects each time)
const rifleAudio = new Audio("/audios/rifle.mp3");

// Create plug shape using lathe geometry
const createPlugGeometry = () => {
  const points = [];
  // Flared base (pedestal)
  points.push(new Vector2(0, 0));
  points.push(new Vector2(0.09, 0));
  points.push(new Vector2(0.09, 0.02));
  points.push(new Vector2(0.08, 0.04));
  // Narrow neck
  points.push(new Vector2(0.04, 0.06));
  points.push(new Vector2(0.04, 0.08));
  points.push(new Vector2(0.04, 0.1));
  // Bulge out quickly
  points.push(new Vector2(0.08, 0.14));
  points.push(new Vector2(0.085, 0.18));
  // Maximum bulge
  points.push(new Vector2(0.09, 0.22));
  points.push(new Vector2(0.09, 0.26));
  // Taper gradually toward tip
  points.push(new Vector2(0.08, 0.29));
  points.push(new Vector2(0.06, 0.32));
  points.push(new Vector2(0.04, 0.34));
  points.push(new Vector2(0.02, 0.355));
  // Rounded tip
  points.push(new Vector2(0, 0.36));

  // Reduced segments from 16 to 10 for fast-moving bullet
  return new LatheGeometry(points, 10);
};

const plugGeometry = createPlugGeometry();

export const Bullet = ({ player, angle, position, onHit }) => {
  const rigidbody = useRef();

  useEffect(() => {
    // Clone pre-loaded audio instead of creating new Audio object
    const audio = rifleAudio.cloneNode();
    audio.play();
    const velocity = {
      x: Math.sin(angle) * BULLET_SPEED,
      y: 0,
      z: Math.cos(angle) * BULLET_SPEED,
    };

    rigidbody.current.setLinvel(velocity, true);
  }, [angle]);

  return (
    <group position={[position.x, position.y, position.z]} rotation-y={angle}>
      <group
        position-x={WEAPON_OFFSET.x}
        position-y={WEAPON_OFFSET.y}
        position-z={WEAPON_OFFSET.z}
      >
        <RigidBody
          ref={rigidbody}
          gravityScale={0}
          onIntersectionEnter={(e) => {
            if (isHost() && e.other.rigidBody.userData?.type !== "bullet") {
              rigidbody.current.setEnabled(false);
              onHit(vec3(rigidbody.current.translation()));
            }
          }}
          sensor
          userData={{
            type: "bullet",
            player,
            damage: 10,
          }}
        >
          <mesh
            position-z={0.25}
            material={bulletMaterial}
            castShadow
            rotation-x={Math.PI / 2}
            geometry={plugGeometry}
          />
        </RigidBody>
      </group>
    </group>
  );
};
