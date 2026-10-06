import React, { useState } from "react";
import { CloseIcon } from "../../../assets/icons/exportIcons";
import Button from "../Button/Button";
import styles from "./NewProjectModal.module.scss";
import bottlingImage from "../../../assets/images/bottling_line.jpg";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (newProject: {
    title: string;
    status: "Live linked" | "Simulation";
    author: string;
    image: string;
  }) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onAddProject,
}) => {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"Live linked" | "Simulation">("Live linked");
  const [author, setAuthor] = useState("Nal");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddProject({
      title: title.trim(),
      status,
      author: author.trim() || "Nal",
      image: bottlingImage,
    });

    setTitle("");
    onClose();
  };

  return (
    <div className={styles["modal-backdrop"]} onClick={onClose}>
      <div
        className={styles["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["modal-header"]}>
          <h2>Create New Digital Twin</h2>
          <button className={styles["close-btn"]} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles["form"]}>
          <div className={styles["form-group"]}>
            <label>Project Name</label>
            <input
              type="text"
              placeholder="e.g. Botting Line C"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className={styles["form-group"]}>
            <label>Twin Type</label>
            <div className={styles["radio-group"]}>
              <label className={styles["radio-label"]}>
                <input
                  type="radio"
                  name="status"
                  value="Live linked"
                  checked={status === "Live linked"}
                  onChange={() => setStatus("Live linked")}
                />
                Live Twin (Hardware Linked)
              </label>
              <label className={styles["radio-label"]}>
                <input
                  type="radio"
                  name="status"
                  value="Simulation"
                  checked={status === "Simulation"}
                  onChange={() => setStatus("Simulation")}
                />
                Simulation Mode
              </label>
            </div>
          </div>

          <div className={styles["form-group"]}>
            <label>Owner / Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </div>

          <div className={styles["modal-footer"]}>
            <Button
              type="button"
              variant="outline"
              label="Cancel"
              onClick={onClose}
            />
            <Button type="submit" variant="primary" label="Create Twin" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
