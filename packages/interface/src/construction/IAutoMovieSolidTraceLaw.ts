import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Data and callback contracts shared by the SolidTraceLaw operations. */
export namespace IAutoMovieSolidTraceLaw {
  /**
   * An equation affine in world point/part phase at fixed t, with the
   * derivatives used by implicit tracing. Residual units differ between phase,
   * angle and reference-arc laws.
   */
  export interface ILaw {
    /**
     * Scalar parameter constraint g(P,phi,t), with units determined by the
     * selected law.
     */
    g(p: AutoMovieVector3Tuple, phi: number, t: number): number;

    /**
     * [dg/dP,dg/dphi], valid for the constructors' point/phase-affine
     * constraints.
     */
    grad(t: number): [AutoMovieVector3Tuple, number];

    /** Partial derivative dg/dt with world point/part phase held fixed. */
    gt(p: AutoMovieVector3Tuple, t: number): number;

    /**
     * Second total-derivative remainder after the solver's
     * Jacobian-times-acceleration and grad(P).Q_A terms.
     */
    extra(
      p: AutoMovieVector3Tuple,
      dp: AutoMovieVector3Tuple,
      t: number,
    ): number;

    /**
     * Seed angle from a world point for angle mode; phase/arc constructors
     * return unused zero placeholders.
     */
    angle(p: AutoMovieVector3Tuple): number;
  }
}
