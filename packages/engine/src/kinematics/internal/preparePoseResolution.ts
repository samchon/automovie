import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePoseResolution,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "../DEFAULT_JOINT_AXES";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";
import { resolvePoseBone } from "./resolvePoseBone";

/** The factory's reader: its two methods as own data properties. */
const READER: IReader = {
  joint: (
    joint: IAutoMovieJointPose,
    axes: IAutoMovieJointAxes | undefined,
    frame: IAutoMovieRestFrame | undefined,
  ): IAutoMovieQuaternion =>
    jointToQuaternionOnBasis.run(
      joint,
      normalizeJointAxes(
        axes === undefined ? DEFAULT_JOINT_AXES : axes,
        "jointToQuaternion axes",
      ),
      frame,
    ),
  bone: resolvePoseBone,
};

/**
 * Own pure joint-composition work within one synchronous motion evaluation. Raw
 * records retain their complete original getter, validation and arithmetic
 * order. Immutable prepared rigs additionally use this reader's identity to
 * scope their genuine static-input dependency rows; this raw adapter itself
 * never certifies a mutable transform from an identity or resampled tuple.
 * Release the reader when the synchronous evaluation ends.
 */
export function preparePoseResolution(): IAutoMoviePoseResolution {
  return { joint: READER.joint, bone: READER.bone };
}

/**
 * Raw ordered FK operations and the identity lent to immutable prepared rigs:
 * the interface contract.
 */
type IReader = IAutoMoviePoseResolution;
