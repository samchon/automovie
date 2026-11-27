import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";

/**
 * Whether a body part gets where its action says and points as its action says,
 * over a stated span of the film.
 *
 * An action's purpose is mostly one of two statements: a point of the body is
 * at a place (a palm on a shoulder, a cup's rim at the mouth, a fist on a
 * target), or an axis of the body points along a direction (a cup held upright,
 * a palm facing a partner, the eyes on a thing). `gap` reads the first as the
 * distance between the point and the place, `tilt` the second as the angle
 * between the axis and the direction. Each reports both ends over the span:
 * `worst` is what a contract that says "throughout" is judged by (a hand that
 * leaves the shoulder mid-hold), `best` what one that says "reaches" is judged
 * by (a hand that never arrives).
 */
export namespace IAutoMovieMotionHumanAuditReach {
  /** A span of the film and its grid. */
  export interface ISpan {
    /** Start, film seconds. */
    from: number;

    /** End, film seconds, at least `from`. */
    to: number;

    /** Grid samples per second; 24 by default. */
    rate?: number;
  }

  /** Both ends of a reading over a span. */
  export interface IResult {
    /**
     * The largest value over the span, with its instant: what "throughout" is
     * judged by.
     */
    worst: IAutoMovieMotionHumanAuditMeasure;

    /**
     * The smallest value over the span, with its instant: what "reaches" is
     * judged by.
     */
    best: IAutoMovieMotionHumanAuditMeasure;
  }
}
