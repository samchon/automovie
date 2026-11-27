import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanGait,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanGaitMiddle } from "./HumanGaitMiddle";

/**
 * The length of the way from where the feet stand through the waypoints to the
 * destination, metres.
 */
export function HumanGaitDistance(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.IParams>,
): number {
  let from: IAutoMovieVector3 = HumanGaitMiddle(context);
  let length: number = 0;
  for (const to of [...(context.params.via ?? []), context.params.to]) {
    length += Math.hypot(to.x - from.x, to.z - from.z);
    from = to;
  }
  return length;
}
