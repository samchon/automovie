import {
  AutoMovieGrammarStyleIntent,
  IAutoMovieCameraIntent,
} from "@automovie/interface";

import { IAutoMovieGrammarCameraObservation } from "./IAutoMovieGrammarCameraObservation";
import { IAutoMovieGrammarSubjectObservation } from "./IAutoMovieGrammarSubjectObservation";

/**
 * The geometric and editorial facts the film-grammar read needs about one
 * edited shot.
 *
 * The production film-grammar pass builds one per placed shot, sampling the
 * camera and subjects at the placement's first and last shown frame.
 * `readFilmGrammar` throws when the id is blank, the duration is not finite
 * and positive, `primarySubject` or an `actionAxis` endpoint is not an
 * observed subject, the axis names one subject twice, or `styleIntent` repeats
 * a value.
 *
 * @evidence contracts/common.md#principled-implementation Every check reads only these observations: shot size from the primary subject's projected occupancy at both boundaries, cuts from the outgoing end and incoming start, and the action-axis side from the sign of the horizontal cross product; subjects are sorted and axis endpoints ordered by id before any check, so enumeration order cannot change the result.
 * @evidence contracts/common.md#clear-and-simple-design Holds both boundary cameras, the subjects and the three editorial claims the checks compare against, so the analyzer never reads a scene, clip or contract and stays a pure function of this data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing claim is stated as null and disables only the checks that need it, rather than being filled with a default framing, subject or axis.
 * @evidence contracts/common.md#meaningful-documentation States the producer and its sampling instants, the failure effect of each malformed field, the units, which checks each nullable field disables, and that subject and axis order carry no meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; the analyzer's per-shot and per-cut cost is answered on `readFilmGrammar`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per placed shot by the caller for one reading; nothing caches it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns two camera samples and one record per observed subject; the analyzer copies the arrays it normalizes and keeps nothing after the call.
 * @author Samchon
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
   * Each excepts the finding family `GRAMMAR_STYLE_SUPPRESSION` maps it to
   * when that finding is filed on this shot; `rhythmic-pacing` excepts the
   * film-wide pacing finding from any shot. Absent means none.
   */
  styleIntent?: AutoMovieGrammarStyleIntent[];
}
