import type { IAutoMovieAnalysisMetric } from "./IAutoMovieAnalysisMetric";
import type { IAutoMovieAnalysisSample } from "./IAutoMovieAnalysisSample";
import type { IAutoMovieAnalysisWarning } from "./IAutoMovieAnalysisWarning";

/**
 * What one analysis run actually produced.
 *
 * Only the `solved` arm may carry results. `unsupported` means the host has no
 * adapter for what was asked; `not-run` means an adapter exists but its input
 * was not supplied. Both carry a reason and a remedy and have no field for a
 * metric, a sample or a warning, so an absent analysis cannot be dressed as a
 * clean one.
 *
 * The shape matches `IAutoMovieDesignAnalysisOutcome` with `observed` renamed
 * to `solved`, because a solver computes rather than observes; the two negative
 * arms keep the same spelling in both contracts.
 */
export type IAutoMovieAnalysisOutcome =
  | {
      /** The solver ran and produced results. */
      status: "solved";

      /**
       * At least one metric, keys unique; each one measured or explicitly
       * gapped.
       */
      metrics: IAutoMovieAnalysisMetric[];

      /**
       * Spatial field, possibly empty and at most the engine's
       * `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` (4096); every key must name a measured
       * metric.
       */
      samples: IAutoMovieAnalysisSample[];

      /** Non-fatal observations about the inputs. */
      warnings: IAutoMovieAnalysisWarning[];
    }
  | {
      /** This host cannot perform the analysis at all. */
      status: "unsupported";

      /** Non-blank statement of what is missing. */
      reason: string;

      /** Non-blank statement of what would make it possible. */
      remedy: string;
    }
  | {
      /** An adapter exists but was not executed. */
      status: "not-run";

      /** Non-blank statement of why it was skipped. */
      reason: string;

      /** Non-blank statement of the input that would let it run. */
      remedy: string;
    };
