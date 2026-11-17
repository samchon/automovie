import type { IAutoMovieRecoveryDiskChart } from "../../index";

/**
 * Choose a private disk boundary anchor and exact physical quarter measures.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Observed physical boundary turning angles in degrees, aligned with the boundary cycle. Boundary-cycle ordinals meeting the declared turning-angle feature threshold.
 * @evidence contracts/development/design.md#principled-representation Boundary-cycle ordinals meeting the declared turning-angle feature threshold.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareRecoveryDiskBoundary, RecoveryDiskChart share IAutoMovieRecoveryDiskBoundaryPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Ordered vertex indices following one admitted physical boundary cycle; the first index is not repeated.
 */

export namespace IAutoMovieRecoveryDiskBoundaryPreparationOperation {
  /**
   * Choose a private disk boundary anchor and exact physical quarter measures.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Observed physical boundary turning angles in degrees, aligned with the boundary cycle. Boundary-cycle ordinals meeting the declared turning-angle feature threshold.
   * @evidence contracts/development/design.md#principled-representation Boundary-cycle ordinals meeting the declared turning-angle feature threshold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface prepareRecoveryDiskBoundary, RecoveryDiskChart share IAutoMovieRecoveryDiskBoundaryPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Ordered vertex indices following one admitted physical boundary cycle; the first index is not repeated.
   */

  export type Operation = (
    input: IAutoMovieRecoveryDiskChart.Input,
    fail: (reason: string) => never,
  ) => {
    /** Observed physical boundary turning angles in degrees, aligned with the boundary cycle. */
    turns: number[];

    /** Boundary-cycle ordinals meeting the declared turning-angle feature threshold. */
    features: number[];

    /** Boundary-cycle ordinal selected as the stable chart parameter origin. */
    anchor: number;

    /** Ordered vertex indices following one admitted physical boundary cycle; the first index is not repeated. */
    cycle: number[];

    /** Exact integer edge lengths expressed in the common binary exponent of the physical boundary lengths. */
    units: bigint[];

    /** Exact integer sum of all edge lengths in that shared binary exponent. */
    total: bigint;

    /** Produces a finite number mantissa and binary shift for one nonnegative exact integer length. */
    scaled: (value: bigint) => {
      /** Leading at-most-53-bit numeric significand of the exact nonnegative length integer. */
      mantissa: number;
      /** Binary right-shift count used to form the numeric mantissa; retained for physical scale restoration. */
      shift: number;
    };

    /** Measured closed physical boundary length in millimetres. */
    perimeterMm: number;

    /** One quarter of the measured physical boundary perimeter, in millimetres. */
    quarterMm: number;
  };
}
