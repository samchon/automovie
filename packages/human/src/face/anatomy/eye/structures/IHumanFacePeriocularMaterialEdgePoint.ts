/**
 * One exact affine construction on a declared native material edge.
 * Vertex addresses identify the parent edge; the fraction remains separate
 * from the rounded chart coordinate used by diagnostic readers.
 *
 * @evidence contracts/common.md#principled-implementation Actual native edge endpoints retain the represented affine fraction used by exact homogeneous construction.
 * @evidence contracts/common.md#clear-and-simple-design Band sampling supplies the parent construction and conforming overlay consumes it independently of rounded UV.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A rounded coordinate cannot rename the original parent edge or fraction.
 * @evidence contracts/common.md#meaningful-documentation Fields state ordered native endpoints and fraction in the closed unit interval.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularMaterialEdgePoint is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularMaterialEdgePoint declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularMaterialEdgePoint acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularMaterialEdgePoint {
  /** Actual native edge endpoints, in interpolation order. */
  vertices: [number, number];

  /** Affine fraction from the first endpoint toward the second, in [0,1]. */
  fraction: number;
}
