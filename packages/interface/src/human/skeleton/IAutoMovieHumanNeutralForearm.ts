import type { AutoMovieQuaternionTuple } from "../../geometry/AutoMovieQuaternionTuple";

/**
 * Type contracts exchanged by AutoMovieHumanNeutralForearm; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanNeutralForearm {
  /** One forearm's neutral. */
  export interface IOutput {
    /** The forearm bone's world turn, which carries its share of the twist. */
    lower: AutoMovieQuaternionTuple;

    /** The hand's world turn, which carries the rest. */
    hand: AutoMovieQuaternionTuple;

    /** The achieved pronation from thumbs forward, degrees. */
    pronation: number;
  }
}
