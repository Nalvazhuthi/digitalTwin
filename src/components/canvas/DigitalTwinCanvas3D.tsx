import React, { useRef, Suspense, useMemo, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Grid, Html, useGLTF, PivotControls } from "@react-three/drei";
import * as THREE from "three";
import type {
  Asset3DData,
  AssetTemplate,
  CanvasTool,
  ProjectMode,
} from "../../types/digitalTwin";
import CanvasCameraControls from "./CanvasCameraControls";
import type { CameraCommand } from "./CanvasCameraControls";
import PhysicsVisualizer from "./PhysicsVisualizer";
import {
  resolveAssetCollision,
  getAssetSize,
} from "../../utils/collision";
export type { CameraCommand } from "./CanvasCameraControls";

export interface PendingDrop {
  template: AssetTemplate;
  ndcX: number;
  ndcY: number;
  timestamp: number;
}

export interface DragPreview {
  template: AssetTemplate;
  ndcX: number;
  ndcY: number;
}

interface DigitalTwinCanvas3DProps {
  assets: Asset3DData[];
  selectedAssetId: string | null;
  onSelectAsset: (id: string) => void;
  onUpdateAsset?: (updatedAsset: Asset3DData) => void;
  pendingDrop: PendingDrop | null;
  dragPreview?: DragPreview | null;
  activeTool?: CanvasTool;
  cameraCommand?: CameraCommand | null;
  activeMode?: ProjectMode;
  isPlaying?: boolean;
  onAddAssetAtWorldPos: (
    template: AssetTemplate,
    worldX: number,
    worldZ: number
  ) => void;
}

// Preload 3D asset model GLBs for zero-latency instant drag preview
try {
  useGLTF.preload("/models/energymeter.glb");
} catch (e) {
  // Ignore preload error if file not ready
}

// Raycast Unprojection Handler Component inside R3F Canvas with Collision Resolution
const DropRaycastHandler: React.FC<{
  pendingDrop: PendingDrop | null;
  assets: Asset3DData[];
  onAddAssetAtWorldPos: (
    template: AssetTemplate,
    worldX: number,
    worldZ: number
  ) => void;
}> = ({ pendingDrop, assets, onAddAssetAtWorldPos }) => {
  const { camera } = useThree();
  const lastProcessedRef = useRef<number>(0);

  useEffect(() => {
    if (pendingDrop && pendingDrop.timestamp !== lastProcessedRef.current) {
      lastProcessedRef.current = pendingDrop.timestamp;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(
        new THREE.Vector2(pendingDrop.ndcX, pendingDrop.ndcY),
        camera
      );
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectionPoint = new THREE.Vector3();

      let targetX = 0;
      let targetZ = 0;
      if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
        targetX = intersectionPoint.x;
        targetZ = intersectionPoint.z;
      }

      // Resolve collision so dropped asset never spawns overlapping existing assets
      const assetSize = getAssetSize(pendingDrop.template);
      const resolved = resolveAssetCollision(
        null,
        targetX,
        targetZ,
        assetSize,
        assets
      );

      onAddAssetAtWorldPos(pendingDrop.template, resolved.x, resolved.z);
    }
  }, [pendingDrop, camera, assets, onAddAssetAtWorldPos]);

  return null;
};

// Live 3D Ghost Model Preview with Realtime Collision Detection
const DragPreviewMesh: React.FC<{
  dragPreview?: DragPreview | null;
  assets: Asset3DData[];
}> = ({ dragPreview, assets }) => {
  const { camera } = useThree();

  const previewInfo = useMemo(() => {
    if (!dragPreview) return null;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(
      new THREE.Vector2(dragPreview.ndcX, dragPreview.ndcY),
      camera
    );
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectionPoint = new THREE.Vector3();
    let targetX = 0;
    let targetZ = 0;
    if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
      targetX = intersectionPoint.x;
      targetZ = intersectionPoint.z;
    }

    const assetSize = getAssetSize(dragPreview.template);
    const resolved = resolveAssetCollision(null, targetX, targetZ, assetSize, assets);
    return {
      x: resolved.x,
      z: resolved.z,
      isColliding: resolved.isColliding,
      size: assetSize,
    };
  }, [dragPreview, camera, assets]);

  if (!dragPreview || !previewInfo) return null;

  const ringColor = previewInfo.isColliding ? "#f59e0b" : "#38a0c5";

  return (
    <group position={[previewInfo.x, 0, previewInfo.z]}>
      {/* Ghost 3D model */}
      <group>
        {dragPreview.template.modelUrl ? (
          <Suspense fallback={<DefaultMachineMesh isSelected={false} />}>
            <GLBModelMesh url={dragPreview.template.modelUrl} />
          </Suspense>
        ) : (
          <DefaultMachineMesh isSelected={false} />
        )}
      </group>

      {/* Dynamic Placement & Collision Bounding Guides */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.75, 0.88, 32]} />
        <meshBasicMaterial color={ringColor} opacity={0.8} transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[previewInfo.size.width, previewInfo.size.depth]} />
        <meshBasicMaterial color={ringColor} opacity={0.2} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// GLB 3D Model Renderer with Bounding Box Auto-Normalization
const GLBModelMesh: React.FC<{ url: string }> = ({ url }) => {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Normalize GLB model size to standard 1.4 unit CAD dimension
    const targetSize = 1.4;
    const scaleFactor = maxDim > 0 ? targetSize / maxDim : 1;
    clone.scale.setScalar(scaleFactor);

    // Center pivot at base
    const scaledBox = new THREE.Box3().setFromObject(clone);
    const center = scaledBox.getCenter(new THREE.Vector3());
    clone.position.sub(center);
    clone.position.y += (scaledBox.max.y - scaledBox.min.y) / 2;
    return clone;
  }, [scene]);

  return <primitive object={clonedScene} />;
};

// Default Parametric Machine Mesh
const DefaultMachineMesh: React.FC<{ isSelected: boolean }> = ({ isSelected }) => {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshStandardMaterial
          color={isSelected ? "#38a0c5" : "#ffffff"}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
        <meshStandardMaterial color="#38a0c5" metalness={0.5} />
      </mesh>
    </group>
  );
};

// 3D Asset Node Component with Interactive Drag & Collision Detection
const Asset3DNode: React.FC<{
  asset: Asset3DData;
  allAssets: Asset3DData[];
  isSelected: boolean;
  activeTool: CanvasTool;
  onSelect: () => void;
  onUpdateAsset?: (asset: Asset3DData) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}> = ({
  asset,
  allAssets,
  isSelected,
  activeTool,
  onSelect,
  onUpdateAsset,
  onDragStart,
  onDragEnd,
}) => {
  const { camera, gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [isContactingCollision, setIsContactingCollision] = useState(false);

  const posX = asset.x;
  const posZ = asset.y;
  const assetSize = useMemo(() => getAssetSize(asset), [asset]);

  // Pointer Movement Drag Handling on Ground Plane (Y = 0)
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    onSelect();

    if (activeTool === "pointer" && onUpdateAsset) {
      setIsDragging(true);
      onDragStart?.();
    }
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging || !onUpdateAsset) return;
    e.stopPropagation();

    const rect = gl.domElement.getBoundingClientRect();
    const nativeEv = e.nativeEvent as MouseEvent;
    const clientX = nativeEv.clientX;
    const clientY = nativeEv.clientY;

    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      // Resolve candidate position against all other assets to guarantee zero overlap!
      const resolved = resolveAssetCollision(
        asset.id,
        intersection.x,
        intersection.z,
        assetSize,
        allAssets
      );

      setIsContactingCollision(resolved.isColliding);
      onUpdateAsset({
        ...asset,
        x: resolved.x,
        y: resolved.z,
      });
    }
  };

  const handlePointerUp = (e: any) => {
    if (isDragging) {
      e.stopPropagation();
      setIsDragging(false);
      setIsContactingCollision(false);
      onDragEnd?.();
    }
  };

  const ringColor = isContactingCollision
    ? "#f59e0b"
    : isSelected
    ? "#38a0c5"
    : "#94a3b8";

  return (
    <group
      position={[posX, 0, posZ]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Pivot Controls Gizmo when asset is selected */}
      {isSelected && activeTool === "pointer" && onUpdateAsset ? (
        <PivotControls
          anchor={[0, 0, 0]}
          depthTest={false}
          scale={0.75}
          lineWidth={3}
          activeAxes={[true, false, true]} // Translate along X and Z floor axes
          disableRotations
          onDrag={(_, __, worldMatrix) => {
            const translation = new THREE.Vector3();
            translation.setFromMatrixPosition(worldMatrix);

            const resolved = resolveAssetCollision(
              asset.id,
              translation.x,
              translation.z,
              assetSize,
              allAssets
            );

            setIsContactingCollision(resolved.isColliding);
            onUpdateAsset({
              ...asset,
              x: resolved.x,
              y: resolved.z,
            });
          }}
          onDragEnd={() => {
            setIsContactingCollision(false);
            onDragEnd?.();
          }}
        >
          <group>
            {asset.modelUrl ? (
              <Suspense fallback={<DefaultMachineMesh isSelected={isSelected} />}>
                <GLBModelMesh url={asset.modelUrl} />
              </Suspense>
            ) : (
              <DefaultMachineMesh isSelected={isSelected} />
            )}
          </group>
        </PivotControls>
      ) : (
        <group>
          {asset.modelUrl ? (
            <Suspense fallback={<DefaultMachineMesh isSelected={isSelected} />}>
              <GLBModelMesh url={asset.modelUrl} />
            </Suspense>
          ) : (
            <DefaultMachineMesh isSelected={isSelected} />
          )}
        </group>
      )}

      {/* Ground Footprint Bounding Ring & Collision Indicator */}
      {(isSelected || isDragging) && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
            <planeGeometry args={[assetSize.width + 0.1, assetSize.depth + 0.1]} />
            <meshBasicMaterial
              color={ringColor}
              opacity={isContactingCollision ? 0.35 : 0.15}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry
              args={[
                Math.max(assetSize.width, assetSize.depth) / 2 + 0.05,
                Math.max(assetSize.width, assetSize.depth) / 2 + 0.18,
                32,
              ]}
            />
            <meshBasicMaterial
              color={ringColor}
              opacity={0.8}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Floating HTML Info Card Badge */}
      <Html position={[0, 2.4, 0]} center distanceFactor={14}>
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Main Card Badge */}
          <div
            style={{
              background: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.95)",
              border: isContactingCollision
                ? "2.5px solid #f59e0b"
                : isSelected
                ? "2.5px solid #38a0c5"
                : "1.5px solid #cbd5e1",
              boxShadow: isContactingCollision
                ? "0 6px 20px rgba(245, 158, 11, 0.3)"
                : "0 6px 20px rgba(0, 0, 0, 0.1)",
              borderRadius: "14px",
              padding: "8px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              cursor: "grab",
              whiteSpace: "nowrap",
              fontFamily: "Inter, sans-serif",
              userSelect: "none",
              transform: isSelected ? "scale(1.05)" : "scale(1)",
              transition: "all 0.2s ease",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#1d2024",
                letterSpacing: "-0.2px",
              }}
            >
              {asset.name}
            </div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: isContactingCollision
                  ? "#f59e0b"
                  : asset.status === "Running"
                  ? "#22c55e"
                  : "#38a0c5",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span style={{ fontSize: "8px" }}>●</span>{" "}
              {isContactingCollision ? "Collision Contact (Sliding)" : asset.status}
            </div>
          </div>

          {/* Vertical Connector Line Stem */}
          <div
            style={{
              width: "2px",
              height: "26px",
              backgroundColor: isContactingCollision
                ? "#f59e0b"
                : isSelected
                ? "#38a0c5"
                : "#94a3b8",
              transition: "background-color 0.2s ease",
            }}
          />

          {/* Anchor Dot at Model Connection Point */}
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: isContactingCollision
                ? "#f59e0b"
                : isSelected
                ? "#38a0c5"
                : "#64748b",
              marginTop: "-1px",
              boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.8)",
            }}
          />
        </div>
      </Html>
    </group>
  );
};

const DigitalTwinCanvas3D: React.FC<DigitalTwinCanvas3DProps> = ({
  assets,
  selectedAssetId,
  onSelectAsset,
  onUpdateAsset,
  pendingDrop,
  dragPreview,
  activeTool = "pointer",
  cameraCommand = null,
  activeMode = "flow",
  isPlaying = true,
  onAddAssetAtWorldPos,
}) => {
  const [isDraggingAsset, setIsDraggingAsset] = useState(false);
  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [5, 5, 5], fov: 30 }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
        gl={{ alpha: true }}
        shadows
      >
        <ambientLight intensity={0.9} />
        <directionalLight
          position={[8, 14, 8]}
          intensity={1.5}
          castShadow
        />
        <pointLight position={[-8, 8, -8]} intensity={0.4} />

        <CanvasCameraControls
          activeTool={activeTool}
          cameraCommand={cameraCommand}
          selectedAsset={selectedAsset}
          isDraggingAsset={isDraggingAsset}
        />

        <PhysicsVisualizer
          assets={assets}
          activeMode={activeMode}
          isPlaying={isPlaying}
        />

        <Grid
          infiniteGrid
          cellSize={1}
          cellThickness={0.8}
          cellColor="#cbd5e1"
          sectionSize={5}
          sectionThickness={1.2}
          sectionColor="#38a0c5"
          fadeDistance={50}
          fadeStrength={1.5}
          side={THREE.DoubleSide}
        />

        <DropRaycastHandler
          pendingDrop={pendingDrop}
          assets={assets}
          onAddAssetAtWorldPos={onAddAssetAtWorldPos}
        />

        <DragPreviewMesh dragPreview={dragPreview} assets={assets} />

        {assets.map((asset) => (
          <Asset3DNode
            key={asset.id}
            asset={asset}
            allAssets={assets}
            isSelected={selectedAssetId === asset.id}
            activeTool={activeTool}
            onSelect={() => onSelectAsset(asset.id)}
            onUpdateAsset={onUpdateAsset}
            onDragStart={() => setIsDraggingAsset(true)}
            onDragEnd={() => setIsDraggingAsset(false)}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default DigitalTwinCanvas3D;
