import type { AutoMovieQuaternionTuple } from "../../geometry/AutoMovieQuaternionTuple";

/** Type contracts exchanged by AutoMovieHumanNeutralForearm; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanNeutralForearm {
  /** One forearm's neutral.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One forearm's neutral.
   * @evidence contracts/development/design.md#principled-representation `lower`: The forearm bone's world turn, which carries its share of the twist. `hand`: The hand's world turn, which carries the rest. `pronation`: The achieved pronation from thumbs forward, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanNeutralForearm.derive. Also types AutoMovieHumanNeutral.forearm.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `lower`, `hand`, `pronation`; callers supply the complete record.
   */
  export interface IOutput {
    /** The forearm bone's world turn, which carries its share of the twist. */
    lower: AutoMovieQuaternionTuple;

    /** The hand's world turn, which carries the rest. */
    hand: AutoMovieQuaternionTuple;

    /** The achieved pronation from thumbs forward, degrees. */
    pronation: number;
  }
}
