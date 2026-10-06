import { useState } from "react";
import { DashboardIcon, LogoIcon, TemplateIcon } from "../../../assets/icons/exportIcons";
import styles from "./Sidebar.module.scss";

const Sidebar = () => {
  const [activeNav, setActiveNav] = useState<"dashboard" | "templates">("dashboard");

  return (
    <aside className={styles["sidebar-container"]}>
      <div className={styles["logo"]}>
        <LogoIcon />
      </div>

      <div className={styles["divider"]}></div>

      <nav className={styles["nav-items"]}>
        <button
          className={`${styles["nav-item"]} ${activeNav === "dashboard" ? styles["active"] : ""}`}
          onClick={() => setActiveNav("dashboard")}
          title="Dashboard / Projects"
        >
          <DashboardIcon />
        </button>

        <button
          className={`${styles["nav-item"]} ${activeNav === "templates" ? styles["active"] : ""}`}
          onClick={() => setActiveNav("templates")}
          title="Templates & Layouts"
        >
          <TemplateIcon />
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
