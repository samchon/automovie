import type { IAutoMovieMotionHumanTargetGrid } from "./IAutoMovieMotionHumanTargetGrid";

/**
 * The seeded offset of a place of the air: where a hand arrives within what its
 * named place allows.
 *
 * `AutoMovieMotionHumanVariation` states what a slot, a spread and a source are
 * and owns `SPREADS` and `ACROSS`; `AutoMovieMotionHumanVariationDraw` owns
 * `TRUNCATE` and the cell rule. A place is the one slot whose offset has three
 * components and whose bound differs by axis, so it reads how the hand arrives
 * and bounds each axis by that axis's names.
 */
export namespace IAutoMovieMotionHumanVariationPlace {
  /** How a hand arrives on a place. */
  export interface ITravel {
    /** The distance the hand travels in the arriving phase, metres. */
    distance: number;

    /** The length of the arriving phase, seconds; positive. */
    seconds: number;

    /**
     * The direction of arrival in the nudge frame (`out`, `up`, `forward`);
     * forward when absent.
     */
    direction?: IAutoMovieMotionHumanTargetGrid.INudge;
  }
}
