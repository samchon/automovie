import type { IAutoMovieMeshPhysicalSource } from "@automovie/interface";

/** Actual resident normal refusal and its local incident geometry, without changing either. */
export interface IHumanMeshNormalRefusal {
  /** Resident vertex identity. */
  vertex: number;

  /** Original direction before quantization. */
  original: number[];

  /** Direction actually stored at Float32 precision. */
  float32: number[];

  /** Actual Float32 direction length. */
  length: number;

  /** Every resident triangle that references this vertex. */
  faces: number[];

  /** Sum of oriented twice-area vectors on this resident mesh, square metres. */
  areaSum: number[];

  /** Oriented twice-area of each face in the same order as faces. */
  faceAreas: number[][];

  /** Original resident positions of each incident triangle, flat XYZ triples. */
  facePositions: number[][];

  /** Original physical lineage, when the mesh supplies it. */
  physical: IAutoMovieMeshPhysicalSource | null;
}
