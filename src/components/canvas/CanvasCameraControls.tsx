import React, { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import type { Asset3DData, CanvasTool } from "../../types/digitalTwin";

export interface CameraCommand {
  type: "focus" | "reset" | "top" | "iso";
  targetAssetId?: string | null;
  timestamp: number;
}

interface CanvasCameraControlsProps {
  activeTool?: CanvasTool;
  cameraCommand?: CameraCommand | null;
  selectedAsset?: Asset3DData;
  isDraggingAsset?: boolean;
}

// Camera Presets & Smooth Focus Controller
const CameraController: React.FC<{
  cameraCommand: CameraCommand | null;
  selectedAsset: Asset3DData | undefined;
  controlsRef: React.RefObject<any>;
}> = ({ cameraCommand, selectedAsset, controlsRef }) => {
  const { camera } = useThree();
  const lastProcessedRef = useRef<number>(0);

  useEffect(() => {
    if (!cameraCommand || cameraCommand.timestamp === lastProcessedRef.current) return;
    lastProcessedRef.current = cameraCommand.timestamp;

    const controls = controlsRef.current;
    if (!controls) return;

    if (cameraCommand.type === "focus" && selectedAsset) {
      const targetPos = new THREE.Vector3(selectedAsset.x, 0.7, selectedAsset.y);
      const camPos = new THREE.Vector3(
        selectedAsset.x,
        selectedAsset.y + 3.0,
        selectedAsset.y + 4.5
      );
      controls.target.copy(targetPos);
      camera.position.copy(camPos);
      controls.update();
    } else if (cameraCommand.type === "reset") {
      controls.target.set(0, 0, 0);
      camera.position.set(5, 5, 5);
      controls.update();
    } else if (cameraCommand.type === "top") {
      const targetPos = selectedAsset
        ? new THREE.Vector3(selectedAsset.x, 0, selectedAsset.y)
        : new THREE.Vector3(0, 0, 0);
      controls.target.copy(targetPos);
      camera.position.set(targetPos.x, 12, targetPos.z + 0.001);
      controls.update();
    } else if (cameraCommand.type === "iso") {
      const targetPos = selectedAsset
        ? new THREE.Vector3(selectedAsset.x, 0, selectedAsset.y)
        : new THREE.Vector3(0, 0, 0);
      controls.target.copy(targetPos);
      camera.position.set(targetPos.x + 6, 6, targetPos.z + 6);
      controls.update();
    }
  }, [cameraCommand, selectedAsset, camera, controlsRef]);

  return null;
};

export const CanvasCameraControls: React.FC<CanvasCameraControlsProps> = ({
  activeTool = "pointer",
  cameraCommand = null,
  selectedAsset,
  isDraggingAsset = false,
}) => {
  const controlsRef = useRef<any>(null);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={!isDraggingAsset}
        enableDamping
        dampingFactor={0.05}
        zoomToCursor={true}
        screenSpacePanning={true}
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={1.0}
        maxDistance={35}
        mouseButtons={{
          LEFT: activeTool === "hand" ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: activeTool === "hand" ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
        }}
      />

      {/* Interactive 3D Orientation ViewCube Gizmo positioned cleanly inside visible viewport */}
      <GizmoHelper alignment="top-right" margin={[340, 140]}>
        <GizmoViewport
          axisColors={["#ef4444", "#22c55e", "#3b82f6"]}
          labelColor="#ffffff"
        />
      </GizmoHelper>

      <CameraController
        cameraCommand={cameraCommand}
        selectedAsset={selectedAsset}
        controlsRef={controlsRef}
      />
    </>
  );
};

export default CanvasCameraControls;
