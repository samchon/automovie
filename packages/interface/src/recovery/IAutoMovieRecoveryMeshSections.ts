import type {
  IAutoMovieContourLoft64,
  IAutoMovieRecoveryInput,
  IAutoMovieRecoverySectionCoverage,
  IAutoMovieRecoverySectionReport,
  IAutoMovieRecoverySectionSummary,
  IAutoMovieRecoveryTopologyGap,
  IAutoMovieRecoveryUnconsumedEvent,
} from "..";

/**
 * Collected automatic section extraction with fitted loft input, source
 * observations and coverage.
 */
export interface IAutoMovieRecoveryMeshSections {
  /**
   * Retained closed loops, admitted events and observed adjacent-station groups
   * for contour lofting.
   */
  loft: IAutoMovieContourLoft64;

  /** Per-station observation reports in the same order as the loft sections. */
  reports: IAutoMovieRecoverySectionReport[];

  /** Collection-wide findings from automatic station and source observation. */
  diagnostics: string[];

  /**
   * Observed event preimages for which no supported closed continuation was
   * established.
   */
  topologyGaps: IAutoMovieRecoveryTopologyGap[];

  /** Observed critical events without an admitted reconstruction declaration. */
  unconsumedEvents: IAutoMovieRecoveryUnconsumedEvent[];

  /**
   * Observation settings needed to compare or consume this saved bundle,
   * excluding source triangles and positions.
   */
  policy: Omit<IAutoMovieRecoveryInput, "verticesMm" | "triangles">;

  /** Counts measured from the retained extraction and its original observations. */
  summary: IAutoMovieRecoverySectionSummary;

  /** Explicit incomplete coverage for a bounded computational station prefix. */
  coverage?: IAutoMovieRecoverySectionCoverage;
}
