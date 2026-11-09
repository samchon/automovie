import type { IAutoMovieContourLoft64 } from "@automovie/engine";
import type { IAutoMovieRecoveryInput } from "@automovie/interface";

import type { IAutoMovieRecoverySectionCoverage } from "./IAutoMovieRecoverySectionCoverage";
import type { IAutoMovieRecoverySectionReport } from "./IAutoMovieRecoverySectionReport";
import type { IAutoMovieRecoverySectionSummary } from "./IAutoMovieRecoverySectionSummary";
import type { IAutoMovieRecoveryTopologyGap } from "./IAutoMovieRecoveryTopologyGap";
import type { IAutoMovieRecoveryUnconsumedEvent } from "./IAutoMovieRecoveryUnconsumedEvent";

/**
 * Physical section coefficients and source-free observations produced by mesh extraction.
 *
 * @evidence contracts/development/design.md#principled-representation The loft preserves cubic coefficients, signed loop incidence, phase widths and generating event terminals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One source-free publication groups fitted coefficients, section diagnostics and explicit unresolved topology.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Original vertices, triangles and normals are absent; open arcs and diagnostics do not authorize replacement source surfaces.
 * @evidence contracts/development/common.md#meaningful-documentation States millimetre section coordinates, ordered fit reports, source-free policy and optional prefix coverage.
 */
export interface IAutoMovieRecoveryMeshSections {
  /** Engine loft contract with the retained physical section coefficients. */
  loft: IAutoMovieContourLoft64;

  /** Same-order section reports, including open fitted arcs and tolerance status. */
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
