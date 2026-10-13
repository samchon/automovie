import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/**
 * One plain-text caption cue from which renderers derive selectable WebVTT.
 *
 * @evidence contracts/common.md#principled-implementation A half-open film-global interval and declared language bind displayed text to the production frame clock; film assembly canonicalizes line endings and validates timing before readability and WebVTT generation consume the same presentation.
 * @evidence contracts/common.md#clear-and-simple-design Text, language, optional speaker and exact boundaries describe the authored cue, while readability thresholds and segmentation runtime live on separate production profiles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Language is explicitly authored rather than guessed from characters, and line presentation survives canonicalization instead of being flattened to make readability counts smaller.
 * @evidence contracts/common.md#meaningful-documentation Gives retained CR/LF presentation, nonblank text, RFC 5646 language spelling, optional speaker and inclusive-start/exclusive-end film timing.
 * @author Samchon
 */
export interface IAutoMovieCaptionCue {
  /** Stable cue id. */
  id: string;

  /**
   * Non-blank plain text whose authored CR, LF, and CRLF line presentation is preserved canonically by readability and selectable delivery.
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
