import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanCrossing,
} from "@automovie/interface";

import { planNamedCrossing } from "../../terrain/internal/planNamedCrossing";

/*
 * Crossing named stage geometry: a step over, a hand-supported vault or a jump
 * over an obstacle, or a jump across the gap between two decks, each planned by
 * the existing step, support or jump law against the named props' shapes and
 * surfaces (`planNamedCrossing`). Register `HumanTraversal.crossObstacle` to
 * use it.
 */
export namespace HumanTraversal {
  /*
   * Cross a named obstacle or the gap between two fixed surfaces. It cancels no
   * other action and leaves no channel to overlays.
   */
  export const crossObstacle: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCrossing.IParams> =
    {
      name: "crossObstacle",
      interrupts: {},
      yields: [],
      plan: planNamedCrossing,
    };
}
