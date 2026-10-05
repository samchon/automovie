import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One bone's rest frame in body space: its head and its world orientation on
 * the shaped body, before any pose.
 *
 * @evidence contracts/common.md#principled-implementation Names the world rest frame the skeleton resolver already returns per bone.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries the resolver's frame unchanged.
 * @evidence contracts/common.md#meaningful-documentation States what the frame is and when it is read.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Metres and a unit quaternion in the body's right-handed space.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis owns the source landmarks.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBoneWorldRest {
  /** The bone's head in body space, metres. */
  position: IAutoMovieVector3;

  /** The bone's rest orientation in body space. */
  rotation: IAutoMovieQuaternion;
}
