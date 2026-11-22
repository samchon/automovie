import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanTreeClimb,
} from "@automovie/interface";

import { planTreeClimb } from "../climbing/planTreeClimb";

/**
 * Climbing a tree by its lower branches, sitting astride one and climbing
 * down or dropping from the lowest (`planTreeClimb`). Register
 * `HumanTreeClimb.climbTree` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the moves and the registration.
 * @evidence contracts/development/design.md#principled-representation A law record whose parameters name the tree and a branch; the planner owns every dimension.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one registered law.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No tree is special-cased; its branches are read from the prop.
 */
export namespace HumanTreeClimb {
  /** Climb a tree, sit on a branch or climb down. It cancels no other action and leaves no channel to overlays. */
  export const climbTree: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTreeClimb.IParams> =
    {
      name: "climbTree",
      interrupts: {},
      yields: [],
      plan: planTreeClimb,
    };
}
