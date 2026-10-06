import React from "react";
import {
  PointerToolIcon,
  HandToolIcon,
  TrashToolIcon,
} from "../../../assets/icons/exportIcons";
import type { CanvasTool } from "../../../types/digitalTwin";
import styles from "./CanvasToolbar.module.scss";

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  onSelectTool: (tool: CanvasTool) => void;
  onDeleteSelected: () => void;
  onCameraPreset?: (type: "focus" | "reset" | "top" | "iso") => void;
  hasSelection?: boolean;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTool,
  onSelectTool,
  onDeleteSelected,
  onCameraPreset,
  hasSelection = false,
}) => {
  return (
    <div className={styles["floating-toolbar"]}>
      {/* Pointer / Select Tool (HotKey: V) */}
      <button
        className={`${styles["tool-btn"]} ${
          activeTool === "pointer" ? styles["active"] : ""
        }`}
        onClick={() => onSelectTool("pointer")}
        title="Select Tool (V)"
      >
        <PointerToolIcon />
      </button>

      {/* Hand / Pan Tool (HotKey: H) */}
      <button
        className={`${styles["tool-btn"]} ${
          activeTool === "hand" ? styles["active"] : ""
        }`}
        onClick={() => onSelectTool("hand")}
        title="Pan Scene Tool (H)"
      >
        <HandToolIcon />
      </button>

      <div className={styles["divider"]} />

      {/* Focus Selected Asset (HotKey: F) */}
      {onCameraPreset && (
        <button
          className={`${styles["tool-btn"]} ${!hasSelection ? styles["disabled"] : ""}`}
          onClick={() => hasSelection && onCameraPreset("focus")}
          disabled={!hasSelection}
          title="Focus Selected Asset (F)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8"/>
            <line x1="12" y1="2" x2="12" y2="6"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="6" y2="12"/>
            <line x1="18" y1="12" x2="22" y2="12"/>
          </svg>
        </button>
      )}

      {/* Reset Camera View (HotKey: R) */}
      {onCameraPreset && (
        <button
          className={styles["tool-btn"]}
          onClick={() => onCameraPreset("reset")}
          title="Reset Camera View (R)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
      )}

      {/* Top 2D Floorplan View */}
      {onCameraPreset && (
        <button
          className={styles["tool-btn"]}
          onClick={() => onCameraPreset("top")}
          title="Top 2D Floorplan View"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="12" y1="3" x2="12" y2="21"/>
          </svg>
        </button>
      )}

      {/* 3D Isometric View */}
      {onCameraPreset && (
        <button
          className={styles["tool-btn"]}
          onClick={() => onCameraPreset("iso")}
          title="3D Isometric Perspective View"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16.5A2.5 2.5 0 0 1 18.5 19l-6.5 3.5a2.5 2.5 0 0 1-2 0L3.5 19A2.5 2.5 0 0 1 1 16.5v-9A2.5 2.5 0 0 1 3.5 5l6.5-3.5a2.5 2.5 0 0 1 2 0l6.5 3.5A2.5 2.5 0 0 1 21 7.5z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </button>
      )}

      <div className={styles["divider"]} />

      {/* Delete Selected Asset (Delete / Backspace) */}
      <button
        className={`${styles["tool-btn"]} ${styles["danger"]} ${!hasSelection ? styles["disabled"] : ""}`}
        onClick={onDeleteSelected}
        disabled={!hasSelection}
        title="Delete Selected Asset (Delete)"
      >
        <TrashToolIcon />
      </button>
    </div>
  );
};

export default CanvasToolbar;
