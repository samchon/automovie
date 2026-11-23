import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanSkydive,
} from "@automovie/interface";

import { planSkydive } from "../airborne/planSkydive";

/**
 * A parachute jump: the exit, the arched freefall, the canopy steered by
 * its toggles, the flare and the parachute landing fall or a stand-up
 * landing (`planSkydive`). Register `HumanSkydive.skydive` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the jump and the registration.
 * @evidence contracts/development/design.md#principled-representation A law record whose parameters name the edge and the altitudes; the planner owns every dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one registered law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No exit is special-cased; its edge is read from the prop.
 */
export namespace HumanSkydive {
  /** Jump from an edge under a parachute. It cancels no other action and leaves no channel to overlays. */
  export const skydive: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanSkydive.IParams> =
    {
      name: "skydive",
      interrupts: {},
      yields: [],
      plan: planSkydive,
    };
}
