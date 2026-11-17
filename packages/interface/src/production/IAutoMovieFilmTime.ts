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
 * explicitly resolve this authoring representation against their own film clock.
 *
 * @evidence contracts/development/design.md#principled-representation A frame index or grid-aligned second value identifies a production-clock boundary; engine film-time measurement owns conversion, roundoff admission and current-timeline range checks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two authoring forms share one time type without carrying an independent frame rate per timestamp; the production's frame format owns that conversion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Seconds do not authorize arbitrary nearest-frame cuts; the structural union's dual-field allowance is disclosed together with the existing reader's frame precedence.
 * @evidence contracts/development/common.md#meaningful-documentation Defines frame/second units, production-clock ownership, numerical tolerance, dual-field precedence and the engine reader's failure conditions.
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
