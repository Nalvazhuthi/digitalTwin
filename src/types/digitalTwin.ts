export type ProjectStatus = "Live linked" | "Simulation" | "Draft";
export type ProjectCategory = "Live Twin" | "Simulation";
export type OperationalStatus = "Running" | "Idle" | "Warning";
export type ProjectMode = "flow" | "plc" | "physics";
export type CanvasTool = "pointer" | "hand" | "trash";

export interface Project {
  id: string;
  title: string;
  editedTime: string;
  author: string;
  status: ProjectStatus;
  category: ProjectCategory;
  image: string;
}

export interface Asset3DData {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width?: number; // 3D bounding width along X (meters)
  depth?: number; // 3D bounding depth along Z (meters)
  rotation?: number; // Y-axis rotation in degrees
  status: OperationalStatus;
  speedRpm: number;
  plcTag: string;
  modelUrl?: string;
  isGlb?: boolean;
  // Physics Simulation Properties
  mass?: number; // in kg (default: 15)
  friction?: number; // 0.0 to 1.0 (default: 0.4)
  restitution?: number; // 0.0 to 1.0 (bounciness, default: 0.1)
  bodyType?: "fixed" | "dynamic" | "kinematic"; // default: "fixed"
  colliderShape?: "box" | "cylinder" | "mesh"; // default: "box"
  physicsEnabled?: boolean; // default: true
}

export interface AssetTemplate {
  typeId: string;
  name: string;
  category: "Machines" | "Stations";
  description: string;
  modelUrl?: string;
  isGlb?: boolean;
}
