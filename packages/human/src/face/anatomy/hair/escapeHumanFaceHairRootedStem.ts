import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The direction that leaves two surfaces at once: the station's own skin with
 * outward normal `normal` and another surface with outward normal `blocking`.
 *
 * For unit normals n0 and n1, the unit direction with the largest common
 * margin min(d.n0, d.n1) is their normalized bisector, attaining
 * sqrt((1 + n0.n1) / 2). It is positive exactly when the normals are not
 * antiparallel, so a free cone between the two surfaces exists exactly then.
 * Antiparallel normals leave no direction that separates from both, and the
 * stem refuses by name. Inputs are unchanged.
 *
 * @evidence contracts/common.md#principled-implementation The normalized bisector maximizes min(d.n0, d.n1) over unit d, with value sqrt((1 + n0.n1) / 2), positive unless the normals are antiparallel.
 * @evidence contracts/common.md#clear-and-simple-design One owner of the two-surface goal, shared by the stem aim and the look-ahead.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty free cone refuses rather than being guessed through.
 * @evidence contracts/common.md#meaningful-documentation States the margin argument and the refusal condition.
 * @evidence contracts/modeling.md#spatial-conventions Normals and the result are unit head-frame directions.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no station.
 * @evidence contracts/modeling.md#shared-boundaries Separates from both actual surfaces of the one host collider.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical geometry only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 */
export function escapeHumanFaceHairRootedStem(
  normal: IAutoMovieVector3,
  blocking: IAutoMovieVector3,
): IAutoMovieVector3 {
  const sum = Vector3.add(normal, blocking);
  if (!(Vector3.length(sum) > 0))
    throw new Error(
      "A rooted hair stem lies between antiparallel surfaces with no free direction.",
    );
  return Vector3.normalize(sum);
}
