import { IAutoMovieAnalysisMetric } from "./IAutoMovieAnalysisMetric";
import { IAutoMovieAnalysisSample } from "./IAutoMovieAnalysisSample";
import { IAutoMovieAnalysisWarning } from "./IAutoMovieAnalysisWarning";

/**
 * What one analysis run actually produced.
 *
 * Three arms, and only the first one may carry results. `unsupported` means the
 * host has no adapter for what was asked; `not-run` means an adapter exists but
 * its input was not supplied. Both carry a reason and a remedy and structurally
 * have nowhere to put a metric, a sample or a warning, so an absent analysis
 * cannot be dressed as a clean one by any amount of field-filling.
 *
 * This is the same three-arm shape the design-observation contract uses, with
 * `observed` renamed to `solved`: a thermal solver computes, it does not
 * observe, and the two negative arms deliberately keep their exact spelling so
 * one project has one vocabulary for "we did not look".
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `status` makes results unrepresentable in the two negative arms; the validator also requires a solved arm to carry at least one metric and refuses an unknown status that arrived through JSON.
 * @evidence contracts/common.md#clear-and-simple-design Three arms rather than one record with optional result fields, so the run digest and the report branch on a single discriminant and the negative arms share the design-observation spelling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A solved arm with zero metrics is refused and the message points the author to a negative arm, so an empty computation cannot read as clean; no arm is chosen by solver identity.
 * @evidence contracts/common.md#meaningful-documentation Explains each arm's meaning, which arm may carry results, the at-least-one-metric rule, the sample bound and the measured-key constraint on samples.
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
       * `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` (4096); every key must name a
       * measured metric.
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
