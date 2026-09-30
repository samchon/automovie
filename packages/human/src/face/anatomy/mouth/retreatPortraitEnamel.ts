import { measureAutoMovieMeshClearance } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Move one enamel arch rigidly posteriorly until it lies behind the lip mesh,
 * in the head's +Z-forward metre frame.
 *
 * The retreat is the largest deficit of the measured Z clearance between the
 * lips and the enamel over every overlapping triangle pair, so one translation
 * clears the whole arch and the crown shapes, the inter-tooth arrangement and
 * the normals are untouched. Enamel that already clears the lips by
 * `clearance` returns as an equal copy, and an empty lip mesh constrains
 * nothing. The measurement is the engine's ray-parallel one along Z, so it
 * judges what a viewer looking along the head's Z sees and not arbitrary
 * volume overlap. A negative or nonfinite clearance is refused; the input
 * buffers are not changed.
 *
 * @evidence contracts/common.md#principled-implementation The largest deficit of the measured Z clearance over every overlapping lip and enamel triangle pair is the smallest single translation that clears the whole arch, so one rigid posterior shift restores non-penetration along Z while keeping the crowns' shape, arrangement and normals. The premise is the engine's ray-parallel clearance along Z, stated in the comment, and a finite nonnegative clearance, which is checked.
 * @evidence contracts/common.md#clear-and-simple-design One function that both the two-mesh fit and the cavity-less closed-mouth contact use, so the retreat is computed in one place.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named, and the caller's buffers are cloned, not patched.
 * @evidence contracts/common.md#meaningful-documentation The comment states the frame, why one translation suffices, the equal-copy and empty-lip cases, the measurement's limit and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Meshes are in the head's +Z-forward metre frame and the clearance is metres; only Z coordinates change.
 * @evidence contracts/modeling.md#part-identity-and-grouping The function moves one enamel arch as a whole and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries The enamel and the lips meet at one boundary definition, the clearance, measured from their complete triangle surfaces along Z, so the enamel touches at most and never lies in front of the lips for the frontal projection. It does not resolve overlap that the Z measurement cannot see, such as enamel crossing a lip fold sideways.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; the clearance is a construction gap.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function beyond a named clearance in metres.
 * @author Samchon
 */
export function retreatPortraitEnamel(
  lips: IAutoMovieMesh,
  enamel: IAutoMovieMesh,
  clearance: number,
): IAutoMovieMesh {
  if (!Number.isFinite(clearance) || clearance < 0)
    throw new Error("Oral clearance must be finite and nonnegative metres.");
  let retreat = 0;
  for (const { minimum } of measureAutoMovieMeshClearance(lips, enamel, "z"))
    retreat = Math.max(retreat, clearance - minimum);
  const placed = structuredClone(enamel);
  for (let i = 2; i < placed.positions.length; i += 3)
    placed.positions[i] -= retreat;
  return placed;
}
