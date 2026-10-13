import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/** One plain-text caption cue from which renderers may derive WebVTT. */
export interface IAutoMovieCaptionCue {
  /** Stable cue id. */
  id: string;

  /**
   * Non-blank plain text whose authored CR, LF, and CRLF line presentation is
   * preserved canonically by readability and selectable delivery.
   */
  text: string;

  /** RFC 5646 well-formed language tag in retained display form. */
  language: string;

  /** Optional speaker id. */
  speaker?: string;

  /** Film-global inclusive start. */
  start: AutoMovieFilmTime;

  /** Film-global exclusive end. */
  end: AutoMovieFilmTime;
}
