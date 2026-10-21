import { Quaternion } from "@automovie/engine/math/Quaternion";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Apply a five-coordinate local step while retaining a rotation and unit t.
 * The first three coordinates are a left rotation vector in radians; the final
 * two are coordinates in the supplied current translation tangent basis.
 *
 * @evidence contracts/common.md#principled-implementation Engine axis-angle rotation implements the SO3 exponential and rotates each current R column on the left. Translation is normalize(t+B*delta), whose zero derivative is DN(t)B and equals B only for an exact unit tangent. Signed Sampson residuals cancel this positive normalization scale, so their model differentiates the complete quotient using raw B. Map owners separately preserve the current radius and differentiate that actual chart.
 * @evidence contracts/common.md#clear-and-simple-design One camera-update owner matches the optimizer's five local derivatives, while generic quaternion rotation remains in engine and the numerical state remains ordinary row-major arrays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Euler-angle clipping, affine rotation, fixed baseline length or forced sign supplies a camera. Nonrepresentable steps or a zero direction throw instead of returning the previous pose.
 * @evidence contracts/common.md#meaningful-documentation States radians-to-engine-degrees conversion, left composition, row-major columns and local sphere retraction with no metric scale.
 * @evidence contracts/performance.md#efficient-algorithms One axis-angle construction, three vector rotations and one three-coordinate norm cost constant time and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One increment quaternion rotates all three columns; the tangent basis comes from the same local derivative model rather than being reconstructed with a different axis choice.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New pose arrays transfer to the caller and no borrowed state, image, quaternion cache or external handle remains.
 */
export function stepRecoveryRelativePose(
  pose: {
    rotation: readonly number[];
    translation: readonly [number, number, number];
  },
  tangent: readonly (readonly [number, number, number])[],
  step: readonly number[],
): { rotation: number[]; translation: [number, number, number] } {
  if (step.length !== 5 || !step.every(Number.isFinite) || tangent.length !== 2)
    throw new Error("camera-refinement: finite five-coordinate step required");
  const angle: number = Math.hypot(step[0]!, step[1]!, step[2]!);
  if (!Number.isFinite(angle))
    throw new Error("camera-refinement: nonrepresentable angular step");
  const quaternion: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: step[0]!, y: step[1]!, z: step[2]! },
    (angle * 180) / Math.PI,
  );
  const rotation: number[] = new Array<number>(9);
  for (let column: number = 0; column < 3; column++) {
    const value: IAutoMovieVector3 = Quaternion.rotateVector(quaternion, {
      x: pose.rotation[column]!,
      y: pose.rotation[3 + column]!,
      z: pose.rotation[6 + column]!,
    });
    rotation[column] = value.x;
    rotation[3 + column] = value.y;
    rotation[6 + column] = value.z;
  }
  const direction: number[] = pose.translation.map(
    (value: number, at: number): number =>
      value + tangent[0]![at]! * step[3]! + tangent[1]![at]! * step[4]!,
  );
  const norm: number = Math.hypot(...direction);
  if (!rotation.every(Number.isFinite) || !(norm > 0) || !Number.isFinite(norm))
    throw new Error("camera-refinement: nonrepresentable pose update");
  return {
    rotation,
    translation: [
      direction[0]! / norm,
      direction[1]! / norm,
      direction[2]! / norm,
    ],
  };
}
