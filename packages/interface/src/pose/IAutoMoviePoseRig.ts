import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieRestFrame } from "./IAutoMovieRestFrame";

/**
 * The rig a pose's clinical angles are read through: its skeleton and the
 * host's per-bone axis and rest-frame tables, the same three inputs
 * {@link resolvePose} takes.
 *
 * A function that must turn a joint's `[flexion, abduction, twist]` into its
 * bone-local rotation and back (to difference or blend poses as rotations
 * instead of as angle triples) receives them as one value, so the forward and
 * inverse maps cannot be given different tables.
 */
export interface IAutoMoviePoseRig {
  /** The rig the poses articulate; its bones may declare axes and ranges. */
  skeleton: IAutoMovieSkeleton;

  /**
   * Clinical axes for the bones that declare none, such as
   * `AutoMovieEngineHumanoidJointAxes`; a bone in neither uses the default basis.
   */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /**
   * Rest frames that read the angles as clinical, such as
   * `AutoMovieEngineHumanoidRestFrame`; an absent bone's angles are rest-relative.
   */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}
