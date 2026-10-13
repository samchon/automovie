import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";
import { humanBodyShoulderTtRotation } from "./humanBodyShoulderTtRotation";

/**
 * Shortest SO(3) geodesic separation of two humerothoracic TT orientations.
 *
 * The absolute quaternion dot removes the `q`/`-q` representation twin. At both elevation poles, TT angle triples that denote the same orientation therefore compare through rotation rather than angle spelling. A dot deficit below 1e-12 returns zero as a numerical identity policy, so nearby distinct rotations also collapse within that window. Admitted finite angles produce a separation in [0,180] degrees; this is no clinical tolerance.
 *
 * @evidence contracts/common.md#principled-implementation Shared TT rotations become normalized quaternions, whose absolute dot yields shortest SO(3) angle independent of quaternion sign and pole angle spelling.
 * @evidence contracts/common.md#clear-and-simple-design One same-humerus check and one bounded quaternion-dot read produce the scalar distance used by corrective kernels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Different humeri refuse; finite admitted angles remain the caller premise, and the declared 1e-12 dot identity window is a numerical approximation rather than measured shoulder capacity.
 * @evidence contracts/common.md#meaningful-documentation The comment states degree range, representation twins, equivalent pole spelling and the window's collapse of nearby distinct orientations.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed TT rotations, four dot products and one inverse cosine require constant work independent of mesh or corrective-table size.
 * @evidence contracts/performance.md#reuse-equivalent-work Both inputs reuse the same TT rotation owner; this scalar utility retains no pair cache and corrective family reuse belongs to its calling weight planner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the degree scalar escapes; temporary quaternions become unreachable after return and no source arrays, handles or tasks are retained.
 */
export function humanBodyShoulderOrientationDistance(
  a: IAutoMovieHumanBodyShoulderPose,
  b: IAutoMovieHumanBodyShoulderPose,
): number {
  if (a.bone !== b.bone)
    throw new Error("A shoulder orientation distance needs one humerus.");
  const qa: ReturnType<typeof humanBodyShoulderTtRotation> = humanBodyShoulderTtRotation(a);
  const qb: ReturnType<typeof humanBodyShoulderTtRotation> = humanBodyShoulderTtRotation(b);
  const dot: number = Math.abs(qa.x * qb.x + qa.y * qb.y + qa.z * qb.z + qa.w * qb.w);
  return 1 - dot < 1e-12
    ? 0
    : (2 * Math.acos(Math.min(1, dot))) / (Math.PI / 180);
}
