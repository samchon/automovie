import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One subject's deterministic measurements over a shot.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarSubjectObservation supplies deterministic spatial-grammar analysis: One subject's deterministic measurements over a shot.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarSubjectObservation realizes deterministic continuity-grammar analysis: One subject's deterministic measurements over a shot.
 */
export interface IAutoMovieGrammarSubjectObservation {
  /**
   * Stable scene-node or formation id.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarSubjectObservation.id supplies deterministic spatial-grammar analysis: Stable scene-node or formation id.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarSubjectObservation.id realizes deterministic continuity-grammar analysis: Stable scene-node or formation id.
   */
  id: string;
  /**
   * World root at the opening frame.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarSubjectObservation.start supplies deterministic spatial-grammar analysis: World root at the opening frame.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarSubjectObservation.start realizes deterministic continuity-grammar analysis: World root at the opening frame.
   */
  start: IAutoMovieVector3;
  /**
   * World root at the closing frame.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarSubjectObservation.end supplies deterministic spatial-grammar analysis: World root at the closing frame.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarSubjectObservation.end realizes deterministic continuity-grammar analysis: World root at the closing frame.
   */
  end: IAutoMovieVector3;
  /**
   * Positive world-space subject height in metres.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarSubjectObservation.height supplies deterministic spatial-grammar analysis: Positive world-space subject height in metres.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarSubjectObservation.height realizes deterministic continuity-grammar analysis: Positive world-space subject height in metres.
   */
  height: number;
  /**
   * Half the subject's horizontal diagonal in metres, or 0 when nothing
   * horizontal could be measured.
   *
   * The same number {@link IAutoMovieFramedBox.radius} states, and read here for
   * the same reason the framing solve reads it: a subject wider than the frame
   * can hold at its declared height is placed by its width, so a shot size
   * measured from the height alone reports a framing no camera delivered. A
   * figure is taller than it is wide at every shot size and its radius decides
   * nothing; a 60 m facade is the opposite.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarSubjectObservation.radius supplies deterministic spatial-grammar analysis: Half the subject's horizontal diagonal in metres, so a width-placed camera is read at the size it delivers.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarSubjectObservation.radius realizes deterministic continuity-grammar analysis: Half the subject's horizontal diagonal in metres, or 0 when nothing horizontal could be measured, read for the same reason the framing solve reads it: a subject wider than the frame can hold at its declared height is placed by its width, so a shot size measured from the height alone reports a framing no camera delivered.
   */
  radius: number;
  /**
   * Resolved gaze target over the shot, or null when it is not observed.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarSubjectObservation.eyeline supplies deterministic spatial-grammar analysis: Resolved gaze target over the shot, or null when it is not observed.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarSubjectObservation.eyeline realizes deterministic continuity-grammar analysis: Resolved gaze target over the shot, or null when it is not observed.
   */
  eyeline: {
    /** Stable semantic target id, even when that target is outside the frame. */
    target: string;
    /** World gaze target at the opening frame. */
    start: IAutoMovieVector3;
    /** World gaze target at the closing frame. */
    end: IAutoMovieVector3;
  } | null;
}
