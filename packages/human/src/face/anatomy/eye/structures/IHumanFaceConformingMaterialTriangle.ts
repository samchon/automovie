import type { HumanFaceConformingMaterialArithmetic as Arithmetic } from "../HumanFaceConformingMaterialArithmetic";

/**
 * Homogeneous material coordinates with a positive denominator; scale cancels from incidence predicates.
 */
type MaterialPoint = Parameters<typeof Arithmetic.orientation>[0];

/**
 * One material triangle, retaining construction and original-parent incidence,
 * exact coordinates and an exact common-unit bounding box.
 *
 * @author Samchon
 */
export interface IHumanFaceConformingMaterialTriangle {
  /** Original source or canonical grid vertex IDs. */
  corners: [number, number, number];

  /** Canonical construction keys of those same corners. */
  keys: [string, string, string];

  /** Original domain triangle before material refinement; original triangles name themselves. */
  originalCorners: [number, number, number];

  /** Exact original coordinates; every denominator is one. */
  points: [MaterialPoint, MaterialPoint, MaterialPoint];

  /** Exact common-unit minima then maxima, used only for rejection. */
  bounds: [bigint, bigint, bigint, bigint];
}
