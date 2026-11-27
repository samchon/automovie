import type { IAutoMoviePlaybackTimeline } from "../production/IAutoMoviePlaybackTimeline.js";
import type { IAutoMovieFilmSound } from "../production/IAutoMovieFilmSound.js";
import type { IAutoMovieDeliveryContentAudit } from "./IAutoMovieDeliveryContentAudit.js";
import type { IAutoMovieInspectionDrawable } from "./IAutoMovieInspectionDrawable.js";
import type { IAutoMovieCaptureInstant } from "./IAutoMovieCaptureInstant.js";

/**
 * What a host learns about a subject from the page before a capture is planned:
 * its clock, its raster, and what can be drawn of it.
 *
 * A subject is a scene, a set of identity paths and the marks its owner
 * supplies; nothing here names what kind of thing it is. `planAutoMovieCapture`
 * checks a request against it, so a view, a time, a mark kind or a sweep the
 * subject cannot give is refused before anything is drawn.
 */
export interface IAutoMovieCaptureSubject {
  /**
   * Name of the subject, as the request's `subject` names it and the record
   * keeps it.
   */
  name: string;

  /** Running time in seconds; the last frame is the last whole frame before it. */
  durationSeconds: number;

  /**
   * Frames per second of the subject's own grid, which event and cut windows
   * count in.
   */
  fps: number;

  /** Width in pixels of every still drawn of the subject. */
  width: number;

  /** Height in pixels of every still drawn of the subject. */
  height: number;

  /**
   * Authored soundtrack and content obligations for the delivery host, when
   * declared.
   */
  delivery?: IAutoMovieDeliveryContentAudit.IIntent;

  /**
   * The film's adopted sound list, which the delivery host mixes into the
   * soundtrack it encodes, when declared.
   */
  sound?: IAutoMovieFilmSound;

  /**
   * The film's cut on the output clock, its sequence entries with their starts
   * and played spans, which the delivery host records against the frames it
   * draws; absent when the subject has no sequence.
   */
  cut?: IAutoMoviePlaybackTimeline;

  /**
   * Names a named view may take: the subject's own views and the named
   * viewpoints the host fits, such as `front`. `film` and a camera by
   * coordinates need no name.
   */
  views: string[];

  /**
   * Every drawn object with its identity path and its world-space box in
   * metres, which a sweep groups into units and neighbours.
   */
  drawables: IAutoMovieInspectionDrawable[];

  /**
   * Every mark kind the subject's owners supply under the request, such as
   * `curve/section`; a `marks` pattern must match one.
   */
  marks: string[];

  /**
   * Instants the subject names, such as a motion case's beats; a cell drawn at
   * a second written the same to the millisecond carries the instant's label in
   * its caption and its record row. Absent names none.
   */
  instants?: IAutoMovieCaptureInstant[];
}
