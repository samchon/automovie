import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalBalance } from "./IAutoMoviePhysicalBalance";

/** Capture-point root-target feedback with a bounded horizontal travel envelope. */
export namespace IAutoMoviePhysicalBalanceBracing {
  /**
   * Capture-point feedback toward the actual support hull under an explicit
   * root-target travel bound. This requests a bounded motor target adjustment,
   * never an extra force or a pose write. A failed step alone cannot turn off
   * remaining effort: withdrawal additionally requires the declared measured
   * COM-height recovery limit. The provider owns that limit and its meaning.
   */
  export type IInput = {
    /** Actual balance prediction and contact hull. */ assessment: IAutoMoviePhysicalBalance.IResult;
    /** Actual world COM, metres. */ center: IAutoMovieVector3;
    /** World floor height, metres. */ floor: number;
    /** Positive COM height below which standing recovery is withdrawn. */ minimumCenterHeight: number;
    /** Maximum horizontal root-target adjustment, metres. */ maximumRootShift: number;
    /** Sustained loss/landing failure has exhausted the recovery time budget. */ exhausted: boolean;
  };

  /**
   * Capture-point feedback toward the actual support hull under an explicit
   * root-target travel bound. This requests a bounded motor target adjustment,
   * never an extra force or a pose write. A failed step alone cannot turn off
   * remaining effort: withdrawal additionally requires the declared measured
   * COM-height recovery limit. The provider owns that limit and its meaning.
   */
  export type IResult = {
    /**
     * Zero only when exhausted and actual COM height is below the recovery
     * limit; otherwise one.
     */
    rootStrength: number;
    /**
     * New world-axis root-target displacement in metres, y zero. Points toward
     * the closest hull boundary and is capped; zero when no outside-hull
     * correction exists.
     */
    shift: IAutoMovieVector3;
  };
}
