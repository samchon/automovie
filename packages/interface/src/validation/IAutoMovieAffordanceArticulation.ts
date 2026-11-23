/**
 * Admission result for resolving an authored articulation input to its
 * independent coordinate.
 */
export namespace IAutoMovieAffordanceArticulation {
  /**
   * Fresh result of AffordanceArticulation.input, which follows an acyclic
   * articulation chain, checks each coordinate's range and inverts only
   * explicitly reversible couplings. Input maps/affordances are borrowed and
   * unchanged. Callers admitting an entire state must separately refuse
   * multiple inputs to the same independent degree.
   */
  export type Input =
    | {
        /**
         * This input reached an independent articulation through valid ranges
         * and permitted inverses.
         */
        success: true;

        /**
         * Stable affordance id of the terminal independent articulation, not
         * necessarily the originally authored id.
         */
        id: string;

        /**
         * Resolved independent travel: degrees for hinge/knob/crank/wheel,
         * metres for slider/button/pedal/trigger.
         */
        travel: number;
      }
    | {
        /**
         * Admission failed; id/travel describe a rejected coordinate, not a
         * usable output.
         */
        success: false;

        /**
         * Original requested id for reference failure; otherwise the
         * articulation where range or coupling admission first failed.
         */
        id: string;

        /**
         * Rejected travel in this id's articulation units; reference failure
         * retains the original value and range failure may carry NaN or
         * infinity.
         */
        travel: number;

        /**
         * Reference: absent/nonarticulating/cyclic chain; range: nonfinite or
         * out of bounds; follower: reverse input not permitted; inverse: no
         * unique legal upstream inverse.
         */
        kind: "reference" | "range" | "follower" | "inverse";

        /**
         * Immediate upstream follows.id for follower/inverse failures; absent
         * for reference and range failures.
         */
        leader?: string;
      };
}
