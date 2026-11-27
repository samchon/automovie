import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanTreeClimb,
} from "@automovie/interface";

import { planTreeClimb } from "../../climbing/internal/planTreeClimb";

/*
 * Climbing a tree by its lower branches, sitting astride one and climbing down
 * or dropping from the lowest (`planTreeClimb`). Register
 * `HumanTreeClimb.climbTree` to use it.
 */
export namespace HumanTreeClimb {
  /*
   * Climb a tree, sit on a branch or climb down. It cancels no other action and
   * leaves no channel to overlays.
   */
  export const climbTree: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanTreeClimb.IParams> =
    {
      name: "climbTree",
      interrupts: {},
      yields: [],
      plan: planTreeClimb,
    };
}
