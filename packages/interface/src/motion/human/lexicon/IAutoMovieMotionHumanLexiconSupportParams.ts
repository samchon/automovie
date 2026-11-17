import type { IAutoMovieMotionHumanSupport } from "../actions/IAutoMovieMotionHumanSupport";

/**
 * Open parameters of the support lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The support family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the support row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconSupportParams {
  /** Scramble up onto a ledge: the palms on its top, a knee up onto its edge, the other foot up, standing on it. */
  scramble: Omit<IAutoMovieMotionHumanSupport.IParams, "stances">;

  /** Slide off a table's edge: seated upright on it with the hands beside the seat, the feet down to the floor, standing. */
  slideOff: Omit<IAutoMovieMotionHumanSupport.IParams, "stances">;
}
