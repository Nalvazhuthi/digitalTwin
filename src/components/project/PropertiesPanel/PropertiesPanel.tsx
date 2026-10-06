import React from "react";
import type {
  Asset3DData,
  OperationalStatus,
  ProjectMode,
} from "../../../types/digitalTwin";
import styles from "./PropertiesPanel.module.scss";

interface PropertiesPanelProps {
  selectedAsset: Asset3DData | undefined;
  activeMode?: ProjectMode;
  onUpdateAsset: (updatedAsset: Asset3DData) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedAsset,
  activeMode = "flow",
  onUpdateAsset,
}) => {
  const isPhysicsMode = activeMode === "physics";

  return (
    <aside className={styles["properties-panel"]}>
      <h2>{isPhysicsMode ? "Physics Properties" : "Properties"}</h2>

      {selectedAsset ? (
        <div className={styles["prop-content"]}>
          {/* Base Asset Info */}
          <div className={styles["prop-group"]}>
            <label>Asset Name</label>
            <input
              type="text"
              value={selectedAsset.name}
              onChange={(e) =>
                onUpdateAsset({ ...selectedAsset, name: e.target.value })
              }
            />
          </div>

          <div className={styles["prop-group"]}>
            <label>Category / Type</label>
            <input type="text" value={selectedAsset.type} readOnly />
          </div>

          {/* 3D Transform & Position Section */}
          <div className={styles["section-divider"]} />
          <div className={styles["section-header"]}>
            <span className={styles["icon"]}>📐</span>
            <span>3D Position & Coordinates</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className={styles["prop-group"]}>
              <label>Position X (m)</label>
              <input
                type="number"
                step="0.1"
                value={Number(selectedAsset.x.toFixed(2))}
                onChange={(e) => {
                  const targetX = parseFloat(e.target.value) || 0;
                  onUpdateAsset({
                    ...selectedAsset,
                    x: targetX,
                  });
                }}
              />
            </div>
            <div className={styles["prop-group"]}>
              <label>Position Z (m)</label>
              <input
                type="number"
                step="0.1"
                value={Number(selectedAsset.y.toFixed(2))}
                onChange={(e) => {
                  const targetZ = parseFloat(e.target.value) || 0;
                  onUpdateAsset({
                    ...selectedAsset,
                    y: targetZ,
                  });
                }}
              />
            </div>
          </div>

          {/* Physics Simulation Section */}
          <div className={styles["section-divider"]} />
          <div className={styles["section-header"]}>
            <span className={styles["icon"]}>⚛</span>
            <span>RigidBody Dynamics</span>
          </div>

          <div className={styles["prop-group"]}>
            <label>Rigid Body Type</label>
            <select
              value={selectedAsset.bodyType ?? "fixed"}
              onChange={(e) =>
                onUpdateAsset({
                  ...selectedAsset,
                  bodyType: e.target.value as "fixed" | "dynamic" | "kinematic",
                })
              }
            >
              <option value="fixed">Fixed (Static Base)</option>
              <option value="dynamic">Dynamic (Simulated)</option>
              <option value="kinematic">Kinematic (Controlled)</option>
            </select>
          </div>

          <div className={styles["prop-group"]}>
            <label>Mass (kg): {selectedAsset.mass ?? 15} kg</label>
            <input
              type="range"
              min="1"
              max="100"
              value={selectedAsset.mass ?? 15}
              onChange={(e) =>
                onUpdateAsset({
                  ...selectedAsset,
                  mass: parseFloat(e.target.value) || 1,
                })
              }
            />
          </div>

          <div className={styles["prop-group"]}>
            <label>Friction Coefficient: {selectedAsset.friction ?? 0.4}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedAsset.friction ?? 0.4}
              onChange={(e) =>
                onUpdateAsset({
                  ...selectedAsset,
                  friction: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className={styles["prop-group"]}>
            <label>Restitution (Bounciness): {selectedAsset.restitution ?? 0.1}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={selectedAsset.restitution ?? 0.1}
              onChange={(e) =>
                onUpdateAsset({
                  ...selectedAsset,
                  restitution: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className={styles["prop-group"]}>
            <label>Collider Geometry</label>
            <select
              value={selectedAsset.colliderShape ?? "box"}
              onChange={(e) =>
                onUpdateAsset({
                  ...selectedAsset,
                  colliderShape: e.target.value as "box" | "cylinder" | "mesh",
                })
              }
            >
              <option value="box">Box Bounding Box</option>
              <option value="cylinder">Cylinder Hull</option>
              <option value="mesh">Convex Mesh</option>
            </select>
          </div>

          {/* Regular Operational Properties */}
          <div className={styles["section-divider"]} />

          <div className={styles["prop-group"]}>
            <label>PLC Tag Address</label>
            <input
              type="text"
              value={selectedAsset.plcTag}
              onChange={(e) =>
                onUpdateAsset({ ...selectedAsset, plcTag: e.target.value })
              }
            />
          </div>

          <div className={styles["prop-group"]}>
            <label>Speed (RPM)</label>
            <input
              type="number"
              value={selectedAsset.speedRpm}
              onChange={(e) =>
                onUpdateAsset({
                  ...selectedAsset,
                  speedRpm: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className={styles["prop-group"]}>
            <label>Operational Status</label>
            <select
              value={selectedAsset.status}
              onChange={(e) =>
                onUpdateAsset({
                  ...selectedAsset,
                  status: e.target.value as OperationalStatus,
                })
              }
            >
              <option value="Running">Running</option>
              <option value="Idle">Idle</option>
              <option value="Warning">Warning</option>
            </select>
          </div>
        </div>
      ) : isPhysicsMode ? (
        <div className={styles["physics-env-card"]}>
          <div className={styles["env-title"]}>
            <span>⚛</span> Global Physics Engine
          </div>
          <div className={styles["env-row"]}>
            <span>Gravity</span>
            <strong>-9.81 m/s²</strong>
          </div>
          <div className={styles["env-row"]}>
            <span>Ground Friction</span>
            <strong>0.50 µ</strong>
          </div>
          <div className={styles["env-row"]}>
            <span>Air Resistance</span>
            <strong>0.01 Cd</strong>
          </div>
          <div className={styles["env-row"]}>
            <span>Collision Bounds</span>
            <strong style={{ color: "#22c55e" }}>Active Wireframe</strong>
          </div>
          <p className={styles["env-tip"]}>
            Select any 3D machine asset from the canvas to edit its RigidBody mass, friction, and bounciness parameters.
          </p>
        </div>
      ) : (
        <div className={styles["prop-empty"]}>
          <p>Select an asset from the canvas to edit properties.</p>
        </div>
      )}
    </aside>
  );
};

export default PropertiesPanel;
