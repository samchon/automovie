import type {
  IAutoMovieContourLoft64,
  IAutoMovieRecoveryInput,
  IAutoMovieRecoverySectionCoverage,
  IAutoMovieRecoverySectionReport,
  IAutoMovieRecoverySectionSummary,
  IAutoMovieRecoveryTopologyGap,
  IAutoMovieRecoveryUnconsumedEvent,
} from "../../index";

/**
 * Physical section coefficients and source-free observations produced by mesh
 * extraction.
 */
export interface IAutoMovieRecoveryMeshSections {
  /** Engine loft contract with the retained physical section coefficients. */
  loft: IAutoMovieContourLoft64;

  /**
   * Same-order section reports, including open fitted arcs and tolerance
   * status.
   */
  reports: IAutoMovieRecoverySectionReport[];

  /** Unresolved events, flat plateaus and numerical source issues. */
  diagnostics: string[];

  /** Unsupported physical intervals that reconstruction must leave open. */
  topologyGaps: IAutoMovieRecoveryTopologyGap[];

  /** Source events that have no consumable incident closed curve. */
  unconsumedEvents: IAutoMovieRecoveryUnconsumedEvent[];

  /** Extraction policy without the source vertex and triangle arrays. */
  policy: Omit<IAutoMovieRecoveryInput, "verticesMm" | "triangles">;

  /** Counts of observations, coefficients and topology declarations. */
  summary: IAutoMovieRecoverySectionSummary;

  /** Present only for an incomplete automatic station-prefix checkpoint. */
  coverage?: IAutoMovieRecoverySectionCoverage;
}
