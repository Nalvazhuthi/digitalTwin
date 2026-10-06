import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DigitalTwinCanvas3D from "../../components/canvas/DigitalTwinCanvas3D";
import type {
  PendingDrop,
  CameraCommand,
} from "../../components/canvas/DigitalTwinCanvas3D";
import ProjectNavbar from "../../components/project/ProjectNavbar/ProjectNavbar";
import AssetsPanel from "../../components/project/AssetsPanel/AssetsPanel";
import PropertiesPanel from "../../components/project/PropertiesPanel/PropertiesPanel";
import CanvasToolbar from "../../components/project/CanvasToolbar/CanvasToolbar";
import type {
  Asset3DData,
  AssetTemplate,
  ProjectMode,
  CanvasTool,
} from "../../types/digitalTwin";
import styles from "./ProjectDetail.module.scss";

const ENERGYMETER_GLB_URL = "/models/energymeter.glb";

const ASSET_TEMPLATES: AssetTemplate[] = [
  {
    typeId: "energymeter",
    name: "Energy Meter",
    category: "Machines",
    description: "3D Power Monitor",
    modelUrl: ENERGYMETER_GLB_URL,
    isGlb: true,
  },
];

const DEFAULT_ASSETS: Asset3DData[] = [];

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // State Management
  const [activeMode, setActiveMode] = useState<ProjectMode>("flow");
  const [isPlaying, setIsPlaying] = useState(true);
  const [seconds, setSeconds] = useState(581); // 00:09:41
  const [activeTool, setActiveTool] = useState<CanvasTool>("pointer");
  const [placedAssets, setPlacedAssets] = useState<Asset3DData[]>(DEFAULT_ASSETS);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);

  // Live 3D Drag Preview States
  const [activeDragTemplate, setActiveDragTemplate] = useState<AssetTemplate | null>(null);
  const [dragPreviewPos, setDragPreviewPos] = useState<{ ndcX: number; ndcY: number } | null>(null);

  // Camera Presets Command State
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>(null);

  const handleCameraPreset = (type: "focus" | "reset" | "top" | "iso") => {
    setCameraCommand({
      type,
      targetAssetId: selectedAssetId,
      timestamp: Date.now(),
    });
  };

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Global Viewport Keyboard Hotkeys (F: Focus, V: Pointer, H: Hand, Delete: Delete selected, R: Reset view)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      if (e.key === "f" || e.key === "F") {
        if (selectedAssetId) {
          handleCameraPreset("focus");
        }
      } else if (e.key === "v" || e.key === "V") {
        setActiveTool("pointer");
      } else if (e.key === "h" || e.key === "H") {
        setActiveTool("hand");
      } else if (e.key === "r" || e.key === "R") {
        handleCameraPreset("reset");
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedAssetId) {
          setPlacedAssets((prev) => prev.filter((a) => a.id !== selectedAssetId));
          setSelectedAssetId(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedAssetId]);

  const selectedAsset = placedAssets.find((a) => a.id === selectedAssetId);

  // Add asset from click or default drop
  const handleAddAssetFromTemplate = (
    template: AssetTemplate,
    worldX = 0,
    worldZ = 0
  ) => {
    const newId = `asset-${Date.now()}`;
    const newAsset: Asset3DData = {
      id: newId,
      name: `${template.name} #${placedAssets.length + 1}`,
      type: template.category,
      x: worldX,
      y: worldZ,
      status: "Running",
      speedRpm: 1200,
      plcTag: `DB10.DBD${placedAssets.length * 4}`,
      modelUrl: template.modelUrl,
      isGlb: template.isGlb,
      // Physics Simulation Defaults
      mass: 15,
      friction: 0.4,
      restitution: 0.1,
      bodyType: "fixed",
      colliderShape: "box",
      physicsEnabled: true,
    };
    setPlacedAssets((prev) => [...prev, newAsset]);
    setSelectedAssetId(newId);
  };

  const handleUpdateAsset = (updatedAsset: Asset3DData) => {
    setPlacedAssets((prev) =>
      prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a))
    );
  };

  const handleDeleteSelected = () => {
    if (selectedAssetId) {
      setPlacedAssets((prev) => prev.filter((a) => a.id !== selectedAssetId));
      setSelectedAssetId(null);
    }
  };

  // HTML5 Drag and Drop handler using Normalized Device Coordinates
  const handleCanvasDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setDragPreviewPos(null);
    const rawData = e.dataTransfer.getData("application/json");
    let templateToUse: AssetTemplate | null = activeDragTemplate;
    if (rawData) {
      try {
        templateToUse = JSON.parse(rawData);
      } catch (err) {
        // Fallback to activeDragTemplate
      }
    }
    setActiveDragTemplate(null);

    if (!templateToUse) return;
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      // Convert pixel drop coordinates to Normalized Device Coordinates (NDC: -1 to 1)
      const ndcX = (offsetX / rect.width) * 2 - 1;
      const ndcY = -((offsetY / rect.height) * 2 - 1);

      setPendingDrop({
        template: templateToUse,
        ndcX,
        ndcY,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("Drop asset error:", err);
    }
  };

  const dragPreviewData =
    activeDragTemplate && dragPreviewPos
      ? {
          template: activeDragTemplate,
          ndcX: dragPreviewPos.ndcX,
          ndcY: dragPreviewPos.ndcY,
        }
      : null;

  const projectTitle = id ? `Botting Line ${id.toUpperCase()}` : "Botting Line B";

  return (
    <div className={styles["detail-page-container"]}>
      {/* Top Navbar Header */}
      <ProjectNavbar
        title={projectTitle}
        activeMode={activeMode}
        onModeChange={setActiveMode}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        seconds={seconds}
        onResetTimer={() => setSeconds(0)}
      />

      {/* Main Workspace Body */}
      <div className={styles["workspace-body"]}>
        {/* Left Assets Panel */}
        <AssetsPanel
          assetTemplates={ASSET_TEMPLATES}
          onAddAsset={(template) => handleAddAssetFromTemplate(template, 0, 0)}
          onDragStartTemplate={(template) => setActiveDragTemplate(template)}
          onDragEndTemplate={() => {
            setActiveDragTemplate(null);
            setDragPreviewPos(null);
          }}
        />

        {/* Center Canvas Viewport */}
        <main
          className={styles["canvas-viewport"]}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            const rect = e.currentTarget.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            const ndcX = (offsetX / rect.width) * 2 - 1;
            const ndcY = -((offsetY / rect.height) * 2 - 1);

            setDragPreviewPos({ ndcX, ndcY });
          }}
          onDragLeave={() => setDragPreviewPos(null)}
          onDrop={handleCanvasDrop}
        >
          {/* Top Floating Toolbar */}
          <CanvasToolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            onDeleteSelected={handleDeleteSelected}
            onCameraPreset={handleCameraPreset}
            hasSelection={Boolean(selectedAssetId)}
          />

          {/* 3D React Three Fiber Canvas with Exact 3D Raycasting */}
          <DigitalTwinCanvas3D
            assets={placedAssets}
            selectedAssetId={selectedAssetId}
            onSelectAsset={setSelectedAssetId}
            onUpdateAsset={handleUpdateAsset}
            pendingDrop={pendingDrop}
            dragPreview={dragPreviewData}
            activeTool={activeTool}
            cameraCommand={cameraCommand}
            activeMode={activeMode}
            isPlaying={isPlaying}
            onAddAssetAtWorldPos={handleAddAssetFromTemplate}
          />
        </main>

        {/* Right Properties Panel */}
        <PropertiesPanel
          selectedAsset={selectedAsset}
          activeMode={activeMode}
          onUpdateAsset={handleUpdateAsset}
        />
      </div>
    </div>
  );
};

export default ProjectDetail;
