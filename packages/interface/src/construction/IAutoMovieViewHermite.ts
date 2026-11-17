

/** Data and callback contracts shared by the ViewHermite operations. */
export namespace IAutoMovieViewHermite {
  /**
     * Prepared spans in the selected unnormalized source parameter.
     *
     * @evidence contracts/development/design.md#principled-representation Retains one shared first/second jet per source knot and fixed-degree coefficients on each positive interval.
     * @evidence contracts/development/design.md#minimal-and-owned-surface Existing abscissae/ordinates and three derived arrays suffice for all source reads.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Holds no emitted sections or fitted source points.
     * @evidence contracts/development/common.md#meaningful-documentation Members distinguish parameter jets from normalized per-span polynomial coefficients.
     */
    export interface ICurve {
      /** Source parameter knots, shared with the owning admitted natural source. */
      xs: readonly number[];
      /** Source values, shared with the same owner. */
      ys: readonly number[];
      /** First derivatives in the selected source parameter at every knot. */
      first: readonly number[];
      /** Second derivatives in that same parameter at every knot. */
      second: readonly number[];
      /** Increment coefficients c1..c5 on each unit span, with the left source value as c0. */
      coefficients: readonly (readonly number[])[];
    }
}
