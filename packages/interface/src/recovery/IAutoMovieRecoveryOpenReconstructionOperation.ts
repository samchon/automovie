import type {
  AutoMovieVector3Tuple,
  IAutoMovieReconstructRecovery,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryOpenContinuation,
} from "..";

/**
 * Callable reconstruction of saved open courses and their explicit neighbor
 * transport.
 */

export namespace IAutoMovieRecoveryOpenReconstructionOperation {
  /**
   * Use the saved open cubics and admitted adjacent connections to find maximal
   * ordinary runs. Realize each run on a shared normalized phase grid with its
   * station interpolation. Preserve the closed reconstruction's unresolved
   * records and report generated or refused open runs separately.
   */

  export type Operation = (
    bundle: IAutoMovieRecoveryMeshSections,
    graph: IAutoMovieRecoveryOpenContinuation,
  ) => Omit<
    ReturnType<IAutoMovieReconstructRecovery.Operation>,
    "construction"
  > & {
    /**
     * Generated construction polylines including the retained closed
     * reconstruction and newly realized open runs.
     */
    construction: {
      /** Stable generated construction line id. */
      id: string;
      /** Whether the generated line is closed. */
      closed: boolean;
      /** Generated physical line points in model metres. */
      points: Readonly<AutoMovieVector3Tuple>[];
    }[];

    /** Open continuation run counts and local generation outcomes. */
    openReports: {
      /** Attempted individual open runs with their measured results. */
      runs: {
        /** Stable generated run ID derived from its first saved open arc. */
        id: string;

        /** First saved section index in the continuation run. */
        firstSection: number;

        /** Last saved section index in the continuation run. */
        lastSection: number;

        /** Ordered saved cubic coefficient identities used by this run. */
        curves: string[];

        /** Whether grid generation returned a retained open-run part. */
        generated: boolean;

        /** Available local reason if grid generation failed. */
        reason: string | null;

        /** Actual generated vertex count for this run. */
        vertices: number;

        /** Actual retained triangle count for this run. */
        triangles: number;

        /** Generated triangle candidates omitted for zero area. */
        omittedZeroAreaTriangles: number;

        /** Count of generated vertices with unqualified normal accumulation. */
        unresolvedVertexNormals: number;

        /** Generated vertices with no retained incident triangle. */
        isolatedVertices: number;

        /** Generated normal sums with a nonfinite component. */
        nonfiniteNormalSums: number;
      }[];

      /** Number of admitted adjacent saved-section pair records. */
      pairs: number;

      /** Number of unsupported saved continuation groups. */
      unsupportedGroups: number;

      /** Number of admitted runs for which a generated part was appended. */
      generatedRuns: number;
    };
  };
}
