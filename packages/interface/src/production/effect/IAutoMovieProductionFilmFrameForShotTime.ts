import type { IAutoMovieFilmEffectClock } from "../../geometry/IAutoMovieFilmEffectClock";

/** Query locating an unambiguous film occurrence of a shot-local sample. */
export namespace IAutoMovieProductionFilmFrameForShotTime {
  /**
   * Map one shot-local review time to its only realized film frame.
   *
   * A shot page and a review capture know a shot and a second, not a film
   * frame. The second is first mapped to the source frame that owns it, the
   * largest frame whose exact boundary time is at or before it; film-owned
   * state at that second exists only when the edit realizes that source frame
   * of the shot exactly once, so an absent or repeated occurrence answers
   * `null` rather than choosing one occurrence. A negative, non-finite or
   * unrepresentable time also answers `null`, while an inconsistent clock
   * throws `AutoMovieFilmEffectRuntimeError` with `film-effect-input-invalid`.
   * The answer depends only on the compiled timeline, never on whether a render
   * has prepared any other runtime.
   */
  export type IProps = {
    /**
     * Borrowed compiled film clock and source trims. Its rational rate and
     * numeric fps must agree; inconsistent clock metadata throws
     * film-effect-input-invalid.
     */
    timeline: IAutoMovieFilmEffectClock;
    /**
     * Exact shot id used to find every segment containing the source frame. No
     * match or more than one match yields null rather than selecting an
     * occurrence.
     */
    shot: string;
    /**
     * Shot-local seconds. Negative, nonfinite or unrepresentable times yield
     * null; an exact frame boundary belongs to the frame starting there.
     */
    time: number;
  };
}
