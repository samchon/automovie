import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanWallRun,
} from "@automovie/interface";

import { planWallRun } from "../terrain/internal/planWallRun";

/**
 * Using a wall's face as a brief foot support: a wall step, or a run up the
 * face to a cat hang from its top (`planWallRun`). A tic-tac composes a wall
 * step and a `jump` to the redirected landing, and a wall flip a wall step and
 * a `jump` with a backward somersault. Register `HumanWallRun.wallRun` to use
 * it.
 */
export namespace HumanWallRun {
  /**
   * Step on or run up a named wall's face. It cancels no other action and
   * leaves no channel to overlays.
   */
  export const wallRun: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanWallRun.IParams> =
    {
      name: "wallRun",
      interrupts: {},
      yields: [],
      plan: planWallRun,
    };
}
