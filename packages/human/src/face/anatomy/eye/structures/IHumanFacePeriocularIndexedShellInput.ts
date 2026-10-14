/** Actual offset sheets on one conforming source-incidence triangulation.
 *
 *
 * @evidence contracts/common.md#principled-implementation Aligned actual outer/inner sheets share the exact conforming triangles and directed boundary.
 * @evidence contracts/common.md#clear-and-simple-design The conformed sheet owner supplies incidence and createHumanFacePeriocularIndexedShell owns closure/orientation/normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested thickness remains unchanged and boundary incidence cannot be reconstructed from coordinate welding.
 * @evidence contracts/common.md#meaningful-documentation Fields state metre coordinates, actual triangles and same-sheet boundary edges.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularIndexedShellInput is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularIndexedShellInput declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularIndexedShellInput acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularIndexedShellInput {
  /** Outer sheet, head-frame metres, aligned with the supplied sheet vertices. */
  outer: number[];

  /** Inner sheet at the caller's unchanged normal thickness, metres. */
  inner: number[];

  /** Actual conforming sheet triangles. */
  indices: number[];

  /** Oriented boundary edges of the same sheet. */
  boundary: [number, number][];
}
