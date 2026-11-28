import type { IAutoMovieRecoveryMeshSections } from "..";

/** Callable read of saved fit and span information for one open run. */

export namespace IAutoMovieRecoveryOpenRunDescriptionOperation {
  /**
   * Read the named saved open curves in supplied run order. Report actual cubic
   * span count, explicit fit target misses and unavailable residual
   * qualification; a negative saved estimate suppresses the maximum estimate.
   */

  export type Operation = (
    bundle: IAutoMovieRecoveryMeshSections,
    nodes: readonly {
      /** Saved station index in run order. */
      section: number;
      /** Original open fit index within the addressed saved report. */
      arc: number;
    }[],
  ) => {
    /** Saved curve names in the supplied node order. */
    curves: string[];

    /** Diagnostics for unavailable saved upper-estimate qualification. */
    diagnostics: string[];

    /** Count of saved fits explicitly marked as missing their tolerance target. */
    fitTargetMisses: number;

    /** Count of saved curves with a negative, unavailable upper estimate. */
    unqualifiedFitMetadata: number;

    /**
     * Largest saved nonnegative polyline upper estimate in millimetres, or null
     * if any estimate is unavailable.
     */
    fitPolylineUpperEstimateMaximumMm: number | null;

    /** Total saved cubic span count over the described open run. */
    sourceSpans: number | null;
  };
}
