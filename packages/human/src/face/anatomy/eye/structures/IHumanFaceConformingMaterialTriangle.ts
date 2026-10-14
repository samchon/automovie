import type { HumanFaceConformingMaterialArithmetic as Arithmetic } from "../HumanFaceConformingMaterialArithmetic";

/**
 * Homogeneous material coordinates with a positive denominator; scale cancels from incidence predicates.
 */
type MaterialPoint = Parameters<typeof Arithmetic.orientation>[0];

/**
 * One material triangle, retaining construction and original-parent incidence,
 * exact coordinates and an exact common-unit bounding box.
 *
 *
 * @evidence contracts/common.md#principled-implementation Unit-denominator exact corners, original-parent identity and common-unit bounds describe one source/grid triangle.
 * @evidence contracts/common.md#clear-and-simple-design HumanFaceConformingRefinement owns construction and the sheet uses bounds only before exact intersection predicates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Box overlap does not certify geometry; original-parent identity survives density refinement.
 * @evidence contracts/common.md#meaningful-documentation Fields give canonical keys, original domain, exact points and rejection-only extrema.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceConformingMaterialTriangle is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceConformingMaterialTriangle declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceConformingMaterialTriangle itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
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
