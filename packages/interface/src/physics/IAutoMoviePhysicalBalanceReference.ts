import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalSimulationInput } from "./IAutoMoviePhysicalSimulationInput";
import type { IAutoMoviePhysicalTargetInterval } from "./IAutoMoviePhysicalTargetInterval";

/**
 * The completed fitted balance reference at a replan boundary and the authored
 * placements at that same boundary. The completed fitted balance reference at a
 * replan boundary and the authored placements at that same boundary.
 */
export namespace IAutoMoviePhysicalBalanceReference {
  /**
   * The completed fitted balance reference at a replan boundary and the
   * authored placements at that same boundary. A replan in the next interval
   * starts from the previous plan's endpoint; a revision inside the interval
   * starts at the preceding native tick of the previous plan. Without a
   * contiguous previous plan there is no completed reference.
   */
  export type IInput = {
    /** Body whose authored targets bound the interval. */ body: IAutoMoviePhysicalSimulationInput.IBody;
    /** Current interval's authored end target. */ target: IAutoMoviePhysicalSimulationInput.ITarget;
    /** The previous fitted plan, if any. */ previous:
      | IAutoMoviePhysicalTargetInterval.IPlan
      | undefined;
    /** Enclosing cache interval. */ step: number;
    /** Replan boundary, seconds on the native tick grid. */ start: number;
    /** Declared cache frequency, hertz. */ rate: number;
  };

  /**
   * The completed fitted balance reference at a replan boundary and the
   * authored placements at that same boundary. A replan in the next interval
   * starts from the previous plan's endpoint; a revision inside the interval
   * starts at the preceding native tick of the previous plan. Without a
   * contiguous previous plan there is no completed reference.
   */
  export type IResult =
    | {
        /** Fitted placements already delivered at the boundary. */ completed: Record<
          string,
          IAutoMovieRigidTransform
        >;
        /** Authored placements at the same boundary. */ before: Record<
          string,
          IAutoMovieRigidTransform
        >;
      }
    | undefined;
}
