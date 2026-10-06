import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KebabIcon } from "../../../assets/icons/exportIcons";
import type { Project } from "../../../types/digitalTwin";
import styles from "./ProjectCard.module.scss";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onDelete,
  onDuplicate,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCardClick = () => {
    navigate(`/project/${project.id}`);
  };

  return (
    <div className={styles["card-container"]} onClick={handleCardClick}>
      <div className={styles["image-wrapper"]}>
        <img src={project.image} alt={project.title} loading="lazy" />

        <div
          className={styles["menu-wrapper"]}
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={styles["kebab-btn"]}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Project actions"
          >
            <KebabIcon />
          </button>

          {menuOpen && (
            <div className={styles["dropdown-menu"]}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/project/${project.id}`);
                  setMenuOpen(false);
                }}
              >
                View Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/project/${project.id}`);
                  setMenuOpen(false);
                }}
              >
                Configure Twin
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate?.(project.id);
                  setMenuOpen(false);
                }}
              >
                Duplicate
              </button>
              <button
                className={styles["delete"]}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(project.id);
                  setMenuOpen(false);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles["card-content"]}>
        <h3 className={styles["card-title"]}>{project.title}</h3>
        <div className={styles["card-footer"]}>
          <span className={styles["meta-text"]}>
            Edited {project.editedTime} ago · {project.author}
          </span>
          <span
            className={`${styles["status-badge"]} ${
              project.status === "Live linked"
                ? styles["live"]
                : styles["simulation"]
            }`}
          >
            <span className={styles["dot"]}>●</span>
            {project.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
