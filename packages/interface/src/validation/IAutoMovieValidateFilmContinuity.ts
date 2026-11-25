import type { IAutoMovieResolveBeatProps } from "../production/IAutoMovieResolveBeatProps";

/** Data and callback contracts shared by the ValidateFilmContinuity operations. */
export namespace IAutoMovieValidateFilmContinuity {
  /**
   * Resolve end/opening states in playback order and compare adjacent beat
   * boundaries for advisory discontinuity.
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
