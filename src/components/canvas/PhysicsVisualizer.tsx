import React, { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { Asset3DData, ProjectMode } from "../../types/digitalTwin";

interface PhysicsVisualizerProps {
  assets: Asset3DData[];
  activeMode: ProjectMode;
  isPlaying: boolean;
}

const BOX_SIZE = 0.38;
const BOX_HEIGHT = 0.30;
const BED_HEIGHT = 0.55;
const ROLLER_RADIUS = 0.048;
const CONVEYOR_LENGTH = 6.0;

// Individual Cargo Box simulated with full 3D Rapier RigidBody dynamics
const PhysicalCargoBox: React.FC<{
  id: number;
  startX: number;
  spawnY: number;
  railZ: number;
  endX: number;
  conveyorSpeed: number;
  isPlaying: boolean;
  color: string;
}> = ({ startX, spawnY, railZ, endX, conveyorSpeed, isPlaying, color }) => {
  const rbRef = useRef<RapierRigidBody>(null);

  useFrame(() => {
    if (!isPlaying || !rbRef.current) return;
    const pos = rbRef.current.translation();

    // While on the conveyor bed, actively propel forward along the conveyor
    if (pos.x < endX) {
      const curLin = rbRef.current.linvel();
      rbRef.current.setLinvel(
        { x: conveyorSpeed, y: curLin.y, z: curLin.z },
        true
      );
      // While on the stable portion of the conveyor, keep level
      if (pos.x < endX - 0.25) {
        rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
    // Once pos.x >= endX, Rapier takes over completely with 100% natural Newtonian physics:
    // gravity tumble, lip torque, airborne arc, floor impact, bounce, friction & box-to-box stacking!
  });

  return (
    <RigidBody
      ref={rbRef}
      colliders="cuboid"
      position={[startX, spawnY, railZ]}
      mass={6.0}
      friction={0.65}
      restitution={0.25}
      linearDamping={0.1}
      angularDamping={0.2}
      canSleep={false}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BOX_SIZE, BOX_HEIGHT, BOX_SIZE]} />
        <meshStandardMaterial
          color={color || "#0284c7"}
          metalness={0.2}
          roughness={0.45}
        />
      </mesh>
    </RigidBody>
  );
};

// ──────────────────────────────────────────────
// Realistic Industrial Roller Conveyor Line with Rapier 3D
// ──────────────────────────────────────────────
const RealisticConveyorLine: React.FC<{
  centerX: number;
  centerZ: number;
  speedRpm: number;
  isPlaying: boolean;
  color: string;
}> = ({ centerX, centerZ, speedRpm, isPlaying, color }) => {
  const rollersGroupRef = useRef<THREE.Group>(null);

  const startX = centerX - CONVEYOR_LENGTH / 2;
  const endX = centerX + CONVEYOR_LENGTH / 2;
  const railZ = centerZ;
  const topOfRollers = BED_HEIGHT + ROLLER_RADIUS;
  const spawnY = topOfRollers + BOX_HEIGHT / 2 + 0.05;

  const angularSpeed = ((speedRpm || 1200) / 60) * (2 * Math.PI) * 0.05;
  const conveyorSpeed = Math.max(0.6, angularSpeed * 0.28);

  const [boxIds, setBoxIds] = useState<number[]>([1]);
  const nextIdRef = useRef(2);

  // Periodic box spawner
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setBoxIds((prev) => {
        // Keep up to 8 boxes in the scene for optimal physics performance
        const nextId = nextIdRef.current++;
        if (prev.length >= 8) {
          return [...prev.slice(1), nextId];
        }
        return [...prev, nextId];
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Visual roller positions
  const rollerPositions = useMemo(() => {
    const count = 24;
    const step = CONVEYOR_LENGTH / (count - 1);
    return Array.from({ length: count }, (_, i) => startX + i * step);
  }, [startX]);

  // Leg positions
  const legPositions = useMemo(
    () => [startX + 0.35, centerX, endX - 0.35],
    [startX, centerX, endX]
  );

  useFrame((_, delta) => {
    if (!isPlaying) return;
    const dt = Math.min(delta, 0.033);

    // Visual rotation of steel rollers
    if (rollersGroupRef.current) {
      for (const child of rollersGroupRef.current.children) {
        child.rotation.z -= dt * angularSpeed * 2.0;
      }
    }
  });

  return (
    <group>
      {/* ── Rapier Colliders for Conveyor Geometry ── */}
      {/* Conveyor Bed surface collider (top surface at topOfRollers) */}
      <CuboidCollider
        args={[CONVEYOR_LENGTH / 2, 0.04, 0.34]}
        position={[centerX, topOfRollers - 0.04, railZ]}
        friction={0.5}
        restitution={0.1}
      />

      {/* Guide Rails Colliders (prevent box from slipping off sides) */}
      <CuboidCollider
        args={[CONVEYOR_LENGTH / 2, 0.12, 0.02]}
        position={[centerX, topOfRollers + 0.08, railZ - 0.36]}
      />
      <CuboidCollider
        args={[CONVEYOR_LENGTH / 2, 0.12, 0.02]}
        position={[centerX, topOfRollers + 0.08, railZ + 0.36]}
      />

      {/* ── Structural Visuals ── */}
      {/* Legs */}
      {legPositions.map((lx, idx) => (
        <group key={`leg-${idx}`} position={[lx, 0, railZ]}>
          <mesh position={[0, BED_HEIGHT / 2, -0.36]} castShadow>
            <boxGeometry args={[0.06, BED_HEIGHT, 0.06]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, BED_HEIGHT / 2, 0.36]} castShadow>
            <boxGeometry args={[0.06, BED_HEIGHT, 0.06]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.02, -0.36]}>
            <cylinderGeometry args={[0.06, 0.07, 0.04, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.02, 0.36]}>
            <cylinderGeometry args={[0.06, 0.07, 0.04, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.04, 0.04, 0.68]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Side Rails Visual */}
      <group position={[centerX, BED_HEIGHT, railZ]}>
        <mesh position={[0, 0, -0.35]} castShadow>
          <boxGeometry args={[CONVEYOR_LENGTH + 0.1, 0.12, 0.05]} />
          <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.35]} castShadow>
          <boxGeometry args={[CONVEYOR_LENGTH + 0.1, 0.12, 0.05]} />
          <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.11, -0.37]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, CONVEYOR_LENGTH + 0.1, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.11, 0.37]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, CONVEYOR_LENGTH + 0.1, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* Motor */}
      <group position={[startX - 0.15, BED_HEIGHT, railZ - 0.48]}>
        <mesh castShadow>
          <boxGeometry args={[0.35, 0.28, 0.25]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.18, 0, 0.08]}>
          <boxGeometry args={[0.12, 0.24, 0.12]} />
          <meshStandardMaterial color="#f97316" metalness={0.4} roughness={0.3} />
        </mesh>
        <mesh position={[0.22, 0.18, 0.14]}>
          <boxGeometry args={[0.08, 0.08, 0.06]} />
          <meshStandardMaterial color="#ef4444" metalness={0.2} roughness={0.4} />
        </mesh>
      </group>

      {/* Steel Rollers */}
      <group ref={rollersGroupRef}>
        {rollerPositions.map((rx, idx) => (
          <group key={`roller-${idx}`} position={[rx, BED_HEIGHT, railZ]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[ROLLER_RADIUS, ROLLER_RADIUS, 0.66, 20]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.12} />
            </mesh>
            <mesh position={[0, 0, -0.34]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.052, 0.052, 0.02, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} />
            </mesh>
            <mesh position={[0, 0, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.052, 0.052, 0.02, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.049, 0.18]}>
              <boxGeometry args={[0.016, 0.005, 0.08]} />
              <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.3} />
            </mesh>
          </group>
        ))}
      </group>

      {/* End Lip Plate */}
      <mesh position={[endX + 0.02, BED_HEIGHT - 0.03, railZ]} castShadow>
        <boxGeometry args={[0.04, 0.08, 0.68]} />
        <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* ── Active Rapier Dynamic Cargo Boxes ── */}
      {boxIds.map((id) => (
        <PhysicalCargoBox
          key={id}
          id={id}
          startX={startX + 0.3}
          spawnY={spawnY}
          railZ={railZ}
          endX={endX}
          conveyorSpeed={conveyorSpeed}
          isPlaying={isPlaying}
          color={color}
        />
      ))}
    </group>
  );
};

// ──────────────────────────────────────────────
// PhysicsVisualizer Container with Rapier Physics World
// ──────────────────────────────────────────────
export const PhysicsVisualizer: React.FC<PhysicsVisualizerProps> = ({
  assets,
  activeMode,
  isPlaying,
}) => {
  const isPhysicsMode = activeMode === "physics";

  const conveyorSystems = useMemo(() => {
    if (assets.length === 0) {
      return [
        {
          id: "default-conveyor-0",
          centerX: 0,
          centerZ: 0,
          speedRpm: 1200,
          color: "#0284c7",
        },
      ];
    }
    return assets.map((asset, index) => ({
      id: `conveyor-${asset.id}-${index}`,
      centerX: asset.x,
      centerZ: asset.y,
      speedRpm: asset.speedRpm ?? 1200,
      color: index % 2 === 0 ? "#0284c7" : "#0ea5e9",
    }));
  }, [assets]);

  return (
    <React.Suspense fallback={null}>
      <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
        {/* Infinite Floor Collider at y = 0 */}
        <CuboidCollider
          args={[60, 0.5, 60]}
          position={[0, -0.5, 0]}
          friction={0.7}
          restitution={0.2}
        />

        {/* Industrial Conveyors & Active Falling Rigid Bodies */}
        {conveyorSystems.map((sys) => (
          <RealisticConveyorLine
            key={sys.id}
            centerX={sys.centerX}
            centerZ={sys.centerZ}
            speedRpm={sys.speedRpm}
            isPlaying={isPlaying}
            color={sys.color}
          />
        ))}

        {/* Physics Debug Wireframes and Overlays in Physics Mode */}
        {isPhysicsMode &&
          assets.map((asset) => {
            const mass = asset.mass ?? 15;
            const bodyType = asset.bodyType ?? "fixed";
            const friction = asset.friction ?? 0.4;
            const isFixed = bodyType === "fixed";

            return (
              <group key={`physics-${asset.id}`} position={[asset.x, 0.7, asset.y]}>
                <mesh>
                  <boxGeometry args={[1.5, 1.45, 1.5]} />
                  <meshBasicMaterial
                    color={isFixed ? "#0284c7" : "#22c55e"}
                    wireframe
                    transparent
                    opacity={0.7}
                  />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.69, 0]}>
                  <planeGeometry args={[1.6, 1.6]} />
                  <meshBasicMaterial
                    color={isFixed ? "#38a0c5" : "#22c55e"}
                    transparent
                    opacity={0.25}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <Html position={[0, -0.9, 0]} center distanceFactor={14}>
                  <div
                    style={{
                      background: "rgba(15, 23, 42, 0.88)",
                      border: "1px solid #38a0c5",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                      pointerEvents: "none",
                    }}
                  >
                    <span style={{ color: "#38a0c5" }}>⚛</span>
                    <span>{mass}kg</span>
                    <span style={{ color: "#94a3b8" }}>|</span>
                    <span style={{ textTransform: "capitalize", color: "#22c55e" }}>
                      {bodyType}
                    </span>
                    <span style={{ color: "#94a3b8" }}>|</span>
                    <span>µ={friction}</span>
                  </div>
                </Html>
              </group>
            );
          })}
      </Physics>
    </React.Suspense>
  );
};

export default PhysicsVisualizer;
