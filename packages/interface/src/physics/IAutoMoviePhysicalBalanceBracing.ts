import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalBalance } from "./IAutoMoviePhysicalBalance";

/**
 * Capture-point root-target feedback with a bounded horizontal travel envelope.
 *
 * @evidence contracts/development/design.md#principled-representation The actual support hull determines the closest correction while measured COM height and exhaustion jointly control effort withdrawal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalBalanceBracing consumes the existing balance assessment; the provider owns the standing-recovery envelope. physicalBalanceBracing returns a new displacement to advancePhysicalBalance without writing body poses or applying forces.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Invalid height/travel policies throw; a failed step alone cannot withdraw effort and a correction request does not prove regained balance.
 * @evidence contracts/development/common.md#meaningful-documentation Separates measured COM and hull geometry from the provider's recovery-height and travel policy. Explains when strength becomes zero and why shift is only motor-target intent.
 */
export namespace IAutoMoviePhysicalBalanceBracing {
  /**
   * Capture-point feedback toward the actual support hull under an explicit
   * root-target travel bound. This requests a bounded motor target adjustment,
   * never an extra force or a pose write. A failed step alone cannot turn off
   * remaining effort: withdrawal additionally requires the declared measured
   * COM-height recovery limit. The provider owns that limit and its meaning.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates measured COM and hull geometry from the provider's recovery-height and travel policy.
   * @evidence contracts/development/design.md#principled-representation World metres and a dimensionless exhaustion flag determine a horizontal target correction with a nonnegative metre bound.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalBalanceBracing consumes the existing balance assessment; the provider owns the standing-recovery envelope.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A failed step alone cannot withdraw effort: exhaustion and the measured height limit must both apply.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains when strength becomes zero and why shift is only motor-target intent.
   * @evidence contracts/development/design.md#principled-representation rootStrength is zero or one; shift is a world-axis metre displacement with zero Y, capped by maximumRootShift.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalBalanceBracing returns a new displacement to advancePhysicalBalance without writing body poses or applying forces.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No outside-hull correction yields zero shift, and requesting the correction does not prove balance was regained.
   */
  export type IResult = {
    /** Zero only when exhausted and actual COM height is below the recovery limit; otherwise one. */
    rootStrength: number;
    /**
     * New world-axis root-target displacement in metres, y zero. Points toward
     * the closest hull boundary and is capped; zero when no outside-hull correction exists.
     */
    shift: IAutoMovieVector3;
  };
}
