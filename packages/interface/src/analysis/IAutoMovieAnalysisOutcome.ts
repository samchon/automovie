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
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-failed-not-run Exposes `IAutoMovieAnalysisOutcome` as the portable data boundary for the diagnostics failed not run requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-failed-not-run-states Types `IAutoMovieAnalysisOutcome` for the validation failed not run states system contract.
 */
export type IAutoMovieAnalysisOutcome =
  | {
      /** The solver ran and produced results. */
      status: "solved";
      /** At least one metric; each one measured or explicitly gapped. */
      metrics: IAutoMovieAnalysisMetric[];
      /** Spatial field, possibly empty; every key must name a measured metric. */
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
