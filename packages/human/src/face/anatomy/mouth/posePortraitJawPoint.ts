import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Rotate mandibular tissue around an authored transverse hinge in head
 * millimetres. Positive rotation opens inferiorly for tissue anterior to the
 * hinge. A fixed weight is an attachment responsibility, not a muscle model;
 * angle times weight makes the corresponding inverse exactly the same motion.
 *
 * @evidence contracts/common.md#principled-implementation A rotation of a point about the +X axis through the hinge by angle times weight, using the engine's quaternion rotation: it is rigid for a fixed weight and, because only the product of angle and weight enters, the inverse is exactly the motion with the negated angle. The premises are finite inputs, an angle within the jaw's range and a weight in [0, 1], which are checked, and the result is checked for overflow.
 * @evidence contracts/common.md#clear-and-simple-design One rotation used by the lips, the jaw continuation, the tongue and the lower dentition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture or subject is named, and no foreign method is replaced.
 * @evidence contracts/common.md#meaningful-documentation The comment states the hinge frame, that positive rotation opens inferiorly for tissue anterior to the hinge, and that a weight is an attachment responsibility and not a muscle model.
 * @evidence contracts/modeling.md#spatial-conventions Points and the hinge are head-frame millimetres, the axis is +X and the angle is degrees.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function rotates a point and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel of its own; the jaw-open channel that feeds it is documented on the expression.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary; sharing one rotation is what keeps lower lip, lower enamel and tongue moving as one mandible.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function beyond a named angle about a named hinge.
 */
export function posePortraitJawPoint(
  point: IAutoMovieVector3,
  hinge: IAutoMovieVector3,
  angle: number,
  weight: number,
): IAutoMovieVector3 {
  if (
    ![
      point.x,
      point.y,
      point.z,
      hinge.x,
      hinge.y,
      hinge.z,
      angle,
      weight,
    ].every(Number.isFinite) ||
    Math.abs(angle) > 25 ||
    weight < 0 ||
    weight > 1
  )
    throw new Error(
      "Jaw motion needs finite points, a signed angle in [-25,25] degrees and attachment weight in [0,1].",
    );
  if (angle === 0 || weight === 0) return { ...point };
  const result = Vector3.add(
    hinge,
    Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, angle * weight),
      Vector3.subtract(point, hinge),
    ),
  );
  if (![result.x, result.y, result.z].every(Number.isFinite))
    throw new Error("Jaw motion exceeds its finite coordinate domain.");
  return result;
}
