import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanStuntFall,
} from "@automovie/interface";

import { planStuntFall } from "../reaction/planStuntFall";

/**
 * Staged stunt falls: a tumble or seat slide down a staircase and a high
 * fall onto a pad or the ground (`planStuntFall`). Register
 * `HumanStuntFall.stuntFall` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the falls and the registration.
 * @evidence contracts/development/design.md#principled-representation A law record whose parameters name the props; the planner owns every dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one registered law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No staircase or pad is special-cased; each is read from its prop.
 */
export namespace HumanStuntFall {
  /** Fall down a staircase or from a ledge. It cancels no other action and leaves no channel to overlays. */
  export const stuntFall: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStuntFall.IParams> =
    {
      name: "stuntFall",
      interrupts: {},
      yields: [],
      plan: planStuntFall,
    };
}
