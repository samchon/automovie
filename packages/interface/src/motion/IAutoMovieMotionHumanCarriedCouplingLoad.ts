/** Contracts used by HumanCarriedCouplingLoad.lean. */
export namespace IAutoMovieMotionHumanCarriedCouplingLoad {
  /**
   * The tip of a bearer standing still in the coupling's stance that brings its
   * own centre and its share of the borne centre, the borne body riding it,
   * over the midpoint of its feet. Result returned by
   * HumanCarriedCouplingLoad.lean. Degrees forward (`pitch`) and toward the
   * bearer's right (`roll`), as `HumanCarriedLean.tipped` takes them.
   */
  export type ILeanResult = {
    /** Forward root inclination in degrees. */
    pitch: number;
    /** Sideways root inclination in degrees. */
    roll: number;
  };
}
