import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceRigidMotion } from "../structures/IAutoMovieHumanFaceRigidMotion";

type Attachments = NonNullable<
  IAutoMovieHumanFaceBasis["surfaces"][number]["attachments"]
>;

/** The 3x3 matrix of a unit quaternion, row major, read by rotating the axes. */
const matrixOf = (
  rotation: IAutoMovieHumanFaceRigidMotion["rotation"],
): number[] => {
  const x = Quaternion.rotateVector(rotation, Vector3.create(1, 0, 0));
  const y = Quaternion.rotateVector(rotation, Vector3.create(0, 1, 0));
  const z = Quaternion.rotateVector(rotation, Vector3.create(0, 0, 1));
  return [x.x, y.x, z.x, x.y, y.y, z.y, x.z, y.z, z.z];
};

/**
 * Exact inverse of `poseHumanFaceSurface` for the same attachments and motions.
 *
 * One vertex's blend is affine, `M_v(p) = L p + c` with
 * `L = I + sum w_o (R_o - I)` and `c = sum w_o (pivot_o + t_o - R_o pivot_o)`,
 * so the rest position is `L^-1 (p' - c)`, solved by Cramer's rule. Offline
 * preparation uses this to carry a source pose into rest space, which is how
 * an authored expression endpoint becomes a residual over the articulation.
 * A blend whose rotations cancel to a singular `L` is refused, because such a
 * vertex has no rest position that reproduces the pose; an unattached vertex
 * is returned unchanged. Inputs are never mutated; the result is fresh.
 *
 * @evidence contracts/common.md#principled-implementation Per vertex the blend is affine, p' = L p + c with L = I + sum w (R - I) and c = sum w (pivot + t - R pivot); the inverse is L^-1 (p' - c) by Cramer's rule with the determinant tested against 1e-12, so a blend whose rotations cancel is refused instead of inverted. This is exactly the forward map in poseHumanFaceSurface.
 * @evidence contracts/common.md#clear-and-simple-design One accumulation pass and one 3x3 solve per attached vertex.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation Derives the affine form, states exactness and the singular refusal.
 * @evidence contracts/modeling.md#spatial-conventions Same basis-metre head frame as poseHumanFaceSurface.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping unposeHumanFaceSurface is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels unposeHumanFaceSurface defines and consumes no parameter channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry unposeHumanFaceSurface decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries unposeHumanFaceSurface constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation unposeHumanFaceSurface owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source unposeHumanFaceSurface carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range unposeHumanFaceSurface admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority unposeHumanFaceSurface defines no input through which a caller shapes a human form.
 */
export function unposeHumanFaceSurface(
  posed: readonly number[],
  attachments: Attachments,
  motions: ReadonlyMap<string, IAutoMovieHumanFaceRigidMotion>,
): number[] {
  const count = posed.length / 3;
  const linear = new Map<number, number[]>();
  const offset = new Map<number, IAutoMovieVector3>();
  for (const attachment of attachments) {
    const motion = motions.get(attachment.owner);
    if (motion === undefined)
      throw new Error(
        "Facial attachment names an owner without motion: " + attachment.owner,
      );
    const r = matrixOf(motion.rotation);
    const shift = Vector3.subtract(
      Vector3.add(motion.pivot, motion.translation),
      Quaternion.rotateVector(motion.rotation, motion.pivot),
    );
    const rows = attachment.rows;
    for (let i = 0; i < rows.length; i += 2) {
      const vertex = rows[i];
      const weight = rows[i + 1];
      const l = linear.get(vertex) ?? [1, 0, 0, 0, 1, 0, 0, 0, 1];
      for (let k = 0; k < 9; k++)
        l[k] += weight * (r[k] - (k % 4 === 0 ? 1 : 0));
      linear.set(vertex, l);
      const c = offset.get(vertex) ?? Vector3.create();
      offset.set(vertex, Vector3.add(c, Vector3.scale(shift, weight)));
    }
  }
  const output = posed.slice();
  for (const [vertex, l] of linear) {
    if (vertex >= count)
      throw new Error("Facial attachment names a vertex the surface lacks.");
    const c = offset.get(vertex)!;
    const b = [
      posed[3 * vertex] - c.x,
      posed[3 * vertex + 1] - c.y,
      posed[3 * vertex + 2] - c.z,
    ];
    const det =
      l[0] * (l[4] * l[8] - l[5] * l[7]) -
      l[1] * (l[3] * l[8] - l[5] * l[6]) +
      l[2] * (l[3] * l[7] - l[4] * l[6]);
    if (!(Math.abs(det) > 1e-12))
      throw new Error(
        "A facial blend of rotations is singular at vertex " +
          vertex +
          "; no rest position reproduces its pose.",
      );
    const inverse = [
      (l[4] * l[8] - l[5] * l[7]) / det,
      (l[2] * l[7] - l[1] * l[8]) / det,
      (l[1] * l[5] - l[2] * l[4]) / det,
      (l[5] * l[6] - l[3] * l[8]) / det,
      (l[0] * l[8] - l[2] * l[6]) / det,
      (l[2] * l[3] - l[0] * l[5]) / det,
      (l[3] * l[7] - l[4] * l[6]) / det,
      (l[1] * l[6] - l[0] * l[7]) / det,
      (l[0] * l[4] - l[1] * l[3]) / det,
    ];
    for (let row = 0; row < 3; row++)
      output[3 * vertex + row] =
        inverse[3 * row] * b[0] +
        inverse[3 * row + 1] * b[1] +
        inverse[3 * row + 2] * b[2];
  }
  return output;
}
