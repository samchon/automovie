import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One world frame of a bone: its joint position in metres and its orientation,
 * in the shared Y-up, +Z-forward frame.
 *
 * @evidence contracts/common.md#principled-implementation A bone's rest or posed frame is exactly a position and a rotation.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values come from the body's pose resolver; nothing is defaulted here.
 * @evidence contracts/common.md#meaningful-documentation States units and frame.
 * @evidence contracts/modeling.md#spatial-conventions Metres, Y up, +Z forward.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A frame defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A frame is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A frame emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A frame builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation A frame is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A frame carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range A frame admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A frame is not a caller input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoneFrame {
  /** The joint position, metres. */
  position: IAutoMovieVector3;

  /** The world orientation. */
  rotation: IAutoMovieQuaternion;
}
