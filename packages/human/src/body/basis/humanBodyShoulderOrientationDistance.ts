import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";
import { humanBodyShoulderTtRotation } from "./humanBodyShoulderTtRotation";

/**
 * Shortest SO(3) geodesic separation of two humerothoracic TT orientations.
 *
 * The absolute quaternion dot removes the `q`/`-q` representation twin. At
 * both elevation poles, TT angle triples that denote the same orientation
 * therefore produce the same distance; a tight floating-point identity
 * tolerance avoids an apparent millionth-degree gap between equivalent
 * 180° gauges. The output lies in [0,180] degrees.
 */
export function humanBodyShoulderOrientationDistance(
  a: IAutoMovieHumanBodyShoulderPose,
  b: IAutoMovieHumanBodyShoulderPose,
): number {
  if (a.bone !== b.bone)
    throw new Error("A shoulder orientation distance needs one humerus.");
  const qa = humanBodyShoulderTtRotation(a);
  const qb = humanBodyShoulderTtRotation(b);
  const dot = Math.abs(qa.x * qb.x + qa.y * qb.y + qa.z * qb.z + qa.w * qb.w);
  return 1 - dot < 1e-12
    ? 0
    : (2 * Math.acos(Math.min(1, dot))) / (Math.PI / 180);
}
