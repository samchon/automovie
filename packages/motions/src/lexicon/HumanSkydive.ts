import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanSkydive,
} from "@automovie/interface";

import { planSkydive } from "../airborne/planSkydive";

/**
 * A parachute jump: the exit, the arched freefall, the canopy steered by its
 * toggles, the flare and the parachute landing fall or a stand-up landing
 * (`planSkydive`). Register `HumanSkydive.skydive` to use it.
 */
export namespace HumanSkydive {
  /**
   * Jump from an edge under a parachute. It cancels no other action and leaves
   * no channel to overlays.
   */
  export const skydive: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSkydive.IParams> =
    {
      name: "skydive",
      interrupts: {},
      yields: [],
      plan: planSkydive,
    };
}
