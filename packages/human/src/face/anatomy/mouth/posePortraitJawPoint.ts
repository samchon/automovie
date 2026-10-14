import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Rotate mandibular tissue around an authored transverse hinge in head millimetres. Positive rotation opens inferiorly for tissue anterior to the hinge. A fixed weight is an attachment responsibility, not a muscle model; angle times weight makes the corresponding inverse exactly the same motion.
 *
 * @evidence contracts/common.md#principled-implementation A weighted degree rotation around an authored transverse hinge moves mandibular tissue rigidly.
 * @evidence contracts/common.md#clear-and-simple-design The same signed-angle owner serves forward and inverse attachment motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The plus/minus25 degree and unit-weight envelope is construction admission, not a measured physiological limit or muscle simulation.
 * @evidence contracts/common.md#meaningful-documentation Points and hinge use head millimetres; zero angle/weight returns an owned equal point.
 * @evidence contracts/performance.md#efficient-algorithms Finite checks and one quaternion/vector transform take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Face, lip, dental and jaw continuation consumers reuse this hinge implementation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned vector escapes and caller point/hinge remain unchanged.
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
  const result: IAutoMovieVector3 = Vector3.add(
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
