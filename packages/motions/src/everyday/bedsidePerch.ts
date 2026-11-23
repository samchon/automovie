import type {
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanSeated,
} from "@automovie/interface";

import { HumanObject } from "../perform/HumanObject";

/**
 * Sit on a fixed bed's long edge, pause, then stand. Enter facing away
 * from the chosen edge with the feet on the floor within reach of the seat.
 * The bed supplies the edge's position, outward heading and depth. The
 * ordinary sit and rise supply the support transfer and reach checks.
 *
 * @param chain The standing performer's chain.
 * @param bed A model with a level `leftSide` or `rightSide` seat affordance.
 * @param placement The bed's fixed world placement, in metres and yaw degrees.
 * @param side The long edge on the bed's local positive X (`left`) or negative X (`right`).
 * @param seconds Time seated after settling, in seconds. Defaults to one second.
 * @returns A chain with the sit and rise appended.
 * @throws {HumanRefusal} If the chosen edge has no seat affordance. The sit and rise can also refuse unreachable supports at planning time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the entry stance, local edge convention, world placement, seated duration and refusals.
 * @evidence contracts/development/implementation.md#principled-implementation Resolves the named edge through the object's seat affordance and sequences the standard seated base transfer and return.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolves one affordance, then appends the two existing actions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the seat frame and depth from the bed. Reach, timing and pose stay with the action planners.
 * @evidence contracts/development/implementation.md#efficient-algorithms One lookup across the model's affordances, followed by two chain appends.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Resolves the seat once for the sit. The rise reads the resulting seated entry.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The result retains the appended action parameters as part of the caller's chain. The helper retains no state.
 */
export function bedsidePerch(
  chain: IAutoMovieMotionHumanChain,
  bed: IAutoMovieMotionHumanObject.IModel,
  placement: Extract<IAutoMovieMotionHumanObject.Placement, { yaw: number }>,
  side: "left" | "right",
  seconds: number = 1,
): IAutoMovieMotionHumanChain {
  const edge: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    bed,
    placement,
    side === "left" ? "leftSide" : "rightSide",
  );
  return chain.sit({ seat: edge, hold: seconds }).rise();
}
