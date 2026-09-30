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
