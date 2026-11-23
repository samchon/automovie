import type {
  AutoMovieVector3Tuple,
  IAutoMovieReconstructRecovery,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryOpenContinuation,
} from "../../index";

/**
 * Consume saved open cubics and their explicit adjacent endpoint transport
 * through the engine. One maximal ordinary run owns its common parameter grid,
 * shared station boundaries and PCHIP station fields. Course joins and the
 * emitted PL surface are not certified C1/G1.
 */

export namespace IAutoMovieRecoveryOpenReconstructionOperation {
  /**
   * Consume saved open cubics and their explicit adjacent endpoint transport
   * through the engine. One maximal ordinary run owns its common parameter
   * grid, shared station boundaries and PCHIP station fields. Course joins and
   * the emitted PL surface are not certified C1/G1.
   */

  export type Operation = (
    bundle: IAutoMovieRecoveryMeshSections,
    graph: IAutoMovieRecoveryOpenContinuation,
  ) => Omit<
    ReturnType<IAutoMovieReconstructRecovery.Operation>,
    "construction"
  > & {
    /**
     * Source-free generated construction polylines retained for downstream
     * inspection.
     */
    construction: {
      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id: string;
      /**
       * Whether the observed path's actual incidence returns to its first
       * endpoint; no artificial closing segment is inferred.
       */
      closed: boolean;
      /**
       * Ordered physical construction or observation points in the enclosing
       * record's declared frame.
       */
      points: Readonly<AutoMovieVector3Tuple>[];
    }[];

    /**
     * Actual open-run generation and omission accounting, separate from closed
     * or analytic reconstruction.
     */
    openReports: {
      /**
       * Each attempted open continuation run with its actual emission and
       * qualification outcome.
       */
      runs: {
        /**
         * Stable identity within the owning chart, boundary or occurrence
         * registry; equal coordinates do not create identity.
         */
        id: string;

        /**
         * First saved-section ordinal included in the recorded continuation
         * run.
         */
        firstSection: number;

        /** Last saved-section ordinal included in the recorded continuation run. */
        lastSection: number;

        /** Ordered saved coefficient identities used by this continuation run. */
        curves: string[];

        /**
         * Whether the run actually emitted geometry; this does not certify
         * source coverage or fidelity.
         */
        generated: boolean;

        /**
         * Actual termination or qualification reason; null, where allowed,
         * means no local failure was recorded.
         */
        reason: string | null;

        /** Actual vertex population of this generated run or observed component. */
        vertices: number;

        /**
         * Actual triangle population of this generated run or observed
         * component.
         */
        triangles: number;

        /**
         * Generated triangle candidates omitted because their numerical area is
         * zero.
         */
        omittedZeroAreaTriangles: number;

        /** Generated vertices whose accumulated normal could not be qualified. */
        unresolvedVertexNormals: number;

        /** Generated vertices with no retained incident triangle. */
        isolatedVertices: number;

        /** Accumulated generated normal vectors containing nonfinite values. */
        nonfiniteNormalSums: number;
      }[];

      /**
       * Admitted saved-section pair records or their counted population,
       * preserving the caller's pair order.
       */
      pairs: number;

      /**
       * Observed continuation components that cannot authorize a supported
       * surface bridge.
       */
      unsupportedGroups: number;

      /** Number of open continuation runs that emitted at least one triangle. */
      generatedRuns: number;
    };
  };
}
