import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanWallRun,
} from "@automovie/interface";

import { planWallRun } from "../terrain/planWallRun";

/**
 * Using a wall's face as a brief foot support: a wall step, or a run up the
 * face to a cat hang from its top (`planWallRun`). A tic-tac composes a wall
 * step and a `jump` to the redirected landing, and a wall flip a wall step
 * and a `jump` with a backward somersault. Register `HumanWallRun.wallRun`
 * to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the moves, the compositions and the registration.
 * @evidence contracts/development/design.md#principled-representation A law record whose parameters name the wall; the planner owns every dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one registered law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No wall is special-cased; geometry is read from the prop.
 */
export namespace HumanWallRun {
  /** Step on or run up a named wall's face. It cancels no other action and leaves no channel to overlays. */
  export const wallRun: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanWallRun.IParams> =
    {
      name: "wallRun",
      interrupts: {},
      yields: [],
      plan: planWallRun,
    };
}
