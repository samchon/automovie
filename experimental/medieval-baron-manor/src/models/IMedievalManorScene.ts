import type * as THREE from "three";
import type { manorSpatialState } from "../manorSpatialState";

type SpatialSource = Parameters<typeof manorSpatialState>[0];
interface ManorReview { frontAngle?: number; [name: string]: unknown; }
type SpatialEntry = SpatialSource["entries"][number];
interface ManorEntry extends SpatialEntry {
  review: ManorReview;
}
type SpatialRoom = SpatialSource["rooms"][number];
interface ManorRoom extends SpatialRoom {
  label: string;
  bounds: number[];
  door: number[];
}
type SpatialBoundary = SpatialSource["boundaries"][number];
interface ManorBoundary extends SpatialBoundary { owner: string; faces: string[]; }
interface ManorPortal { id: string; level: number; eye: number[]; a: number[]; b: number[]; width: number; height: number; }
interface ManorView {
  id: string;
  eye?: number[];
  at?: number[];
  room?: string | null;
  object?: string;
  focus?: string;
  cut?: string;
  plan?: boolean;
  doorOpen?: number;
  az?: number;
  el?: number;
  neutral?: boolean;
  context?: boolean;
  connectionOnly?: boolean;
  operation?: ManorOperation;
}
interface ManorOperation { element: string; fraction: number; }
interface ManorManifest {
  purpose: string;
  rooms: ManorRoom[];
  boundaries: ManorBoundary[];
  portals: ManorPortal[];
  entries: ManorManifestEntry[];
  area: ManorArea;
  holes: number[][];
  chimneyCut: number[];
}
interface ManorManifestEntry extends Omit<ManorEntry, "model"> { parts: string[]; }
interface ManorArea { footprint: number; upperOpening: number; servicePenetration: number; }

/** Same authored manor geometry, assembly and observations delivered by its native producer. */
export interface IMedievalManorScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  views: ManorView[];
  objects: Map<string, THREE.Object3D>;
  entries: ManorEntry[];
  inspection: THREE.DirectionalLight;
  manifest: ManorManifest;
  target: THREE.Vector3;
  applyView(index: number): ManorView;
  setArticulation(entry: ManorEntry, fraction: number): void;
  configureRenderer(renderer: THREE.WebGLRenderer): void;
  update(): void;
}
