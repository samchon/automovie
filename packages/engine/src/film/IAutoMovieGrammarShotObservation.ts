import { AutoMovieGrammarStyleIntent, IAutoMovieCameraIntent } from "@automovie/interface";
import { IAutoMovieGrammarCameraObservation } from "./IAutoMovieGrammarCameraObservation";
import { IAutoMovieGrammarSubjectObservation } from "./IAutoMovieGrammarSubjectObservation";

/**
 * The geometric and editorial facts required to inspect one ordered shot.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarShotObservation supplies deterministic spatial-grammar analysis: The geometric and editorial facts required to inspect one ordered shot.
 * @evidence requirements/camera/axis-eyeline-and-screen-direction.md#camera-grammar-time-sampling Carries opening and closing camera, subject, gaze-target, and travel positions so a cut can compare the outgoing close with the incoming open.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarShotObservation realizes deterministic continuity-grammar analysis: The geometric and editorial facts required to inspect one ordered shot.
 * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-grammar-sampling-findings Supplies the two observable shot-boundary samples consumed by grammar analysis rather than a start transform or average heading.
 */
export interface IAutoMovieGrammarShotObservation {
  /**
   * Stable shot id.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarShotObservation.id supplies deterministic spatial-grammar analysis: Stable shot id.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarShotObservation.id realizes deterministic continuity-grammar analysis: Stable shot id.
   */
  id: string;
  /**
   * Positive edited duration in seconds.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarShotObservation.duration supplies deterministic spatial-grammar analysis: Positive edited duration in seconds.
   * @evidence requirements/editorial/pacing-and-rhythm.md#editorial-duration-pattern Supplies the positive edited shot duration used to form the ordered duration series; it does not claim event density or audiovisual rhythm.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarShotObservation.duration realizes deterministic continuity-grammar analysis: Positive edited duration in seconds.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-pacing-rhythm Provides the per-shot input for the analyzer's duration-only pacing observation without classifying the creative result.
   */
  duration: number;
  /**
   * Resolved camera at both edited shot boundaries.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarShotObservation.camera supplies deterministic spatial-grammar analysis: Resolved camera at both edited shot boundaries.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarShotObservation.camera realizes deterministic continuity-grammar analysis: Resolved camera at both edited shot boundaries.
   */
  camera: {
    /** Opening-frame camera. */
    start: IAutoMovieGrammarCameraObservation;
    /** Closing-frame camera. */
    end: IAutoMovieGrammarCameraObservation;
  };
  /**
   * Subjects observed in this shot; input order has no meaning.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarShotObservation.subjects supplies deterministic spatial-grammar analysis: Subjects observed in this shot; input order has no meaning.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarShotObservation.subjects realizes deterministic continuity-grammar analysis: Subjects observed in this shot; input order has no meaning.
   */
  subjects: IAutoMovieGrammarSubjectObservation[];
  /**
   * Principal subject used for cut and framing checks.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarShotObservation.primarySubject supplies deterministic spatial-grammar analysis: Principal subject used for cut and framing checks.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarShotObservation.primarySubject realizes deterministic continuity-grammar analysis: Principal subject used for cut and framing checks.
   */
  primarySubject: string | null;
  /**
   * Authored framing claim, or null when none was declared.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarShotObservation.declaredShotSize supplies deterministic spatial-grammar analysis: Authored framing claim, or null when none was declared.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarShotObservation.declaredShotSize realizes deterministic continuity-grammar analysis: Authored framing claim, or null when none was declared.
   */
  declaredShotSize: IAutoMovieCameraIntent["framing"] | null;
  /**
   * Two subjects defining the line of action, or null when unavailable.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarShotObservation.actionAxis supplies deterministic spatial-grammar analysis: Two subjects defining the line of action, or null when unavailable.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarShotObservation.actionAxis realizes deterministic continuity-grammar analysis: Two subjects defining the line of action, or null when unavailable.
   */
  actionAxis: readonly [string, string] | null;
  /**
   * Deliberate exceptions copied from the shot contract.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarShotObservation.styleIntent supplies deterministic spatial-grammar analysis: Deliberate exceptions copied from the shot contract.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarShotObservation.styleIntent realizes deterministic continuity-grammar analysis: Deliberate exceptions copied from the shot contract.
   */
  styleIntent?: AutoMovieGrammarStyleIntent[];
}
