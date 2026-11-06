import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";

/**
 * Public head dimensions and body context in world millimetres. The head lane
 * consumes this record without invoking the retired head-chain assembly.
 *
 * @evidence contracts/common.md#principled-implementation Carries anatomical inputs and the body context needed to place the head; no generated surface is an input.
 * @evidence contracts/common.md#clear-and-simple-design One record is shared by the body law, head layout and debug consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person selector or compensating dimension.
 * @evidence contracts/common.md#meaningful-documentation Names the units and meaning of the dimensions and normalized controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An input type has no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record owns no computation or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns this fixed-size record and its head identity.
 */
export interface IAutoMovieHumanHeadInputs {
  /** Public head identity in world millimetres. */
  head: IAutoMovieHumanHeadIdentity;

  /** Stature, mm. */
  height: number;

  /** Derived requested-height control for the optional neck exterior display, mm; not a public neck-length measurement or the head plan's stature closure. */
  neckLength: number;

  /** Infrathyroid neck circumference in the plane normal to the neck axis, mm. */
  neck: number;

  /** Resolved base tape and named-point heights, world mm; these are not a horizontal section or a ring's mean height. */
  neckBase: {
    /** Tape through the back, side and front neck points, mm. */
    girth: number;
    /** C7 spinous-process height above the standing surface, mm. */
    cervicaleHeight: number;
    /** Side neck point height above the standing surface, mm. */
    sideNeckPointHeight: number;
    /** Front neck point at the jugular notch above the standing surface, mm. */
    suprasternaleHeight: number;
  };

  /** Masculine-feminine coordinate, -1 to 1. */
  sex: number;

  /** Adiposity coordinate, -1 to 1. */
  fat: number;
}
