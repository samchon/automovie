import type { IAutoMovieInspectionRequest } from "../scene/inspection/IAutoMovieInspectionRequest.js";
import type { IAutoMovieCaptureBudget } from "./IAutoMovieCaptureBudget.js";

/**
 * Everything one capture asks for, as `parseAutoMovieCapturePlanRequest` reads it from named text values and `formatAutoMovieCapturePlanRequest` writes it back: the subject, its times, views, passes and selections, the reader budget, the round, and the inspection of every still.
 *
 * It names no subject's content. Which views, times and mark kinds the subject actually offers is checked by `planAutoMovieCapture` against an `IAutoMovieCaptureSubject`, because only the host learns those from the page.
 *
 * @evidence contracts/development/design.md#principled-representation Each member is one independent question the visual-debugging skill asks of a capture: subject, times, views, passes, selections, reader budget and round. Times are film seconds and frames of the subject's own grid, budget edges are pixels and the sweep margin is metres. Explicit seconds and an even sampling exclude each other, so they are a union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inspection is the inspection core's own request, composed rather than repeated, and view texts stay text checked by the inspection core's view grammar. Each member serves a skill requirement: times, events and the cut threshold capture.md's Times, views its Views, sweep and margin its Subject, passes passes.md, budget the reader budget, round, compare and tolerance comparison.md.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `passes` and the inspection's `shade` name one concept; the parser keeps them equal (`inspection.shade` is `passes[0]`) and refuses a request that gives both. That `to` exceeds `from`, a margin needs a sweep, and a tolerance a comparison are runtime checks of the parser.
 * @evidence contracts/development/common.md#meaningful-documentation States the reader and writer, what the subject check leaves to the planner, and each member's unit and absent meaning.
 */
export interface IAutoMovieCapturePlanRequest {
  /**
   * Name of the subject the host loads, or null for the host's only subject.
   */
  subject: string | null;

  /**
   * Which seconds are drawn besides the frames around the events.
   */
  sampling: IAutoMovieCapturePlanRequest.Sampling;

  /**
   * Subject seconds of contacts, joins and decisive instants; every frame of the subject's grid within `window` frames of each is drawn.
   */
  events: number[];

  /**
   * Frames drawn on each side of an event or cut, a whole number. Zero draws only the frame nearest the instant.
   */
  window: number;

  /**
   * `scdet` score from 0 to 100 at which a frame of a video file starts a new scene, whose surrounding frames are drawn like an event's; FFmpeg's default is 10. A drawn subject has no cuts and ignores it.
   */
  threshold: number;

  /**
   * View texts the stills are drawn through, each read by the inspection core's view grammar, in drawing order. Never empty.
   */
  views: string[];

  /**
   * Shades the stills are drawn in, in drawing order, sharing each view's camera. Never empty; the first equals `inspection.shade`.
   */
  passes: IAutoMovieInspectionRequest.Shade[];

  /**
   * Path pattern of the units whose selections are swept, each drawn alone and with the neighbours within `margin`; null draws the request's own selection once.
   */
  sweep: string | null;

  /**
   * Gap in metres between two units' boxes that still makes them neighbours in a sweep, zero or more.
   */
  margin: number;

  /**
   * The reader the sheets are laid out for.
   */
  budget: IAutoMovieCaptureBudget;

  /**
   * Name this capture is kept under among the subject's rounds, or null to replace the unnamed capture.
   */
  round: string | null;

  /**
   * Name of an earlier round this capture is compared against, or null for no comparison.
   */
  compare: string | null;

  /**
   * Largest channel difference in bytes, 0 to 255, that a comparison counts as unchanged.
   */
  tolerance: number;

  /**
   * What every still shows: selection, shade, marks, cut and stroke.
   */
  inspection: IAutoMovieInspectionRequest;
}
export namespace IAutoMovieCapturePlanRequest {
  /**
   * The seconds a capture draws besides its event windows.
   *
   * `even` samples `[from, to)` every `1 / rate` seconds, each sample moved to the nearest frame of the subject's grid so it is a frame the subject encodes; `to` null runs to the subject's end. `at` draws the given seconds exactly as written.
   *
   * @evidence contracts/development/design.md#principled-representation The two ways to choose seconds need different data, so they are a union keyed by `kind`, and a request cannot give a rate with explicit seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members the grammar's `from`, `to`, `rate` and `at` keys read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The subject's end is null rather than a number guessed before the subject is known.
   * @evidence contracts/development/common.md#meaningful-documentation States each form's rule, units and what a null end means.
   */
  export type Sampling =
    | {
        /** Samples at an even rate. */
        kind: "even";

        /** First second, inclusive, zero or more. */
        from: number;

        /** End second, exclusive, or null for the subject's end. */
        to: number | null;

        /** Stills per second, positive. */
        rate: number;
      }
    | {
        /** Explicit seconds. */
        kind: "at";

        /** The seconds, in the order written, at least one. */
        seconds: number[];
      };
}
