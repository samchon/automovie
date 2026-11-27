/** Contracts used by HumanCarriedLean.coupled. */
export namespace IAutoMovieMotionHumanCarriedLean {
  /**
   * The tip of a coupled carry as a layer, for a `bearing` performed over an
   * action that keeps the trunk for itself (a walk), where the bearing's own
   * tip is not taken. Input tip of HumanCarriedLean.coupled. The pair's balance
   * (`HumanCarriedCouplingLoad.lean`), degrees forward and toward the right.
   */
  export type ICoupledTip = {
    /** Forward root inclination in degrees. */
    pitch: number;
    /** Sideways root inclination in degrees. */
    roll: number;
  };
}
