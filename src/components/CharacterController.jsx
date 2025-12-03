import { Billboard, CameraControls, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, vec3 } from "@react-three/rapier";
import { isHost } from "playroomkit";
import { useEffect, useRef, useState, useCallback } from "react";
import { CharacterSoldier } from "./CharacterSoldier";
const MOVEMENT_SPEED = 202;
const FIRE_RATE = 380;
export const MAX_LIVES = 3;
export const WEAPON_OFFSET = {
  x: -0.2,
  y: 1.4,
  z: 0.8,
};

export const CharacterController = ({
  state,
  joystick,
  userPlayer,
  isMobile,
  onKilled,
  onFire,
  getNextSpawn,
  onGameReset,
  downgradedPerformance,
  gameReady = true,
  ...props
}) => {
  const group = useRef();
  const deadAudioRef = useRef(null);
  const hurtAudioRef = useRef(null);
  const character = useRef();
  const rigidbody = useRef();
  const [animation, setAnimation] = useState("Idle");
  const [isMobileView, setIsMobileView] = useState(
    () => window.innerWidth < 1024,
  );
  const weapon = state.state.weapon || "AK";
  const lastShoot = useRef(0);
  const [firePressed, setFirePressed] = useState(false);
  const keysPressed = useRef({ w: false, a: false, s: false, d: false });
  const facingAngle = useRef(0); // Track which direction character is facing
  const impulseRef = useRef({ x: 0, y: 0, z: 0 }); // Reused for physics impulse

  // Keyboard controls for movement (WASD) and firing (Space) - desktop only
  useEffect(() => {
    if (!userPlayer || isMobile) return;

    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "a" || key === "s" || key === "d") {
        e.preventDefault();
        keysPressed.current[key] = true;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setFirePressed(true);
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === "w" || key === "a" || key === "s" || key === "d") {
        e.preventDefault();
        keysPressed.current[key] = false;
      }
      if (e.code === "Space") {
        setFirePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [userPlayer, isMobile]);

  // Cache window width check for camera distance calculations
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate movement angle from WASD keys (desktop only)
  // Camera looks from +Z toward origin, so:
  // W (forward) = -Z, S (backward) = +Z, A (left) = -X, D (right) = +X
  // The impulse uses sin(angle) for X and cos(angle) for Z
  // atan2(x, z) gives angle where 0 = +Z direction
  const getKeyboardAngle = useCallback(() => {
    if (isMobile) return null;
    const keys = keysPressed.current;

    let x = 0;
    let z = 0;
    if (keys.w) z -= 1;
    if (keys.s) z += 1;
    if (keys.a) x -= 1;
    if (keys.d) x += 1;

    if (x === 0 && z === 0) return null;
    return Math.atan2(x, z);
  }, [isMobile]);

  const spawnAtNextPosition = useCallback(() => {
    if (!getNextSpawn || !rigidbody.current) return;
    const spawnPos = getNextSpawn();
    if (spawnPos) {
      rigidbody.current.setTranslation(spawnPos);
    }
  }, [getNextSpawn]);

  useEffect(() => {
    if (isHost()) {
      // Small delay to ensure spawn queue is generated
      const timer = setTimeout(() => {
        spawnAtNextPosition();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [spawnAtNextPosition]);

  // Handle game reset - when eliminated becomes false, respawn the player
  useEffect(() => {
    if (
      isHost() &&
      state.state.eliminated === false &&
      state.state.dead === false &&
      state.state.health === 100
    ) {
      // This indicates a game reset - re-enable and respawn
      if (rigidbody.current && !rigidbody.current.isEnabled()) {
        // Regenerate spawn queue for the new game
        if (onGameReset) {
          onGameReset();
        }
        rigidbody.current.setEnabled(true);
        spawnAtNextPosition();
      }
    }
  }, [
    state.state.eliminated,
    state.state.dead,
    state.state.health,
    onGameReset,
    spawnAtNextPosition,
  ]);

  // Pre-load audio objects once per component instance
  useEffect(() => {
    deadAudioRef.current = new Audio("/audios/dead.mp3");
    deadAudioRef.current.volume = 0.5;
    hurtAudioRef.current = new Audio("/audios/hurt.mp3");
    hurtAudioRef.current.volume = 0.4;
  }, []);

  useEffect(() => {
    if (state.state.dead && deadAudioRef.current) {
      deadAudioRef.current.currentTime = 0;
      deadAudioRef.current.play().catch(() => {});
    }
  }, [state.state.dead]);

  useEffect(() => {
    if (state.state.health < 100 && hurtAudioRef.current) {
      hurtAudioRef.current.currentTime = 0;
      hurtAudioRef.current.play().catch(() => {});
    }
  }, [state.state.health]);

  useFrame((_, delta) => {
    // CAMERA FOLLOW
    if (controls.current) {
      const cameraDistanceY = isMobileView ? 16 : 20;
      const cameraDistanceZ = isMobileView ? 12 : 16;
      const playerWorldPos = vec3(rigidbody.current.translation());
      controls.current.setLookAt(
        playerWorldPos.x,
        playerWorldPos.y + (state.state.dead ? 12 : cameraDistanceY),
        playerWorldPos.z + (state.state.dead ? 2 : cameraDistanceZ),
        playerWorldPos.x,
        playerWorldPos.y + 1.5,
        playerWorldPos.z,
        true,
      );
    }

    if (state.state.dead) {
      setAnimation("Death");
      return;
    }

    // Freeze players during countdown
    if (!gameReady) {
      setAnimation("Idle");
      return;
    }

    // Determine input based on whether this is the local player
    let angle = null;
    let isMoving = false;
    let isFiring = false;

    if (userPlayer) {
      // Local player: capture input from joystick (mobile) or keyboard (desktop)
      if (isMobile && joystick) {
        const joystickAngle = joystick.angle();
        // Note: angle can be 0 (valid direction), so check isJoystickPressed separately
        const joystickPressed = joystick.isJoystickPressed();
        angle = joystickPressed ? joystickAngle : null;
        isMoving = joystickPressed && joystickAngle !== undefined;
        isFiring = joystick?.isPressed("fire");
      } else if (!isMobile) {
        angle = getKeyboardAngle();
        isMoving = angle !== null;
        isFiring = firePressed;
      }

      // Non-host players sync their input to state for the host to read
      if (!isHost()) {
        state.setState("input", {
          angle: angle,
          isMoving: isMoving,
          isFiring: isFiring,
        });
      }
    } else {
      // Not the local player - only host needs to read input from state
      if (isHost()) {
        const input = state.getState("input");
        if (input) {
          angle = input.angle;
          isMoving = input.isMoving;
          isFiring = input.isFiring;
        }
      }
    }

    // Host calculates animation/rotation for all players
    // Non-host only calculates for their own player, reads synced values for others
    const shouldCalculateLocally = isHost() || userPlayer;

    let newAnimation = "Idle";

    if (shouldCalculateLocally) {
      if (isMoving && angle !== null) {
        newAnimation = "Run";
        character.current.rotation.y = angle;
        facingAngle.current = angle; // Remember facing direction

        // Only host applies physics impulse
        if (isHost()) {
          impulseRef.current.x = Math.sin(angle) * MOVEMENT_SPEED * delta;
          impulseRef.current.y = 0;
          impulseRef.current.z = Math.cos(angle) * MOVEMENT_SPEED * delta;
          rigidbody.current.applyImpulse(impulseRef.current, true);
        }
      }

      // Handle firing
      if (isFiring) {
        // Use current movement angle, or facing direction if standing still
        const fireAngle = angle !== null ? angle : facingAngle.current;
        // fire
        newAnimation = isMoving && angle !== null ? "Run_Shoot" : "Idle_Shoot";
        if (isHost()) {
          if (Date.now() - lastShoot.current > FIRE_RATE) {
            lastShoot.current = Date.now();
            const newBullet = {
              id: state.id + "-" + +new Date(),
              position: vec3(rigidbody.current.translation()),
              angle: fireAngle,
              player: state.id,
            };
            onFire(newBullet);
          }
        }
      }

      setAnimation(newAnimation);
    }

    // Host syncs position, animation, and rotation to state
    if (isHost()) {
      state.setState("pos", rigidbody.current.translation());
      state.setState("animation", newAnimation);
      state.setState("rotation", character.current.rotation.y);
    } else {
      // Non-host reads position from state for all players
      const pos = state.getState("pos");
      if (pos) {
        rigidbody.current.setTranslation(pos);
      }

      // Non-host reads animation and rotation from state for remote players only
      if (!userPlayer) {
        const syncedAnimation = state.getState("animation");
        if (syncedAnimation) {
          setAnimation(syncedAnimation);
        }
        const syncedRotation = state.getState("rotation");
        if (syncedRotation !== undefined && character.current) {
          character.current.rotation.y = syncedRotation;
        }
      }
    }
  });
  const controls = useRef();
  const directionalLight = useRef();

  useEffect(() => {
    if (character.current && userPlayer) {
      directionalLight.current.target = character.current;
    }
  }, [character.current]);

  return (
    <group {...props} ref={group}>
      {userPlayer && <CameraControls ref={controls} />}
      <RigidBody
        ref={rigidbody}
        colliders={false}
        linearDamping={12}
        lockRotations
        type={isHost() ? "dynamic" : "kinematicPosition"}
        onIntersectionEnter={({ other }) => {
          if (
            isHost() &&
            other.rigidBody.userData.type === "bullet" &&
            state.state.health > 0
          ) {
            const newHealth =
              state.state.health - other.rigidBody.userData.damage;
            if (newHealth <= 0) {
              const newDeaths = state.state.deaths + 1;
              state.setState("deaths", newDeaths);
              state.setState("dead", true);
              state.setState("health", 0);
              rigidbody.current.setEnabled(false);
              onKilled(state.id, other.rigidBody.userData.player);

              // Check if player still has lives remaining
              const livesRemaining = MAX_LIVES - newDeaths;
              if (livesRemaining > 0) {
                // Respawn after delay
                setTimeout(() => {
                  spawnAtNextPosition();
                  rigidbody.current.setEnabled(true);
                  state.setState("health", 100);
                  state.setState("dead", false);
                }, 2000);
              } else {
                // Player is eliminated - mark as eliminated and don't respawn
                state.setState("eliminated", true);
              }
            } else {
              state.setState("health", newHealth);
            }
          }
        }}
      >
        <PlayerInfo state={state.state} />
        <group ref={character}>
          <CharacterSoldier
            color={state.state.profile?.color}
            animation={animation}
            weapon={weapon}
          />
        </group>
        {userPlayer && (
          // Finally I moved the light to follow the player
          // This way we won't need to calculate ALL the shadows but only the ones
          // that are in the camera view
          <directionalLight
            ref={directionalLight}
            position={[25, 18, -25]}
            intensity={0.3}
            castShadow={!downgradedPerformance} // Disable shadows on low-end devices
            shadow-camera-near={0}
            shadow-camera-far={100}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />
        )}
        <CapsuleCollider args={[0.7, 0.6]} position={[0, 1.28, 0]} />
      </RigidBody>
    </group>
  );
};

const PlayerInfo = ({ state }) => {
  const health = state.health;
  const name = state.profile.name;
  return (
    <Billboard position-y={2.5}>
      <Text position-y={0.2} fontSize={0.2} textAlign="center">
        {name.toUpperCase().trim()} 🎄
      </Text>
      <mesh position-z={-0.1} position-y={-0.05}>
        <planeGeometry args={[0.8, 0.12]} />
        <meshBasicMaterial color="#0a4d0a" transparent opacity={0.6} />
      </mesh>
      <mesh
        scale-x={health / 100}
        position-x={-0.4 * (1 - health / 100)}
        position-y={-0.05}
      >
        <planeGeometry args={[0.8, 0.12]} />
        <meshBasicMaterial color="#ff2a2a" />
      </mesh>
      <mesh
        scale-x={health / 100}
        position-x={-0.4 * (1 - health / 100)}
        position-y={-0.05}
        position-z={0.01}
      >
        <planeGeometry args={[0.8, 0.12]} />
        <meshBasicMaterial color="#ffff00" transparent opacity={0.3} />
      </mesh>
    </Billboard>
  );
};
