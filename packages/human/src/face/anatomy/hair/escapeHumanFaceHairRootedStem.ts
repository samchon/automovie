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
