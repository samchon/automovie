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
 * Observe and fit every contour on one fixed private section. An optional
 * collection name prefixes curve identities; an optional acquisition observer
 * receives copied original face incidence after local fitting, including
 * rejected contours. Observer exceptions escape the fitting catch.
 */

export namespace IAutoMovieRecoverySectionObservationOperation {
  /**
   * Observe and fit every contour on one fixed private section. An optional
   * collection name prefixes curve identities; an optional acquisition observer
   * receives copied original face incidence after local fitting, including
   * rejected contours. Observer exceptions escape the fitting catch.
   */

  export type Operation = (input: {
    /**
     * Signed section-plane coordinate along the registered unit sweep axis, in
     * millimetres.
     */
    coordinateMm: number;

    /**
     * Registered right-handed cutting frame; positions and scalar levels use
     * its common physical millimetre chart.
     */
    plane: ReturnType<IAutoMoviePlaneFrameConstruction.Operation>;

    /**
     * Every raw plane-cut contour, including open paths, contacts and
     * unsupported junction chains.
     */
    contours: ReturnType<ReturnType<IAutoMovieMeshPlaneCut.Prepare>>;

    /** Canonical undirected edge identity to original incident-face set. */
    faceEdges: ReadonlyMap<string, ReadonlySet<number>>;

    /**
     * Original vertex index to incident original-face set; borrowed for this
     * observation pass.
     */
    vertexFaces: ReadonlyMap<number, ReadonlySet<number>>;

    /**
     * Prepared source-material side observer in the registered plane; it
     * supplies no generated normal field.
     */
    orientation: ReturnType<IAutoMovieMeshSectionOrientation.Operation>;

    /**
     * Borrowed explicit fitting thresholds and work bounds; this operation
     * introduces no inferred numerical policy.
     */
    policy: Pick<
      IAutoMovieRecoveryInput,
      "cornerDegrees" | "toleranceMm" | "maxSpans"
    >;

    /**
     * Caller-assigned stable semantic identity retained in generated
     * coefficient and observation records.
     */
    name?: string;

    /**
     * Optional synchronous acquisition observer; copied records belong to the
     * caller and callback exceptions escape fitting.
     */
    onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void;

    /**
     * Acquisition-only copied accepted trace, delivered outside the fitter
     * failure catch. Observer exceptions escape. Acceptance does not itself
     * imply the original fit met tolerance, and no historical accepted trace is
     * asserted.
     */
    onAcceptedFit?: (trace: {
      /**
       * Ordinal in this call's input.contours before fitting/rejection; a
       * one-contour replay reports zero, not its saved outer contour ordinal.
       */
      contourIndex: number;

      /**
       * True only when a closed contour's negative signed plane area caused its
       * input point order to reverse before fitting; open paths are not
       * reversed.
       */
      reversed: boolean;

      /**
       * Accepted spans in this contour's current fit order; adjacent spans
       * retain their shared observation separately.
       */
      spans: Array<{
        /**
         * Zero-based ordinal within this contour's accepted fit, independent of
         * source contour, section or publication ordinals.
         */
        span: number;

        /**
         * Inclusive first index in the fitting point list after any reversal;
         * closed input appends its reordered first point at index N, where N is
         * the raw point count.
         */
        first: number;

        /**
         * Inclusive last index in the same fitting list; N denotes the repeated
         * closed start, and a shared knot may be both one span's last and the
         * next span's first.
         */
        last: number;

        /**
         * One accepted dimensionless local t in [0,1] per inclusive point, from
         * initial chord parameters or accepted safeguarded Newton refinement;
         * neither raw cumulative mm h nor fitted physical phase.
         */
        parameters: number[];
      }>;
    }) => void;
  }) => {
    /** Saved-section ordinal in the input observation sequence. */
    section: IAutoMovieContourLoft64.ISection;

    /**
     * This section's coefficient-fit reports and unsupported observations,
     * preserving original contour order.
     */
    report: IAutoMovieRecoveryMeshSections["reports"][number];

    /**
     * Original source-incidence support assigned to the corresponding boundary
     * observations.
     */
    supports: Set<number>[];

    /**
     * Original source-face indices retained as incidence support; these never
     * become generated mesh indices.
     */
    faces: Set<number>[];

    /**
     * Original face supports of unsupported open, isolated or unrepresented
     * source contours.
     */
    defects: Set<number>[];

    /** Actual raw observation population processed by this operation. */
    observations: number;

    /**
     * Actual retained cubic-span population, separate from original observation
     * count.
     */
    spans: number;
  };
}
