import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanHand } from "./HumanHand";

/**
 * Place the wrist whose rigidly carried local hand surface meets a world point.
 *
 * @param local The surface point relative to the wrist, in the hand rest frame, metres.
 * @param at The desired world surface point, metres.
 * @param turn The hand's original world rotation from rest, without added normalization.
 * @returns A fresh wrist point and the original borrowed rotation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States local/world frames, metre units, unchanged quaternion policy, cold borrowed-rotation ownership and prepare's copied fixed geometry/fresh output contract.
 * @evidence contracts/development/implementation.md#principled-implementation Rigid placement puts the wrist at at-minus-turn(local). Cold calls preserve exact rotate-then-subtract grouping; prepare computes that same fixed rotated offset once and applies the original subtraction to every actual world target.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One numeric assembly owner serves cold wrist placement and its fixed-geometry prepared companion.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rotation normalization, contact approximation, target snapping or tolerance is added.
 * @evidence contracts/development/implementation.md#efficient-algorithms One original quaternion-vector rotation and subtraction per cold call; fixed consumers may prepare the rotation of their immutable offset once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Cold and prepare use the same final placed assembler. The prepared producer copies local offset and quaternion values before computing one shift, isolating caller/output edits; changed fixed geometry requires another preparation and no target point is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Cold placement retains nothing and returns a fresh point with borrowed rotation. A prepared action owns one quaternion and shifted vector until release, returning fresh point/rotation records without a body, time history, input record or handle.
 */
export function placeHumanHandSurface(
  local: IAutoMovieVector3,
  at: IAutoMovieVector3,
  turn: IAutoMovieQuaternion,
): IAutoMovieMotionHumanHand.IWrist {
  return placed(at, turn, Quaternion.rotateVector(turn, local));
}

/**
 * Fixed local surface and hand rotation for repeated world-point targets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the prepared function's fixed geometry and fresh output boundary.
 * @evidence contracts/development/design.md#principled-representation A constant world rotation carries a constant local wrist offset rigidly; only the actual world target varies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prepare function serves ArmTarget fixed goals and the existing hand-target alignment producer without another wrist representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No point, goal, pose, fit result or sampled time is retained.
 */
export namespace placeHumanHandSurface {
  /**
   * Prepare an immutable surface offset and world rotation.
   *
   * Inputs are the fixed local metre offset and original world quaternion; every call reads its actual world target and returns fresh point/rotation records.
   * The rotated local offset is independent of world translation, so its original quaternion-vector computation is performed once and each current target receives the same original subtraction.
   * Private scalar snapshots and the shared placed assembler separate invariant rotation from varying target translation.
   * Arithmetic grouping and unnormalized rotation semantics match cold placement; copied output rotations prevent a consumer from changing later prepared results.
   * One quaternion-vector rotation is shared by Q reads; each read still subtracts its actual target and allocates fresh result, point and rotation records. Runtime improvement is unmeasured.
   * Local offset and rotation values are copied before preparation; caller edits and output mutation cannot change them, while genuinely changed fixed geometry requires new preparation.
   * The returned closure owns one quaternion and one rotated vector until its action releases it, with no body reference, time history, input record or handle retained.
   */
  export function prepare(
    local: IAutoMovieVector3,
    turn: IAutoMovieQuaternion,
  ): (at: IAutoMovieVector3) => IAutoMovieMotionHumanHand.IWrist {
    const rotation: IAutoMovieQuaternion = { ...turn };
    const shift: IAutoMovieVector3 = Quaternion.rotateVector(rotation, { ...local });
    return (at: IAutoMovieVector3): IAutoMovieMotionHumanHand.IWrist => placed(at, { ...rotation }, shift);
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
