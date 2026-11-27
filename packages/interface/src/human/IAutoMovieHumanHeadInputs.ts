import type { IAutoMovieHumanHeadIdentity } from "./IAutoMovieHumanHeadIdentity";

/**
 * Public head dimensions and body context in world millimetres. The head lane
 * consumes this record without invoking the retired head-chain assembly.
 *
 * The caller owns this fixed-size record and its head identity.
 */
export interface IAutoMovieHumanHeadInputs {
  /** Public head identity in world millimetres. */
  head: IAutoMovieHumanHeadIdentity;

  /** Stature, mm. */
  height: number;

  /**
   * Derived requested-height control for the optional neck exterior display,
   * mm; not a public neck-length measurement or the head plan's stature
   * closure.
   */
  neckLength: number;

  /** Infrathyroid neck circumference in the plane normal to the neck axis, mm. */
  neck: number;

  /**
   * Resolved base tape and named-point heights, world mm; these are not a
   * horizontal section or a ring's mean height.
   */
  neckBase: {
    /** Tape through the back, side and front neck points, mm. */
    girth: number;

    /** C7 spinous-process height above the standing surface, mm. */
    cervicaleHeight: number;

    /** Side neck point height above the standing surface, mm. */
    sideNeckPointHeight: number;

    /** Front neck point at the jugular notch above the standing surface, mm. */
    suprasternaleHeight: number;

    /**
     * Common C7 X in the ankle-midpoint body frame, world mm; the local neck
     * prior is registered to this generating datum.
     */
    cervicaleOrigin: number;
  };

  /** Masculine-feminine coordinate, -1 to 1. */
  sex: number;

  /** Adiposity coordinate, -1 to 1. */
  fat: number;
}
