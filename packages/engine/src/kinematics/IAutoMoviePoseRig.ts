import {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";

/**
 * The rig a pose's clinical angles are read through: its skeleton and the
 * host's per-bone axis and rest-frame tables, the same three inputs
 * {@link resolvePose} takes.
 *
 * A function that must turn a joint's `[flexion, abduction, twist]` into its
 * bone-local rotation and back (to difference or blend poses as rotations
 * instead of as angle triples) receives them as one value, so the forward and
 * inverse maps cannot be given different tables.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the rig is for and each member's precedence and default.
 * @evidence contracts/development/design.md#principled-representation The skeleton with its two tables is exactly what fixes the map between clinical angles and bone-local rotations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, each already an input of `resolvePose`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface skeleton and the engine's axis and rest-frame types.
 */
export interface IAutoMoviePoseRig {
  /** The rig the poses articulate; its bones may declare axes and ranges. */
  skeleton: IAutoMovieSkeleton;

  /**
   * Clinical axes for the bones that declare none, such as
   * `HUMANOID_JOINT_AXES`; a bone in neither uses the default basis.
   */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /**
   * Rest frames that read the angles as clinical, such as
   * `HUMANOID_REST_FRAME`; an absent bone's angles are rest-relative.
   */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
}
