import type { IAutoMovieResolveBeatProps } from "../production/IAutoMovieResolveBeatProps";

/**
 * Data and callback contracts shared by the ValidateFilmContinuity operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Resolve end/opening states in playback order and compare adjacent beat boundaries for advisory discontinuity. Member documentation states the supplied records, units and absence meanings used by validateFilmContinuity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The input reuses beat resolution contracts rather than another boundary schema; continuity is advisory and follows authored playback order.
 * @evidence contracts/development/design.md#principled-representation beats retains playback order and shared world-metre/degree tolerances control adjacent resolved boundary comparisons.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateFilmContinuity, used by validateFilmContinuity. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateFilmContinuity {
  /**
   * Resolve end/opening states in playback order and compare adjacent beat boundaries for advisory discontinuity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Resolve end/opening states in playback order and compare adjacent beat boundaries for advisory discontinuity. Member documentation states the supplied records, units and absence meanings used by validateFilmContinuity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The input reuses beat resolution contracts rather than another boundary schema; continuity is advisory and follows authored playback order.
   * @evidence contracts/development/design.md#principled-representation beats retains playback order and shared world-metre/degree tolerances control adjacent resolved boundary comparisons.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateFilmContinuity.IProps, used by validateFilmContinuity. Its beats, positionTolerance, facingToleranceDeg members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** The film's beats, in playback order. */
    beats: readonly IAutoMovieResolveBeatProps[];

    /** World-space position drift tolerated (metres); defaults to 0.05. */
    positionTolerance?: number;

    /** Facing drift tolerated (degrees); defaults to 5. */
    facingToleranceDeg?: number;
  };
}
