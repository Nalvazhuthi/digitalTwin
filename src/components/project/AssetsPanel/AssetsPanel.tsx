import React, { useState } from "react";
import { SearchIcon, TractorAssetIcon, IOMapIcon } from "../../../assets/icons/exportIcons";
import type { AssetTemplate } from "../../../types/digitalTwin";
import styles from "./AssetsPanel.module.scss";

interface AssetsPanelProps {
  assetTemplates: AssetTemplate[];
  onAddAsset: (template: AssetTemplate) => void;
  onDragStartTemplate?: (template: AssetTemplate) => void;
  onDragEndTemplate?: () => void;
}

const AssetsPanel: React.FC<AssetsPanelProps> = ({
  assetTemplates,
  onAddAsset,
  onDragStartTemplate,
  onDragEndTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "machines" | "stations">("all");

  const filteredTemplates = assetTemplates.filter((template) => {
    const matchesSearch = template.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeCategory === "machines") return template.category === "Machines";
    if (activeCategory === "stations") return template.category === "Stations";
    return true;
  });

  return (
    <aside className={styles["assets-panel"]}>
      <div className={styles["panel-header"]}>
        <h2>Assets</h2>
        <span className={styles["subtext"]}>Drag to scene</span>
      </div>

      <div className={styles["search-box"]}>
        <SearchIcon />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles["category-tabs"]}>
        <button
          className={`${styles["cat-btn"]} ${
            activeCategory === "all" ? styles["active"] : ""
          }`}
          onClick={() => setActiveCategory("all")}
        >
          All
        </button>
        <button
          className={`${styles["cat-btn"]} ${
            activeCategory === "machines" ? styles["active"] : ""
          }`}
          onClick={() => setActiveCategory("machines")}
        >
          Machines
        </button>
        <button
          className={`${styles["cat-btn"]} ${
            activeCategory === "stations" ? styles["active"] : ""
          }`}
          onClick={() => setActiveCategory("stations")}
        >
          Stations
        </button>
      </div>

      <div className={styles["asset-grid"]}>
        {filteredTemplates.map((template) => (
          <div
            key={template.typeId}
            className={styles["asset-card"]}
            draggable
            onDragStart={(e) => {
              // Hide default browser HTML drag image thumbnail so only the 3D model is visible
              const transparentImg = new Image();
              transparentImg.src =
                "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
              e.dataTransfer.setDragImage(transparentImg, 0, 0);

              e.dataTransfer.setData(
                "application/json",
                JSON.stringify(template)
              );
              if (onDragStartTemplate) {
                onDragStartTemplate(template);
              }
            }}
            onDragEnd={() => {
              if (onDragEndTemplate) {
                onDragEndTemplate();
              }
            }}
            onClick={() => onAddAsset(template)}
            title="Drag or click to add to scene"
          >
            <div className={styles["icon-box"]}>
              <TractorAssetIcon />
            </div>
            <span className={styles["asset-title"]}>{template.name}</span>
            <span className={styles["asset-desc"]}>
              {template.description}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom IO Map Banner */}
      <div className={styles["io-map-banner"]}>
        <div className={styles["banner-left"]}>
          <IOMapIcon />
          <div className={styles["text-content"]}>
            <span className={styles["title"]}>Generate from IO Map</span>
            <span className={styles["desc"]}>
              Create a DigitalTwin-ready asset using the IO Map application.
            </span>
          </div>
        </div>
        <button className={styles["open-io-btn"]}>Open IO Map</button>
      </div>
    </aside>
  );
};

export default AssetsPanel;
