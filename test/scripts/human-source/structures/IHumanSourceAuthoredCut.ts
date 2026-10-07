import type { IHumanSourceCut } from "./IHumanSourceCut.ts";

/** New common-root partitions and the retired-aware historical metadata map. */
export interface IHumanSourceAuthoredCut {
  cut: IHumanSourceCut;
  /** Rebuilt head triangles in head-local order, never the copied old surface. */
  headIndices: Int32Array;
  headUv: Float64Array;
  /** Old head vertex to new head view; -1 explicitly denotes retirement. */
  originalFaceToHead: Int32Array;

  /** Original head triangle to retained current head cell; -1 denotes replacement. */
  originalFaceTriangleToHead: Int32Array;

  /** Source material/part role for every rebuilt head triangle. */
  headMaterialRoles: string[];
  headPartIds: string[];
}
