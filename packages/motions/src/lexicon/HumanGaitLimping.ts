import type {
  IAutoMovieMotionHumanGait,
  IAutoMovieMotionHumanWalkGait,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { HumanGait } from "./HumanGait";

/**
 * The limp's slow walk on shortened steps, the spared leg stood on briefly
 * (`HumanGait.LIMP`); the right leg spared when the parameters name none.
 */
export function HumanGaitLimping(
  params: IAutoMovieMotionHumanGait.ILimp,
): IAutoMovieMotionHumanWalkGait {
  const walking: IAutoMovieMotionHumanWalkGait = walk.walking(
    HumanGait.LIMP.froude,
  );
  return {
    ...walking,
    step: (froude: number): number =>
      HumanGait.LIMP.step * walking.step(froude),
    limp: { side: params.side ?? "right", share: HumanGait.LIMP.share },
  };
}
