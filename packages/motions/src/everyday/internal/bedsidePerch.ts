import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanSeated,
} from "@automovie/interface";

import { AutoMovieMotionHumanObject } from "../../perform/AutoMovieMotionHumanObject";

/*
 * Sit on a fixed bed's long edge, pause, then stand. Enter facing away from the
 * chosen edge with the feet on the floor within reach of the seat. The bed
 * supplies the edge's position, outward heading and depth. The ordinary sit and
 * rise supply the support transfer and reach checks.
 * Parameter chain: The standing performer's chain.
 * Parameter bed: A model with a level `leftSide` or `rightSide` seat affordance.
 * Parameter placement: The bed's fixed world placement, in metres and yaw degrees.
 * Parameter side: The long edge on the bed's local positive X (`left`) or negative
 * X (`right`).
 * Parameter seconds: Time seated after settling, in seconds. Defaults to one
 * second.
 * Returns: A chain with the sit and rise appended.
 * If the chosen edge has no seat affordance. The sit and
 * rise can also refuse unreachable supports at planning time.
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
  const edge: IAutoMovieMotionHumanSeated.ISeat = AutoMovieMotionHumanObject.seat(
    bed,
    placement,
    side === "left" ? "leftSide" : "rightSide",
  );
  return chain.sit({ seat: edge, hold: seconds }).rise();
}

/*
 * The record of `IBedsidePerchPlacement`'s site.
 */
type IBedsidePerchPlacement = { yaw: number };
