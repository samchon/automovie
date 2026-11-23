import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanRope,
} from "@automovie/interface";

import { planRope } from "../rope/planRope";

/**
 * Crossings on an anchored rope: a hand-over-hand climb with a foot lock, a
 * rappel or fast-rope descent, a hanging or monkey-crawl traverse and a
 * swing to a named landing (`planRope`). Register `HumanRope.rope` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the crossings and the registration.
 * @evidence contracts/development/design.md#principled-representation A law record whose parameters name the rope; the planner owns every dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one registered law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No rope is special-cased; its line is read from the prop.
 */
export namespace HumanRope {
  /** Climb, descend, traverse or swing on a named rope. It cancels no other action and leaves no channel to overlays. */
  export const rope: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanRope.IParams> =
    {
      name: "rope",
      interrupts: {},
      yields: [],
      plan: planRope,
    };
}
