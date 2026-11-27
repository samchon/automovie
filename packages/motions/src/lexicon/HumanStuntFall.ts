import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanStuntFall,
} from "@automovie/interface";

import { planStuntFall } from "../reaction/internal/planStuntFall";

/**
 * Staged stunt falls: a tumble or seat slide down a staircase and a high fall
 * onto a pad or the ground (`planStuntFall`). Register
 * `HumanStuntFall.stuntFall` to use it.
 */
export namespace HumanStuntFall {
  /**
   * Fall down a staircase or from a ledge. It cancels no other action and
   * leaves no channel to overlays.
   */
  export const stuntFall: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStuntFall.IParams> =
    {
      name: "stuntFall",
      interrupts: {},
      yields: [],
      plan: planStuntFall,
    };
}
