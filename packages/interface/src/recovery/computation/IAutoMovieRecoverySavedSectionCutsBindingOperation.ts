import type {
  IAutoMovieMeshPlaneCut,
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
  IAutoMovieRecoverySavedSection,
  IAutoMovieRecoverySlabs,
} from "../../index";

/**
 * Compare a complete saved raw-contour population with one fresh exact cut.
 * Address sets and admitted closure verify contour identity only; curve names
 * and output indices remain caller-attested references. Newly emitted exact
 * faces are used even when the saved artifact retained broad incidence only.
 */

export namespace IAutoMovieRecoverySavedSectionCutsBindingOperation {
  /**
   * Compare a complete saved raw-contour population with one fresh exact cut.
   * Address sets and admitted closure verify contour identity only; curve names
   * and output indices remain caller-attested references. Newly emitted exact
   * faces are used even when the saved artifact retained broad incidence only.
   */

  export type Operation = (input: {
    /**
     * Caller-verified saved section whose full raw contour population is bound
     * by this observation.
     */
    saved: IAutoMovieRecoverySavedSection;

    /**
     * Every raw plane-cut contour, including open paths, contacts and
     * unsupported junction chains.
     */
    contours: ReturnType<ReturnType<IAutoMovieMeshPlaneCut.Prepare>>;

    /**
     * Source incidence or chart preparation shared by the operation; its
     * borrowed arrays remain stable for the pass.
     */
    prepared: ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation>;

    /**
     * Synchronous cooperative cancellation/work checkpoint; a thrown exception
     * aborts the current operation.
     */
    checkpoint: () => void;
  }) =>
    | {
        /**
         * Closed outcome discriminator; unavailable or ambiguous arms retain
         * diagnostics instead of fabricated successful data.
         */
        status: "bound";
        /**
         * Admitted saved-section binding value, present only on the successful
         * outcome arm.
         */
        value: IAutoMovieRecoverySlabs["sections"][number];
      }
    | {
        /**
         * Closed outcome discriminator; unavailable or ambiguous arms retain
         * diagnostics instead of fabricated successful data.
         */
        status: "refused";
        /**
         * Reason this particular result is unavailable or qualified only within
         * a stated numerical scope.
         */
        diagnostic: string;
      };
}
