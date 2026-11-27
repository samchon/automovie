import type { IAutoMovieFilmEffectClock } from "../geometry/IAutoMovieFilmEffectClock";
import type { IAutoMovieShotEffect } from "../geometry/IAutoMovieShotEffect";

/** Inputs for projecting shot effect ownership through film source trims. */
export namespace IAutoMovieProjectProductionShotEffectFilmIntervals {
  /**
   * Project every shot-owned effect occurrence onto the film's half-open frame
   * clock.
   *
   * A shot cue owns the source frames whose exact boundary time satisfies
   * `start <= time < end`, the same comparison the engine sampler performs, so
   * the projection is decided by the rational frame boundary rather than by a
   * rounded `seconds * fps` product. Each film occurrence of the shot is
   * trimmed to its segment and dropped when nothing remains, and a shot the
   * compiled set does not contain contributes no interval because the builder's
   * shot-availability diagnostics own that refusal. Intervals come out in
   * segment order, then in the shot's effect order. A cue with a negative or
   * non-finite start, an end not after its start, or an unrepresentable bound
   * throws `AutoMovieFilmEffectRuntimeError` with `film-effect-input-invalid`,
   * as does an inconsistent clock.
   */
  export type IProps = {
    /**
     * Borrowed film clock and ordered edit segments. The same shot can
     * contribute once per occurrence, trimmed to each segment's source
     * interval.
     */
    timeline: IAutoMovieFilmEffectClock;
    /**
     * Borrowed shot-id index; absent entries are skipped. Values and their
     * effect arrays are read only for this projection and are not retained by
     * the result.
     */
    shots: ReadonlyMap<
      string,
      {
        /**
         * Shot-local effects in declaration order. Empty arrays contribute
         * nothing; start and end must form a finite nonnegative
         * positive-duration interval representable on the source-frame clock.
         */
        effects: readonly IAutoMovieShotEffect[];
      }
    >;
  };
}
