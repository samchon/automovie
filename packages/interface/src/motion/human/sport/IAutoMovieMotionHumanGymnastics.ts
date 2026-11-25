import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * A handstand kicked up from standing, held and stepped down.
 *
 * The hands are placed on the floor a shoulder width apart, as far ahead of the
 * feet as the standing legs let the hips go with the trunk pitched 120 degrees
 * over the hands (provisional). Over the first half of the entry the body folds
 * forward and the hands come down under the shoulders, which stand the arms'
 * reach above the wrists; over the second the trunk swings about the shoulders,
 * which stay where they are, and the legs follow straight until the body stands
 * inverted with the hips over the shoulders and the shoulders over the base of
 * the hands. The exit is the entry reversed: over its first half the legs swing
 * back down about the shoulders while the hands still bear, until the feet
 * stand where they left the floor, and over its second the trunk unfolds over
 * the feet. The entry and the exit take 1.5 s each (provisional) and the hold
 * is the author's. Balance in the hold is by the wrists first (Kerwin and
 * Trewartha 2001); no sway is drafted yet.
 *
 * Events: `handsDown` at the entry's middle, `inverted` (`ready`), `release` at
 * the exit's middle, when the feet bear again and the hands leave the floor,
 * with the phrase instants.
 *
 * Other laws plan the floor rolls, the cartwheel (`cartwheel`), the salto
 * (`salto`), the round-off (`roundOff`), the handspring (`handspring`) and the
 * vault (`vault`). Not drafted: bars and rings, which need swings about a bar
 * support.
 */
export namespace IAutoMovieMotionHumanGymnastics {
  /** Parameters. */
  export interface IParams {
    /** Seconds held inverted, at least 0; 2 when absent. */
    hold?: number;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }
}
