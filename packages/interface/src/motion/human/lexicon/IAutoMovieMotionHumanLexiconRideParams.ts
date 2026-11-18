import type { IAutoMovieMotionHumanHandrimStroke } from "./IAutoMovieMotionHumanHandrimStroke";
import type { IAutoMovieMotionHumanRide } from "./IAutoMovieMotionHumanRide";

/**
 * Open parameters of the ride lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before planning or resolving a row's fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The ride family is a closed export-name map. Each key uses the law contract directly or projects its open parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the ride row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconRideParams {
  /** Ride a moving support, seated on it. */
  ride: IAutoMovieMotionHumanRide.IParams;

  /** Push a wheelchair through its handrims. */
  HumanHandrimStroke: IAutoMovieMotionHumanHandrimStroke;
}
