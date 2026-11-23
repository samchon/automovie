import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointConstraint } from "../skeleton/IAutoMovieJointConstraint";

/**
 * Effective clinical domain `decomposeJointRotation` uses to choose between the
 * two equivalent angle charts of one quaternion.
 *
 * Every rotation has a second Euler-style reading, and full-turn aliases of
 * each. With a constraint, the inverse scores both readings with
 * `jointRomOvershoot` against it and keeps the one with less overshoot, the
 * principal reading on a tie. Chart selection never clamps a coordinate or
 * changes this domain, so a rotation no chart admits still reports its
 * overshoot downstream. The chain plant passes one domain per joint.
 */
export interface IAutoMovieJointRotationDomain {
  /**
   * Rig bone whose coordinates the inverse reports, used to name the scored
   * joint.
   */
  bone: AutoMovieHumanoidBone;

  /**
   * The caller's effective range of motion for that bone; `null` keeps the
   * principal reading, because no range prefers one chart over another.
   */
  constraint: IAutoMovieJointConstraint | null;
}
