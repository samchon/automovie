/**
 * Contracts used by HumanCarriedLean.coupled.
 *
 * @evidence contracts/development/common.md#meaningful-documentation pitch: Forward root inclination in degrees. roll: Sideways root inclination in degrees.
 * @evidence contracts/development/design.md#principled-representation pitch: Forward root inclination in degrees. roll: Sideways root inclination in degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedLean.ts (HumanCarriedLean.coupled, tip).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanCarriedLean.coupled.
 */
export namespace IAutoMovieMotionHumanCarriedLean {
  /**
   * The tip of a coupled carry as a layer, for a `bearing` performed over an action that keeps the trunk for itself (a walk), where the bearing's own tip is not taken. Input tip of HumanCarriedLean.coupled. The pair's balance (`HumanCarriedCouplingLoad.lean`), degrees forward and toward the right.
   *
   * @evidence contracts/development/common.md#meaningful-documentation pitch: Forward root inclination in degrees. roll: Sideways root inclination in degrees.
   * @evidence contracts/development/design.md#principled-representation pitch: Forward root inclination in degrees. roll: Sideways root inclination in degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedLean.ts (HumanCarriedLean.coupled, tip).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanCarriedLean.coupled.
   */
  export type ICoupledTip = {
    /** Forward root inclination in degrees. */
    pitch: number;
    /** Sideways root inclination in degrees. */
    roll: number;
  };
}
