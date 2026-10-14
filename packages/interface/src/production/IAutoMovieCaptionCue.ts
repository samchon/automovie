import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/**
 * Authored plain-text caption cue intended for compilation onto the film clock.
 *
 * @evidence contracts/common.md#principled-implementation Authored text and language accompany a half-open film-global interval; this retained cue DTO records timing intent without converting it to frames or validating boundaries, while render consumes compiled timeline captions separately.
 * @evidence contracts/common.md#clear-and-simple-design Text, language, optional speaker and exact boundaries describe the authored cue, while readability thresholds and segmentation runtime live on separate production profiles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Language and timing are explicit fields with no inferred values; plain strings and film-time records do not enforce nonblank text, language syntax or positive duration, and no maintained film-assembly consumer admits this authored DTO.
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
