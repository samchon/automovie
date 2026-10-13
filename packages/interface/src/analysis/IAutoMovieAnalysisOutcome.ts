import { IAutoMovieAnalysisMetric } from "./IAutoMovieAnalysisMetric";
import { IAutoMovieAnalysisSample } from "./IAutoMovieAnalysisSample";
import { IAutoMovieAnalysisWarning } from "./IAutoMovieAnalysisWarning";

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
 * to `solved`, because a solver computes rather than observes; the two
 * negative arms keep the same spelling in both contracts.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `status` makes results structurally unreachable on the two negative arms; `validateAutoMovieAnalysisRun` additionally requires at least one metric with unique keys, at most `AUTOMOVIE_ANALYSIS_MAX_SAMPLES` samples keyed to measured metrics, and non-blank reason and remedy.
 * @evidence contracts/common.md#clear-and-simple-design Three inline arms with no shared base type, since the negative arms share only two strings and the run digest serializes them as one reason-remedy pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty `solved` result is refused rather than accepted as a pass, and the validator reports an unknown status instead of treating it as one of the known arms.
 * @evidence contracts/common.md#meaningful-documentation Gives what each arm means, which arm may hold results, the metric, sample and warning bounds of a solved run, and the relation to the design-observation outcome.
 * @author Samchon
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
