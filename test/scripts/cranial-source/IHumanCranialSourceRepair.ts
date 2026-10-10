import type { IHumanCranialSourceInput } from "./IHumanCranialSourceInput.ts";

/** Exact-seam topology counts before and after a source contraction. @author Samchon */
interface CranialTopology {
  vertices: number;
  edges: number;
  faces: number;
  boundaryEdges: number;
  nonManifoldEdges: number;
  windingEdges: number;
  eulerCharacteristic: number;
}

/** One retained original coordinate, its aliases and the removed source faces. @author Samchon */
interface CranialContraction {
  retainedVertex: number;
  removedVertex: number;
  retainedCoordinate: number[];
  removedCoordinate: number[];
  removedSourceFaces: number[];
  link: number[];
  opposite: number[];
}

/** Every moved shading ordinal retains both original and resulting coordinates. @author Samchon */
interface CranialMovedVertex {
  vertex: number;
  before: number[];
  after: number[];
  distanceMetres: number;
}

/** Full source-face and coordinate lineage, without a clinical qualification. @author Samchon */
interface CranialRepairReceipt {
  originalVertices: number;
  vertices: number;
  originalTriangles: number;
  triangles: number;
  originalZeroFaces: number[];
  contractions: CranialContraction[];
  movedVertices: CranialMovedVertex[];
  changedRetainedFaces: number;
  beforeTopology: CranialTopology;
  afterTopology: CranialTopology;
  retainedSourceFaces: number[];
  maximumCoordinateChangeMetres: number;
  normalProtocol: string;
}

/**
 * Fresh geometry and complete lineage of exact two-zero-face contractions.
 * A null receipt means the original indexed surface was returned unchanged.
 * Original vertex ordinals remain present, including unused seam aliases.
 * @author Samchon
 */
export interface IHumanCranialSourceRepair {
  mesh: IHumanCranialSourceInput["sources"][number]["mesh"];
  receipt: CranialRepairReceipt | null;
}
