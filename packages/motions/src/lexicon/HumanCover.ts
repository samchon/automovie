import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanCover,
} from "@automovie/interface";

import { planCover } from "../cover/planCover";

/**
 * Moving in cover along staged walls and doors: a corner peek, a wall
 * sidle, a crouched pass under a window and a door breach, each planned
 * against the named prop (`planCover`). A door stack composes sidles to the
 * door's side and `passThrough` entries in order. Register
 * `HumanCover.moveInCover` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the moves, the stack composition and the registration.
 * @evidence contracts/development/design.md#principled-representation A law record whose parameters name the props; the planner owns every dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one registered law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No wall or door is special-cased; geometry is read from the props.
 */
export namespace HumanCover {
  /** Move in cover along a named wall, window or door. It cancels no other action and leaves no channel to overlays. */
  export const moveInCover: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCover.IParams> =
    {
      name: "moveInCover",
      interrupts: {},
      yields: [],
      plan: planCover,
    };
}
