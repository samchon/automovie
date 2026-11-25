import type { AutoMovieGrammarStyleIntent } from "../production/AutoMovieGrammarStyleIntent";
import type { IAutoMovieCameraIntent } from "./IAutoMovieCameraIntent";
import type { IAutoMovieGrammarCameraObservation } from "./IAutoMovieGrammarCameraObservation";
import type { IAutoMovieGrammarSubjectObservation } from "./IAutoMovieGrammarSubjectObservation";

/**
 * The geometric and editorial facts the film-grammar read needs about one
 * edited shot.
 *
 * The production film-grammar pass builds one per placed shot, sampling the
 * camera and subjects at the placement's first and last shown frame.
 * `readFilmGrammar` throws when the id is blank, the duration is not finite and
 * positive, `primarySubject` or an `actionAxis` endpoint is not an observed
 * subject, the axis names one subject twice, or `styleIntent` repeats a value.
 */
export interface IAutoMovieGrammarShotObservation {
  /** Shot id, non-blank and unique in the input. */
  id: string;

  /** Edited duration in seconds; finite and positive. */
  duration: number;

  /** Resolved camera at both edited shot boundaries. */
  camera: {
    /** Camera at the first shown frame. */
    start: IAutoMovieGrammarCameraObservation;

    /** Camera at the last shown frame. */
    end: IAutoMovieGrammarCameraObservation;
  };

  /** Subjects observed in this shot, ids unique; input order has no meaning. */
  subjects: IAutoMovieGrammarSubjectObservation[];

  /**
   * Id of the principal subject, one of {@link subjects}. The shot-size,
   * jump-cut, eyeline and screen-direction checks and the displacement half of
   * the re-establishing check measure it; null disables them for this shot.
   */
  primarySubject: string | null;

  /**
   * The framing the shot claims, compared with the size measured at both
   * boundaries, or null when no single claim covers the edited span; null
   * disables the shot-size check.
   */
  declaredShotSize: IAutoMovieCameraIntent["framing"] | null;

  /**
   * Two distinct observed subjects defining the line of action, in either
   * order, or null when the shot states no axis; null disables the axis check
   * on both cuts touching this shot.
   */
  actionAxis: readonly [string, string] | null;

  /**
   * Deliberate exceptions declared by the shot contract, each at most once.
   * Each excepts the finding family `GRAMMAR_STYLE_SUPPRESSION` maps it to when
   * that finding is filed on this shot; `rhythmic-pacing` excepts the film-wide
   * pacing finding from any shot. Absent means none.
   */
  styleIntent?: AutoMovieGrammarStyleIntent[];
}
