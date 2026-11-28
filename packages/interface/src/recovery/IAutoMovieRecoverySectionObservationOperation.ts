import type {
  IAutoMovieContourLoft64,
  IAutoMovieMeshPlaneCut,
  IAutoMovieMeshSectionOrientation,
  IAutoMoviePlaneFrameConstruction,
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoverySourceLineage,
} from "..";

/**
 * Callable boundary for observing and fitting all contours on one admitted
 * physical plane.
 */

export namespace IAutoMovieRecoverySectionObservationOperation {
  /**
   * Observe a prepared plane cut, fit each usable open or closed contour in
   * millimetres and retain local contact and fit diagnostics. Source-lineage
   * and accepted-fit callbacks use original contour ordinals.
   */

  export type Operation = (input: {
    /** Signed millimetre station along the registered source's cutting normal. */
    coordinateMm: number;

    /** Registered plane frame already translated to this station. */
    plane: ReturnType<IAutoMoviePlaneFrameConstruction.Operation>;

    /**
     * Raw cut contours and any exact source provenance from the prepared
     * slicer.
     */
    contours: ReturnType<ReturnType<IAutoMovieMeshPlaneCut.Prepare>>;

    /**
     * Original source-face sets keyed by the source incidence's unordered edge
     * addresses.
     */
    faceEdges: ReadonlyMap<string, ReadonlySet<number>>;

    /** Original source-face sets keyed by source vertex address. */
    vertexFaces: ReadonlyMap<number, ReadonlySet<number>>;

    /**
     * Admitted material orientation and source geometry evidence for closed
     * winding.
     */
    orientation: ReturnType<IAutoMovieMeshSectionOrientation.Operation>;

    /**
     * Physical fit tolerance, per-curve span budget and corner threshold in
     * degrees.
     */
    policy: Pick<
      IAutoMovieRecoveryInput,
      "cornerDegrees" | "toleranceMm" | "maxSpans"
    >;

    /** Optional curve name prefix, with section used when omitted. */
    name?: string;

    /**
     * Callback for each raw contour's observed source support and eventual
     * publication outcome.
     */
    onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void;

    /**
     * Callback for the internal accepted-span witness of a successfully fitted
     * contour.
     */
    onAcceptedFit?: (trace: {
      /** Original raw contour ordinal, including any contours whose fits failed. */
      contourIndex: number;

      /**
       * Whether the observer reversed the fit sample order to align the contour
       * winding.
       */
      reversed: boolean;

      /**
       * Accepted cubic span indices and their corresponding fitted sample
       * positions.
       */
      spans: Array<{
        /** Original accepted cubic span index within the fitted curve. */
        span: number;

        /** Index of the first sample used for this span in fitted point order. */
        first: number;

        /** Index of the last sample used for this span in fitted point order. */
        last: number;

        /**
         * Local fitted parameter values reported by the accepted-span callback
         * in sample order.
         */
        parameters: number[];
      }>;
    }) => void;
  }) => {
    /** Physical section and its fitted closed-loop coefficients. */
    section: IAutoMovieContourLoft64.ISection;

    /**
     * Station report with closed quality, open fits, contact points and
     * diagnostics.
     */
    report: IAutoMovieRecoveryMeshSections["reports"][number];

    /** Original source vertex support sets aligned with successful closed loops. */
    supports: Set<number>[];

    /** Original source face support sets aligned with successful closed loops. */
    faces: Set<number>[];

    /**
     * Original face support sets for open, degenerate or failed source
     * observations.
     */
    defects: Set<number>[];

    /** Count of physical point observations incorporated by successful fits. */
    observations: number;

    /** Count of cubic spans across the successful open and closed fits. */
    spans: number;
  };
}
