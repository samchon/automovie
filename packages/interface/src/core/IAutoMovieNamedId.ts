/**
 * A stable id paired with a human / LLM readable name: the minimal identity an
 * authored artifact (a scene, a sequence) carries so later references resolve
 * it and an editor can label it.
 *
 * `IAutoMovieStage.scene` and `IAutoMovieEditPlan.sequence` use it.
 * `cutSequence` refuses an empty sequence id and copies both fields into the
 * assembled film; nothing requires `name` to be non-blank or unique.
 *
 * @author Samchon
 */
export interface IAutoMovieNamedId {
  /** Stable id later references cite. */
  id: string;

  /** Display name for editors and logs; never used to resolve a reference. */
  name: string;
}
