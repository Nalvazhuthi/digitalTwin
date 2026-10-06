import React, { useState } from "react";
import ProjectCard from "../../components/common/Card/ProjectCard";
import type { Project } from "../../types/digitalTwin";
import styles from "./Home.module.scss";

interface HomeProps {
  searchQuery?: string;
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({
  searchQuery = "",
  projects,
  onDeleteProject,
  onDuplicateProject,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "recent" | "simulation" | "live">("all");

  const simulationCount = projects.filter((p) => p.status === "Simulation").length;
  const liveCount = projects.filter((p) => p.status === "Live linked").length;

  const currentDateText = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "recent") {
      return (
        project.editedTime.includes("Just now") ||
        project.editedTime.includes("2h") ||
        project.editedTime.includes("4h")
      );
    }
    if (activeTab === "simulation") {
      return project.status === "Simulation";
    }
    if (activeTab === "live") {
      return project.status === "Live linked";
    }
    return true;
  });

  return (
    <div className={styles["home-container"]}>
      <div className={styles["header-section"]}>
        <span className={styles["date-text"]}>{currentDateText}</span>
        <h1 className={styles["greeting-title"]}>Good Morning, Nal</h1>
      </div>

      <div className={styles["filter-tabs"]}>
        <button
          className={`${styles["tab-btn"]} ${activeTab === "all" ? styles["active"] : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          className={`${styles["tab-btn"]} ${activeTab === "recent" ? styles["active"] : ""}`}
          onClick={() => setActiveTab("recent")}
        >
          Recent
        </button>
        <button
          className={`${styles["tab-btn"]} ${activeTab === "simulation" ? styles["active"] : ""}`}
          onClick={() => setActiveTab("simulation")}
        >
          Simulation ({simulationCount})
        </button>
        <button
          className={`${styles["tab-btn"]} ${activeTab === "live" ? styles["active"] : ""}`}
          onClick={() => setActiveTab("live")}
        >
          Live Twin ({liveCount})
        </button>
      </div>

      {filteredProjects.length > 0 ? (
        <div className={styles["projects-grid"]}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={onDeleteProject}
              onDuplicate={onDuplicateProject}
            />
          ))}
        </div>
      ) : (
        <div className={styles["empty-state"]}>
          <p>No digital twin projects found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default Home;
