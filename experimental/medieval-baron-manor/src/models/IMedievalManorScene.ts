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

/**
 * Same authored manor geometry, assembly and observations delivered by its native producer.
 */
export interface IMedievalManorScene {
  /** Visual branch's Three scene; the geometry-only overload does not return this capability. */
  scene: THREE.Scene;

  /** Perspective camera controlled by the authored observations. */
  camera: THREE.PerspectiveCamera;

  /** Authored camera and articulation observation choices. */
  views: ManorView[];

  /** Entry id to visual object lookup used by observation visibility and clipping. */
  objects: Map<string, THREE.Object3D>;

  /** Authored model assemblies, roles and articulation records. */
  entries: ManorEntry[];

  /** Inspection directional light whose pose follows the current camera. */
  inspection: THREE.DirectionalLight;

  /** Authored room, boundary, portal, entry and area records used by measurement and review. */
  manifest: ManorManifest;

  /** Current world-space look target in meters. */
  target: THREE.Vector3;

  /** Applies the indexed authored observation and returns that view record. */
  applyView(index: number): ManorView;

  /** Interpolates the entry's authored closed/open travel without clamping, applying revolute or prismatic motion; an entry without articulation is refused. */
  setArticulation(entry: ManorEntry, fraction: number): void;

  /** Applies the producer's lighting and shadow settings to the caller-owned renderer. */
  configureRenderer(renderer: THREE.WebGLRenderer): void;

  /** Updates camera-following inspection lighting without creating a new observation. */
  update(): void;
}
