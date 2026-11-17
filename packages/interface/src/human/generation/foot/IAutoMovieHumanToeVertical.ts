import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanFootConnection } from "./IAutoMovieHumanFootConnection";

/** Type contracts exchanged by AutoMovieHumanToeVertical; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanToeVertical {
  /** Full original vertical curves plus their actual parent contact authority.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Full original vertical curves plus their actual parent contact authority.
   * @evidence contracts/development/design.md#principled-representation `height`: Original world-height axis curve, mm. `upper`: Positive dorsal and negative plantar radial source curves, mm. `lower`: Negative radial source; height+lower equals plantar under the same clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanToeVertical.create. Also types AutoMovieHumanFootToeSources.vertical.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `height`, `upper`, `lower`, `plantar`, `root`, `hidden`, `at`; callers supply the complete record.
   */
  export interface ISource {
    /** Original world-height axis curve, mm. */
    height: IAutoMovieViewPart.IOutline;
    /** Positive dorsal and negative plantar radial source curves, mm. */
    upper: IAutoMovieViewPart.IOutline;
    /** Negative radial source; height+lower equals plantar under the same clock. */
    lower: IAutoMovieViewPart.IOutline;
    /** Nonnegative absolute plantar source, not a bound on a moving relative edge. */
    plantar: IAutoMovieViewPart.IOutline;
    /** Actual parent local chord at the named skin root. */
    root: IAutoMovieHumanFootConnection.IChord;
    /** Actual parent local chord at the hidden closing point. */
    hidden: IAutoMovieHumanFootConnection.IChord;
    /** Read the four same-clock values without preparing another source. */
    at: (station: number) => [number, number, number, number];
  }
}
