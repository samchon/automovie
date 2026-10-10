/**
 * One exact affine construction on a declared native material edge.
 * Vertex addresses identify the parent edge; the fraction remains separate
 * from the rounded chart coordinate used by diagnostic readers.
 */
export interface IHumanFacePeriocularMaterialEdgePoint {
  /** Actual native edge endpoints, in interpolation order. */
  vertices: [number, number];
  /** Affine fraction from the first endpoint toward the second, in [0,1]. */
  fraction: number;
}
