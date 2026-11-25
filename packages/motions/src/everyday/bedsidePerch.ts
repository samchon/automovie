import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanSeated,
} from "@automovie/interface";

import { HumanObject } from "../perform/HumanObject";

/** The record of `IBedsidePerchPlacement`'s site. */
type IBedsidePerchPlacement = { yaw: number };

/**
 * Sit on a fixed bed's long edge, pause, then stand. Enter facing away from the
 * chosen edge with the feet on the floor within reach of the seat. The bed
 * supplies the edge's position, outward heading and depth. The ordinary sit and
 * rise supply the support transfer and reach checks.
 *
 * @param chain The standing performer's chain.
 * @param bed A model with a level `leftSide` or `rightSide` seat affordance.
 * @param placement The bed's fixed world placement, in metres and yaw degrees.
 * @param side The long edge on the bed's local positive X (`left`) or negative
 *   X (`right`).
 * @param seconds Time seated after settling, in seconds. Defaults to one
 *   second.
 * @returns A chain with the sit and rise appended.
 * @throws {HumanRefusal} If the chosen edge has no seat affordance. The sit and
 *   rise can also refuse unreachable supports at planning time.
 */
export function bedsidePerch(
  chain: IAutoMovieMotionHumanChain,
  bed: IAutoMovieMotionHumanObject.IModel,
  placement: Extract<
    IAutoMovieMotionHumanObject.Placement,
    IBedsidePerchPlacement
  >,
  side: AutoMovieHumanSide,
  seconds: number = 1,
): IAutoMovieMotionHumanChain {
  const edge: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    bed,
    placement,
    side === "left" ? "leftSide" : "rightSide",
  );
  return chain.sit({ seat: edge, hold: seconds }).rise();
}
