import type {
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";

import type { swingTwistRange } from "../kinematics/swingTwistRange";
import { clampJointRomValues } from "./clampJointRomValues";

/**
 * Project one joint into admitted axis intervals, preserving null rest and
 * forcing specified immobile axes to zero. Specified nonfinite angles first
 * become neutral. A swing cap blends toward the box point nearest neutral;
 * unrestricted multi-turn overrides are outside the bisection's
 * monotonic-segment guarantee.
 *
 * A ball joint whose constraint declares `swingTwist`, on a bone with axes in
 * its frame (the caller's `rig`, or the humanoid tables' through
 * `swingTwistRange.of`), is instead brought into its range as a rotation
 * (`swingTwistRange.project`: its direction along its great circle from rest,
 * its twist clamped) and read back in the reading the three-angle box prefers;
 * a joint already inside comes back as given.
 *
 * @param joint The joint's clinical angles.
 * @param constraint Its resolved range.
 * @param rig The bone's frame as the caller's rig resolves it; the humanoid
 *   tables' when absent.
 * @returns The joint in range: a value, the input record itself where every
 *   projected angle is its own, else a fresh record; neither is to be edited.
 */
export const clampJointRom: (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
  rig?: swingTwistRange.IPrepared,
) => IAutoMovieJointPose = (
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint,
  rig?: swingTwistRange.IPrepared,
): IAutoMovieJointPose =>
  clampJointRomValues.into(
    joint.bone,
    joint.flexion,
    joint.abduction,
    joint.twist,
    constraint,
    rig,
    joint,
  );
