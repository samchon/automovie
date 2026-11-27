import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanRope,
} from "@automovie/interface";

import { planRope } from "../rope/internal/planRope";

/**
 * Crossings on an anchored rope: a hand-over-hand climb with a foot lock, a
 * rappel or fast-rope descent, a hanging or monkey-crawl traverse and a swing
 * to a named landing (`planRope`). Register `HumanRope.rope` to use it.
 */
export namespace HumanRope {
  /**
   * Climb, descend, traverse or swing on a named rope. It cancels no other
   * action and leaves no channel to overlays.
   */
  export const rope: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanRope.IParams> =
    {
      name: "rope",
      interrupts: {},
      yields: [],
      plan: planRope,
    };
}
