import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanFootConnection } from "./IAutoMovieHumanFootConnection";

/**
 * Type contracts exchanged by AutoMovieHumanToeVertical; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanToeVertical {
  /** Full original vertical curves plus their actual parent contact authority. */
  export interface ISource {
    /** Original world-height axis curve, mm. */
    height: IAutoMovieViewPart.IOutline;
    /** Positive dorsal and negative plantar radial source curves, mm. */
    upper: IAutoMovieViewPart.IOutline;
    /** Negative radial source; height+lower equals plantar under the same clock. */
    lower: IAutoMovieViewPart.IOutline;
    /**
     * Nonnegative absolute plantar source, not a bound on a moving relative
     * edge.
     */
    plantar: IAutoMovieViewPart.IOutline;
    /** Actual parent local chord at the named skin root. */
    root: IAutoMovieHumanFootConnection.IChord;
    /** Actual parent local chord at the hidden closing point. */
    hidden: IAutoMovieHumanFootConnection.IChord;
    /**
     * Read [height, upper, lower, plantar] in millimetres at the same physical
     * source station in millimetres, using the retained outlines; source
     * evaluation failures throw.
     */
    at: (station: number) => [number, number, number, number];
  }
}
