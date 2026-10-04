import type { IAutoMovieHumanPersonBoneFrame } from "./IAutoMovieHumanPersonBoneFrame";

/**
 * A bone's rest and posed world frames, in metres in the shared Y-up,
 * +Z-forward frame.
 *
 * @evidence contracts/common.md#principled-implementation A rig bone is described by where it rests and where the pose puts it.
 * @evidence contracts/common.md#clear-and-simple-design Two frames.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both frames come from the owning resolver; neither is defaulted here.
 * @evidence contracts/common.md#meaningful-documentation States both members, units and frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Frames define no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Frames are not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Frames emit no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Metres, Y up, +Z forward.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Frames build no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Frames are not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Frames carry no anatomical value of their own.
 * @evidenceExclude contracts/anatomy.md#permitted-range Frames admit nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Frames are derived, not a caller input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoneFrames {
  /** The rest world frame. */
  rest: IAutoMovieHumanPersonBoneFrame;

  /** The posed world frame. */
  posed: IAutoMovieHumanPersonBoneFrame;
}
