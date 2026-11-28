import type {
  IAutoMovieMeshPlaneCut,
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
  IAutoMovieRecoverySavedSection,
  IAutoMovieRecoverySlabs,
} from "..";

/** Callable exact raw-cut binding for a caller-attested saved section. */

export namespace IAutoMovieRecoverySavedSectionCutsBindingOperation {
  /**
   * Compare a complete saved lineage population with one fresh raw section cut.
   * Verify original contour order, face incidence and admitted closure. Return
   * a bound raw section or the first refusal diagnosis.
   */

  export type Operation = (input: {
    /**
     * Caller-bound saved section and its complete raw contour publication
     * population.
     */
    saved: IAutoMovieRecoverySavedSection;

    /** Fresh raw cut with actual contour and exact emitting face evidence. */
    contours: ReturnType<ReturnType<IAutoMovieMeshPlaneCut.Prepare>>;

    /**
     * Prepared source geometry and original face incidence for recomputing
     * broad support.
     */
    prepared: ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation>;

    /** Synchronous checkpoint called when comparing the raw contour records. */
    checkpoint: () => void;
  }) =>
    | {
        /** Successful exact raw-cut comparison. */
        status: "bound";
        /**
         * Bound station observation with fresh exact face provenance and
         * retained publication metadata.
         */
        value: IAutoMovieRecoverySlabs["sections"][number];
      }
    | {
        /** Refused raw contour binding. */
        status: "refused";
        /**
         * First source incidence or population comparison failure at this saved
         * station.
         */
        diagnostic: string;
      };
}
