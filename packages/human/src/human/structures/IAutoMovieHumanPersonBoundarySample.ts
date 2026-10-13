/**
 * One canonical shared neck-polyline sample in the posed common metre Y-up/+Z-forward frame. The stitch producer interpolates the evaluated face-loop position and normal, refuses a nonpositive normal length, then normalizes under admitted finite input. Point/normal arrays retain the existing flat XYZ representation; this type enforces neither three entries nor unit/finite magnitude. A canonical sample alone supplies no global topology, clearance or clinical measurement.
 *
 * @evidence contracts/common.md#principled-implementation One face-loop interpolation supplies the same canonical performed point/normal to both boundary consumers rather than independent coordinate fitting.
 * @evidence contracts/common.md#clear-and-simple-design The record carries point and shading direction only; parameter/source identity and subdivision are owned by the stitch producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Flat typed arrays do not prove unit/finite XYZ or global seam validity, and physical lineage is not inferred from matching coordinates.
 * @evidence contracts/common.md#meaningful-documentation Prose states posed metre axes, normalized shading direction, producer refusal and erased array-shape limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This sample carrier performs no interpolation, normal normalization or boundary search; stitching owns those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reusing a canonical sample across sides is producer behavior rather than memoization implemented by this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no mesh, source task or renderer; returned sample arrays belong to their actual producer/consumer.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoundarySample {
  /** Position on the face loop, metres. */
  point: number[];

  /** Unit normal interpolated along the face loop. */
  normal: number[];
}
