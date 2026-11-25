/**
 * One nonnegative film time authored as a frame index or frame-grid second.
 *
 * Supply one representation per value. The structural union does not forbid an
 * object containing both fields; measureAutoMovieGeometryFilmTime gives frame
 * precedence when both are supplied. That engine reader multiplies seconds by
 * the current timeline's frames per second, admits rounding error within 64
 * machine epsilons scaled to the frame magnitude, and requires a safe-integer
 * result in [0, totalFrames). It throws for an absent timeline, an off-grid or
 * out-of-range time, or a frame not owned by any segment. Other hosts must
 * explicitly resolve this authoring representation against their own film
 * clock.
 */
export type IAutoMovieFilmTime =
  | {
      /** Zero-based production frame. */
      frame: number;
    }
  | {
      /** Seconds that must land exactly on the production frame clock. */
      seconds: number;
    };
