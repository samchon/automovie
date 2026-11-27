import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanCover,
} from "@automovie/interface";

import { planCover } from "../../cover/internal/planCover";

/**
 * Moving in cover along staged walls and doors: a corner peek, a wall sidle, a
 * crouched pass under a window and a door breach, each planned against the
 * named prop (`planCover`). A door stack composes sidles to the door's side and
 * `passThrough` entries in order. Register `HumanCover.moveInCover` to use it.
 */
export namespace HumanCover {
  /**
   * Move in cover along a named wall, window or door. It cancels no other
   * action and leaves no channel to overlays.
   */
  export const moveInCover: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCover.IParams> =
    {
      name: "moveInCover",
      interrupts: {},
      yields: [],
      plan: planCover,
    };
}
