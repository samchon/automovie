import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";

/**
 * One perspective camera sample at a shot boundary.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarCameraObservation supplies deterministic spatial-grammar analysis: One perspective camera sample at a shot boundary.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarCameraObservation realizes deterministic continuity-grammar analysis: One perspective camera sample at a shot boundary.
 */
export interface IAutoMovieGrammarCameraObservation extends IAutoMovieResolvedCamera {
  /**
   * Vertical field of view in degrees.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarCameraObservation.fovY supplies deterministic spatial-grammar analysis: Vertical field of view in degrees.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarCameraObservation.fovY realizes deterministic continuity-grammar analysis: Vertical field of view in degrees.
   */
  fovY: number;
  /**
   * Render width divided by height.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarCameraObservation.aspect supplies deterministic spatial-grammar analysis: Render width divided by height.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarCameraObservation.aspect realizes deterministic continuity-grammar analysis: Render width divided by height.
   */
  aspect: number;
}
