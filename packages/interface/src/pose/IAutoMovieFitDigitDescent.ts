/** What one descent reads. */
export namespace IAutoMovieFitDigitDescent {
  /** What one descent reads. */
  export interface IProps {
    /** The start, the variables' values. */
    start: readonly number[];

    /**
     * The primary residual, metres.
     *
     * Synchronously return a nonempty finite metre residual vector of fixed
     * length for borrowed coordinate values. The solver evaluates
     * finite-difference probes as well as trials; leave coordinates unchanged
     * and propagate failures. No callback is retained after descent.
     */
    primary: (x: readonly number[]) => number[];

    /**
     * The secondary residual, metres; empty when there is none.
     *
     * Synchronously return a fixed-length finite metre residual vector; an
     * empty vector disables the secondary task. Trial/probe coordinates are
     * borrowed and must not be mutated. Exceptions abort descent and the
     * callback is not retained.
     */
    secondary: (x: readonly number[]) => number[];

    /**
     * The variables projected into their range.
     *
     * Return a fresh finite coordinate vector with the same length and units as
     * start, projected into its admissible ranges. Leave borrowed inputs
     * unchanged; the initial point, derivative probes and accepted trials all
     * rely on this projection. Exceptions propagate and no callback is
     * retained.
     */
    project: (x: readonly number[]) => number[];

    /**
     * Positive finite variable resolution: the finite-difference step and the
     * stop.
     */
    step: number;

    /**
     * The primary residual's length at which the primary counts as met, at `x`
     * with its Jacobian.
     *
     * Read borrowed current coordinates and the primary Jacobian and return a
     * finite nonnegative metre residual-norm threshold. The callback is
     * synchronous, leaves both inputs unchanged and is discarded after descent;
     * failures propagate.
     */
    tolerance: (
      x: readonly number[],
      J1: readonly (readonly number[])[],
    ) => number;
  }
}
