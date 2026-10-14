import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The direction that leaves two surfaces at once: the station's own skin with outward normal `normal` and another surface with outward normal `blocking`.
 *
 * For unit normals n0 and n1, the unit direction with the largest common margin min(d.n0, d.n1) is their normalized bisector, attaining sqrt((1 + n0.n1) / 2). It is positive exactly when the normals are not antiparallel, so a free cone between the two surfaces exists exactly then. Antiparallel normals leave no direction that separates from both, and the stem refuses by name. Inputs are unchanged.
 *
 * @evidence contracts/common.md#principled-implementation The normalized sum of two unit outward normals maximizes their common directional margin.
 * @evidence contracts/common.md#clear-and-simple-design One bisector owner serves rooted aiming without separate personal or obstacle heuristics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Antiparallel normals refuse because no common positive escape exists; input unit normals remain a caller premise.
 * @evidence contracts/common.md#meaningful-documentation The returned unit direction alone does not admit travel or establish clearance.
 * @evidence contracts/performance.md#efficient-algorithms A fixed vector sum, length check and normalization take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Aiming reuses this common-margin construction rather than a second escape formula; no memoization is used.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs remain unchanged and the returned vector is owned by the caller.
 */
export function escapeHumanFaceHairRootedStem(
  normal: IAutoMovieVector3,
  blocking: IAutoMovieVector3,
): IAutoMovieVector3 {
  const sum: IAutoMovieVector3 = Vector3.add(normal, blocking);
  if (!(Vector3.length(sum) > 0))
    throw new Error(
      "A rooted hair stem lies between antiparallel surfaces with no free direction.",
    );
  return Vector3.normalize(sum);
}
