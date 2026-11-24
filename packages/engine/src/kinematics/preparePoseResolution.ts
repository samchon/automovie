import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMoviePoseResolution,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
} from "@automovie/interface";

import { DEFAULT_JOINT_AXES } from "./constants/DEFAULT_JOINT_AXES";
import { jointToQuaternionOnBasis } from "./jointToQuaternionOnBasis";
import { normalizeJointAxes } from "./normalizeJointAxes";
import { resolvePoseBone } from "./resolvePoseBone";

/**
 * Raw ordered FK operations and the identity lent to immutable prepared rigs:
 * the interface contract.
 */
type IReader = IAutoMoviePoseResolution;

/** The factory's reader: its two methods as own data properties. */
const READER: IReader = {
  joint: (
    joint: IAutoMovieJointPose,
    axes: IAutoMovieJointAxes | undefined,
    frame: IAutoMovieRestFrame | undefined,
  ): IAutoMovieQuaternion =>
    jointToQuaternionOnBasis(
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
export function preparePoseResolution(): IReader {
  return { joint: READER.joint, bone: READER.bone };
}

/** Actual factory-reader provenance without claiming any numerical admission. */
export namespace preparePoseResolution {
  /**
   * Whether this reader is the factory's kind. The parameter type is the
   * contract: every reader the type admits is read as native.
   */
  export function isNative(
    _reader: ReturnType<typeof preparePoseResolution>,
  ): boolean {
    return true;
  }
}
