/**
 * Contracts used by HumanCarriedCouplingLoad.lean.
 *
 * @evidence contracts/development/common.md#meaningful-documentation pitch: Forward root inclination in degrees. roll: Sideways root inclination in degrees.
 * @evidence contracts/development/design.md#principled-representation pitch: Forward root inclination in degrees. roll: Sideways root inclination in degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedCouplingLoad.ts (HumanCarriedCouplingLoad.lean, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanCarriedCouplingLoad.lean.
 */
export namespace IAutoMovieMotionHumanCarriedCouplingLoad {
  /**
   * The tip of a bearer standing still in the coupling's stance that brings its own centre and its share of the borne centre, the borne body riding it, over the midpoint of its feet. Result returned by HumanCarriedCouplingLoad.lean. Degrees forward (`pitch`) and toward the bearer's right (`roll`), as `HumanCarriedLean.tipped` takes them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation pitch: Forward root inclination in degrees. roll: Sideways root inclination in degrees.
   * @evidence contracts/development/design.md#principled-representation pitch: Forward root inclination in degrees. roll: Sideways root inclination in degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanCarriedCouplingLoad.ts (HumanCarriedCouplingLoad.lean, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanCarriedCouplingLoad.lean.
   */
  export type ILeanResult = {
    /** Forward root inclination in degrees. */
    pitch: number;
    /** Sideways root inclination in degrees. */
    roll: number;
  };
}
