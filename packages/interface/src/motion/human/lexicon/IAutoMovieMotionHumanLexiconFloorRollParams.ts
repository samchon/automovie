import type { IAutoMovieMotionHumanRoll } from "../floor/IAutoMovieMotionHumanRoll";

/**
 * Open parameters of the floorRoll lexicon family, keyed by each runtime export name.
 * Omitted keys are fixed by the row before its underlying law plans; the remaining members retain that law's defaults, units and required status.
 * HumanPerformanceParams checks these open inputs using the generated row schema before HumanActionRow resolves fixed values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each row describes the performed act; its parameter expression identifies the underlying contract and every fixed key.
 * @evidence contracts/development/design.md#principled-representation The floorRoll family is a closed export-name map with the exact Omit projection of each source law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This interface owns the floorRoll row parameter map used by the family registry and schema generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Parameter types refer to canonical action contracts and never infer from runtime law values.
 */
export interface IAutoMovieMotionHumanLexiconFloorRollParams {
  /** A forward roll: crouch, roll over the back forward, rise on the feet. */
  forwardRoll: Omit<IAutoMovieMotionHumanRoll.IParams, "direction">;

  /** A backward roll: crouch, roll over the back backward, rise on the feet. */
  backwardRoll: Omit<IAutoMovieMotionHumanRoll.IParams, "direction">;
}
