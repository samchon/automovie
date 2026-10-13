import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One articulated owner's rigid motion in the head frame:
 * `x' = R (x - pivot) + pivot + translation`.
 *
 * The pivot is the joint's current centre (a shaped landmark, plus the
 * condylar offset for the jaw), so a rotation turns about the joint and not
 * about the origin, and the translation is what the joint adds after turning.
 * `resolveHumanFaceArticulation` produces one per owner from the expression
 * weights; `poseHumanFaceSurface` applies them through the attachments.
 *
 * @evidence contracts/common.md#principled-implementation The existing articulation owner supplies rotation about the shaped joint pivot followed by translation; poseHumanFaceSurface evaluates that same affine rigid image for each registered owner weight.
 * @evidence contracts/common.md#clear-and-simple-design Quaternion, pivot and translation keep transform ordering explicit instead of hiding the joint point in a matrix or rotating about the origin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This output represents source-authored joint kinematics, not measured physiological motion; the type alone validates no unit quaternion, physical budget or skinning admission.
 * @evidence contracts/common.md#meaningful-documentation The exact affine formula and metre pivot/translation distinguish shape-following joint location from authored expression rotation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no quaternion composition or vertex transformation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Owner-motion reuse belongs to articulation/pose evaluation, not this output schema.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three caller values create no rig, surface or motion-cache handle.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceRigidMotion {
  /** Unit quaternion of the rotation about the pivot. */
  rotation: IAutoMovieQuaternion;

  /** Point the rotation turns about, in metres. */
  pivot: IAutoMovieVector3;

  /** Translation added after the rotation, in metres. */
  translation: IAutoMovieVector3;
}
