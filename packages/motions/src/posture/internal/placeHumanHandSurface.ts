import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Place the wrist whose rigidly carried local hand surface meets a world point.
 *
 * @param local The surface point relative to the wrist, in the hand rest frame,
 *   metres.
 * @param at The desired world surface point, metres.
 * @param turn The hand's original world rotation from rest, without added
 *   normalization.
 * @returns A fresh wrist point and the original borrowed rotation.
 */
export function placeHumanHandSurface(
  local: IAutoMovieVector3,
  at: IAutoMovieVector3,
  turn: IAutoMovieQuaternion,
): IAutoMovieMotionHumanHand.IWrist {
  return placed(at, turn, Quaternion.rotateVector(turn, local));
}

/** Fixed local surface and hand rotation for repeated world-point targets. */
export namespace placeHumanHandSurface {
  /**
   * Prepare an immutable surface offset and world rotation.
   *
   * Inputs are the fixed local metre offset and original world quaternion;
   * every call reads its actual world target and returns fresh point/rotation
   * records. The rotated local offset is independent of world translation, so
   * its original quaternion-vector computation is performed once and each
   * current target receives the same original subtraction. Private scalar
   * snapshots and the shared placed assembler separate invariant rotation from
   * varying target translation. Arithmetic grouping and unnormalized rotation
   * semantics match cold placement; copied output rotations prevent a consumer
   * from changing later prepared results. One quaternion-vector rotation is
   * shared by Q reads; each read still subtracts its actual target and
   * allocates fresh result, point and rotation records. Runtime improvement is
   * unmeasured. Local offset and rotation values are copied before preparation;
   * caller edits and output mutation cannot change them, while genuinely
   * changed fixed geometry requires new preparation. The returned closure owns
   * one quaternion and one rotated vector until its action releases it, with no
   * body reference, time history, input record or handle retained.
   */
  export function prepare(
    local: IAutoMovieVector3,
    turn: IAutoMovieQuaternion,
  ): (at: IAutoMovieVector3) => IAutoMovieMotionHumanHand.IWrist {
    const rotation: IAutoMovieQuaternion = { ...turn };
    const shift: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      ...local,
    });
    return (at: IAutoMovieVector3): IAutoMovieMotionHumanHand.IWrist =>
      placed(at, { ...rotation }, shift);
  }
}

/** Keep the original final subtraction and ownership in one numerical owner. */
function placed(
  at: IAutoMovieVector3,
  turn: IAutoMovieQuaternion,
  shift: IAutoMovieVector3,
): IAutoMovieMotionHumanHand.IWrist {
  return { point: Vector3.subtract(at, shift), rotation: turn };
}
