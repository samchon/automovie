/**
 * A stable id paired with a human or LLM readable name: the identity a scene or sequence carries so later references resolve it and an editor can label it.
 *
 * IAutoMovieStage.scene and IAutoMovieEditPlan.sequence use it. stageScene and cutSequence refuse a blank id and copy both fields into their artifacts; neither requires name to be non-blank or unique.
 */
export interface IAutoMovieNamedId {
  /** Stable, non-blank id that later references cite. */
  id: string;

  /** Display name for editors and logs; never used to resolve a reference. */
  name: string;
}
