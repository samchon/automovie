import { measureAutoMovieMeshClearance } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Move one enamel arch rigidly posteriorly until it lies behind the lip mesh, in the head's +Z-forward metre frame.
 *
 * The retreat is the largest deficit of the measured Z clearance between the lips and the enamel over every overlapping triangle pair, so one translation clears the whole arch and the crown shapes, the inter-tooth arrangement and the normals are untouched. Enamel that already clears the lips by `clearance` returns as an equal copy, and an empty lip mesh constrains nothing. The measurement is the engine's ray-parallel one along Z, so it judges what a viewer looking along the head's Z sees and not arbitrary volume overlap. A negative or nonfinite clearance is refused; the input buffers are not changed.
 *
 * @evidence contracts/common.md#principled-implementation Maximum Z-clearance deficit over overlapping triangle projections determines one posterior translation of the enamel arch.
 * @evidence contracts/common.md#clear-and-simple-design The rigid retreat preserves crown shapes, normals and interdental arrangement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ray-parallel measurement is not arbitrary volume-overlap admission; nonfinite/negative gap refuses and empty lip constraints permit an equal copy.
 * @evidence contracts/common.md#meaningful-documentation Head +Z is anterior, coordinates and construction clearance are metres.
 * @evidence contracts/performance.md#efficient-algorithms Directional triangle-pair measurement dominates, followed by one clone and linear Z update.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared engine clearance measurement supplies all projected deficits before one translation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned enamel buffers are owned and both caller meshes remain unchanged.
 *
 * @author Samchon
 */
export function retreatPortraitEnamel(
  lips: IAutoMovieMesh,
  enamel: IAutoMovieMesh,
  clearance: number,
): IAutoMovieMesh {
  if (!Number.isFinite(clearance) || clearance < 0)
    throw new Error("Oral clearance must be finite and nonnegative metres.");
  let retreat: number = 0;
  for (const { minimum } of measureAutoMovieMeshClearance(lips, enamel, "z"))
    retreat = Math.max(retreat, clearance - minimum);
  const placed: IAutoMovieMesh = structuredClone(enamel);
  for (let i: number = 2; i < placed.positions.length; i += 3)
    placed.positions[i] -= retreat;
  return placed;
}
