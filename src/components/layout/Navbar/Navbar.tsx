import React from "react";
import { AddIcon, SearchIcon } from "../../../assets/icons/exportIcons";
import Button from "../../common/Button/Button";
import styles from "./Navbar.module.scss";

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onNewProject?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  searchQuery = "",
  onSearchChange,
  onNewProject,
}) => {
  return (
    <header className={styles["navbar-container"]}>
      <div className={styles.label}>Projects</div>

      <div className={styles["action-btn"]}>
        <div className={styles["search-container"]}>
          <div className={styles["search-icon"]}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search anything..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>

        <Button
          icon={<AddIcon />}
          label="New Project"
          onClick={onNewProject}
        />

        <div className={styles["user-profile"]}>
          <div className={styles["avatar"]}>N</div>
          <div className={styles["user-info"]}>
            <span className={styles["name"]}>Nalvazhuthi</span>
            <span className={styles["role"]}>UI Developer</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
