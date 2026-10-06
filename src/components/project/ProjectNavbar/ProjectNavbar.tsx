import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LogoIcon,
  PauseIcon,
  PlayIcon,
  RotateIcon,
  SignalIcon,
} from "../../../assets/icons/exportIcons";
import type { ProjectMode } from "../../../types/digitalTwin";
import styles from "./ProjectNavbar.module.scss";

interface ProjectNavbarProps {
  title: string;
  activeMode: ProjectMode;
  onModeChange: (mode: ProjectMode) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  seconds: number;
  onResetTimer: () => void;
}

const ProjectNavbar: React.FC<ProjectNavbarProps> = ({
  title,
  activeMode,
  onModeChange,
  isPlaying,
  onTogglePlay,
  seconds,
  onResetTimer,
}) => {
  const navigate = useNavigate();

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className={styles["project-navbar"]}>
      {/* Left Section */}
      <div className={styles["left-section"]}>
        <div
          className={styles["app-logo"]}
          onClick={() => navigate("/")}
          title="Go to Home"
        >
          <LogoIcon />
        </div>

        <h1 className={styles["project-title"]}>{title}</h1>
        <span className={styles["saved-tag"]}>
          <span className={styles["dot"]}>●</span> Saved
        </span>
      </div>

      {/* Center Mode Stepper */}
      <div className={styles["stepper-container"]}>
        <button
          className={`${styles["step-pill"]} ${
            activeMode === "flow" ? styles["active"] : ""
          }`}
          onClick={() => onModeChange("flow")}
        >
          <span className={styles["step-number"]}>1</span>
          Flow
        </button>
        <button
          className={`${styles["step-pill"]} ${
            activeMode === "plc" ? styles["active"] : ""
          }`}
          onClick={() => onModeChange("plc")}
        >
          <span className={styles["step-number"]}>2</span>
          PLC
        </button>
        <button
          className={`${styles["step-pill"]} ${
            activeMode === "physics" ? styles["active"] : ""
          }`}
          onClick={() => onModeChange("physics")}
        >
          <span className={styles["step-number"]}>3</span>
          Physics
        </button>
      </div>

      {/* Right Controls */}
      <div className={styles["right-controls"]}>
        <button
          className={styles["control-btn"]}
          onClick={onTogglePlay}
          title={isPlaying ? "Pause Sequence" : "Play Sequence"}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          className={styles["control-btn-ghost"]}
          onClick={onResetTimer}
          title="Reset Timer"
        >
          <RotateIcon />
        </button>

        <div className={styles["timer-display"]}>
          <span className={styles["time"]}>{formatTime(seconds)}</span>
          <span className={styles["status-label"]}>Sequence run</span>
        </div>

        <div className={styles["signal-badge"]} title="Hardware Linked">
          <SignalIcon />
        </div>

        <div className={styles["avatar-circle"]}>N</div>
      </div>
    </header>
  );
};

export default ProjectNavbar;
