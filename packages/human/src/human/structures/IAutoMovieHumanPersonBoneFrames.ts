import type { IAutoMovieHumanPersonBoneFrame } from "./IAutoMovieHumanPersonBoneFrame";

/**
 * A bone's rest and posed world frames, in metres in the shared Y-up,
 * +Z-forward frame.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoneFrames {
  /** The rest world frame. */
  rest: IAutoMovieHumanPersonBoneFrame;

  /** The posed world frame. */
  posed: IAutoMovieHumanPersonBoneFrame;
}
