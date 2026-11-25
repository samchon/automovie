/**
 * The values of the freedoms a law leaves a held thing's grasp or pose, chosen
 * by what the fitted body makes of them: the one shared chooser of a held
 * tool's pose (`StrikingRoll.chosen`) and of a kept grip on a handle
 * (`pushSled`).
 *
 * A law states a pose by values (a roll about a tool's line, a lean inside a
 * cone, a turn about a round handle, a place along its grip band) and judges
 * each by fitting the body to it and reading how far the fitted hand misses, at
 * one instant or at several, the worst of them counting. The values are tried
 * in the law's order of preference, nearest the asked pose first, and the first
 * held exactly is taken; when none is, the least missed is refined by a pattern
 * search (Hooke and Jeeves 1961) inside each freedom's bounds, or round its
 * period for a wrapped one.
 */
export namespace IAutoMovieMotionHumanFreedomChoice {
  /**
   * One freedom of a pose: `bounded` between its least and greatest value, or
   * `wrapped`, a turn that repeats after its period (a round handle's turn
   * about its axis), with no bound. Its `step` is the refinement's first step,
   * in the freedom's own unit (degrees or metres); 0 holds the freedom at its
   * tried value.
   */
  export type Freedom =
    | {
        /**
         * Coordinate-domain discriminant: finite bounded interval or periodic
         * wrapped coordinate.
         */
        kind: "bounded";
        /** Search increment in the coordinate's own units. */
        step: number;
        /** Inclusive lower coordinate bound in the coordinate's own units. */
        least: number;
        /** Inclusive upper coordinate bound in the coordinate's own units. */
        greatest: number;
      }
    | {
        /**
         * Coordinate-domain discriminant: finite bounded interval or periodic
         * wrapped coordinate.
         */
        kind: "wrapped";
        /** Search increment in the coordinate's own units. */
        step: number;
        /** Positive wrapping period in the coordinate's own units. */
        period: number;
      };

  /** The freedoms of a pose as a law states them for `chosen`. */
  export interface IProblem {
    /**
     * The values to judge first, in the law's order of preference, nearest the
     * asked pose first.
     */
    tried: readonly (readonly number[])[];

    /** Each value's freedom, in the values' order. */
    freedoms: readonly IAutoMovieMotionHumanFreedomChoice.Freedom[];

    /**
     * How far the fitted hand misses the pose the values give, metres, at each
     * instant the pose is judged at, read lazily and in order.
     *
     * @param values The freedoms' values, inside their bounds.
     * @returns The misses, not negative.
     */
    judge(values: readonly number[]): Iterable<number>;
  }

  /** The chosen values and the worst miss the judge read for them, metres. */
  export interface IChoice {
    /** The freedoms' values, inside their bounds. */
    values: number[];

    /** The worst of the misses at every instant, metres. */
    miss: number;
  }
}
