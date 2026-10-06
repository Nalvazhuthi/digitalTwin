import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar/Navbar";
import Sidebar from "./components/layout/Sidebar/Sidebar";
import Home from "./pages/Home/Home";
import ProjectDetail from "./pages/ProjectDetail/ProjectDetail";
import NewProjectModal from "./components/common/Modal/NewProjectModal";
import type { Project } from "./types/digitalTwin";
import bottlingImage from "./assets/images/bottling_line.jpg";
import "./styles/global.scss";

const INITIAL_PROJECTS: Project[] = [
  {
    id: "1",
    title: "Bottling Line B1",
    editedTime: "Just now",
    author: "Nal",
    status: "Live linked",
    category: "Live Twin",
    image: bottlingImage,
  },
  {
    id: "2",
    title: "Sorting & Conveyor Station C2",
    editedTime: "2h ago",
    author: "Nal",
    status: "Simulation",
    category: "Simulation",
    image: bottlingImage,
  },
  {
    id: "3",
    title: "Packaging Assembly Line A3",
    editedTime: "4h ago",
    author: "Nal",
    status: "Live linked",
    category: "Live Twin",
    image: bottlingImage,
  },
  {
    id: "4",
    title: "Robot Arm Cell 4",
    editedTime: "1d ago",
    author: "Nal",
    status: "Simulation",
    category: "Simulation",
    image: bottlingImage,
  },
  {
    id: "5",
    title: "Main Power Substation Twin",
    editedTime: "3d ago",
    author: "Nal",
    status: "Live linked",
    category: "Live Twin",
    image: bottlingImage,
  },
];

const AppContent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);

  const location = useLocation();
  const isProjectDetail = location.pathname.startsWith("/project/");

  const handleAddProject = (newProj: {
    title: string;
    status: "Live linked" | "Simulation";
    author: string;
    image: string;
  }) => {
    const createdProject: Project = {
      id: Date.now().toString(),
      title: newProj.title,
      editedTime: "Just now",
      author: newProj.author,
      status: newProj.status,
      category: newProj.status === "Live linked" ? "Live Twin" : "Simulation",
      image: newProj.image,
    };
    setProjects((prev) => [createdProject, ...prev]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDuplicateProject = (id: string) => {
    const projectToDup = projects.find((p) => p.id === id);
    if (!projectToDup) return;
    const duplicated: Project = {
      ...projectToDup,
      id: Date.now().toString(),
      title: `${projectToDup.title} (Copy)`,
      editedTime: "Just now",
    };
    setProjects((prev) => [duplicated, ...prev]);
  };

  return (
    <div className="content-container">
      {!isProjectDetail && <Sidebar />}
      <main className="right-content">
        {!isProjectDetail && (
          <Navbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewProject={() => setIsModalOpen(true)}
          />
        )}
        <Routes>
          <Route
            path="/"
            element={
              <Home
                searchQuery={searchQuery}
                projects={projects}
                onDeleteProject={handleDeleteProject}
                onDuplicateProject={handleDuplicateProject}
              />
            }
          />
          <Route path="/project/:id" element={<ProjectDetail />} />
        </Routes>
      </main>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddProject={handleAddProject}
      />
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
