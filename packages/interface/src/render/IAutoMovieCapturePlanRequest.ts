import type { AutoMovieInspectionShade } from "./AutoMovieInspectionShade";
import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest";
import type { IAutoMovieCaptureBudget } from "./IAutoMovieCaptureBudget";
import type { IAutoMovieCaptureSampling } from "./IAutoMovieCaptureSampling";

/**
 * Everything one capture asks for, as `parseCapturePlanRequest` reads
 * it from named text values and `formatCapturePlanRequest` writes it
 * back: the subject, its times, views, passes and selections, the reader
 * budget, the round, and the inspection of every still.
 *
 * It names no subject's content. Which views, times and mark kinds the subject
 * actually offers is checked by `planCapture` against an
 * `IAutoMovieCaptureSubject`, because only the host learns those from the
 * page.
 */
export interface IAutoMovieCapturePlanRequest {
  /** Name of the subject the host loads, or null for the host's only subject. */
  subject: string | null;

  /** Which seconds are drawn besides the frames around the events. */
  sampling: IAutoMovieCaptureSampling;

  /**
   * Subject seconds of contacts, joins and decisive instants; every frame of
   * the subject's grid within `window` frames of each is drawn.
   */
  events: number[];

  /**
   * Frames drawn on each side of an event or cut, a whole number. Zero draws
   * only the frame nearest the instant.
   */
  window: number;

  /**
   * `scdet` score from 0 to 100 at which a frame of a video file starts a new
   * scene, whose surrounding frames are drawn like an event's; FFmpeg's default
   * is 10. A drawn subject has no cuts and ignores it.
   */
  threshold: number;

  /**
   * View texts the stills are drawn through, each read by the inspection core's
   * view grammar, in drawing order. Never empty.
   */
  views: string[];

  /**
   * Shades the stills are drawn in, in drawing order, sharing each view's
   * camera. Never empty; the first equals `inspection.shade`.
   */
  passes: AutoMovieInspectionShade[];

  /**
   * Path pattern of the units whose selections are swept, each drawn alone and
   * with the neighbours within `margin`; null draws the request's own selection
   * once.
   */
  sweep: string | null;

  /**
   * Gap in metres between two units' boxes that still makes them neighbours in
   * a sweep, zero or more.
   */
  margin: number;

  /** The reader the sheets are laid out for. */
  budget: IAutoMovieCaptureBudget;

  /**
   * Name this capture is kept under among the subject's rounds, or null to
   * replace the unnamed capture.
   */
  round: string | null;

  /**
   * Name of an earlier round this capture is compared against, or null for no
   * comparison.
   */
  compare: string | null;

  /**
   * Largest channel difference in bytes, 0 to 255, that a comparison counts as
   * unchanged.
   */
  tolerance: number;

  /** What every still shows: selection, shade, marks, cut and stroke. */
  inspection: IAutoMovieInspectionRequest;
}
