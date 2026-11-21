import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanCrossing,
} from "@automovie/interface";

import { planNamedCrossing } from "../terrain/planNamedCrossing";

/**
 * Crossing named stage geometry: a step over, a hand-supported vault or a
 * jump over an obstacle, or a jump across the gap between two decks, each
 * planned by the existing step, support or jump law against the named
 * props' shapes and surfaces (`planNamedCrossing`). Register
 * `HumanTraversal.crossObstacle` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four crossings, the laws they reuse and the registration.
 * @evidence contracts/development/design.md#principled-representation A law record whose parameters name the fixtures; the planner owns every dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one registered law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fixture is special-cased; the geometry is read from the named props.
 */
export namespace HumanTraversal {
  /** Cross a named obstacle or the gap between two fixed surfaces. It cancels no other action and leaves no channel to overlays. */
  export const crossObstacle: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCrossing.IParams> =
    {
      name: "crossObstacle",
      interrupts: {},
      yields: [],
      plan: planNamedCrossing,
    };
}
