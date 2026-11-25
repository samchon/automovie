/**
 * A stable id paired with a human or LLM readable name: the identity a scene or
 * sequence carries so later references resolve it and an editor can label it.
 *
 * IAutoMovieStage.scene and IAutoMovieEditPlan.sequence use it. stageScene and
 * cutSequence copy both fields into their artifacts; neither requires name to
 * be unique.
 */
export interface IAutoMovieNamedId {
  /** Stable id that later references cite. */
  id: string;

  /** Display name for editors and logs; never used to resolve a reference. */
  name: string;
}
