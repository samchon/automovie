/**
 * A stable id paired with a human or LLM readable name: the identity a scene or sequence carries so later references resolve it and an editor can label it.
 *
 * IAutoMovieStage.scene and IAutoMovieEditPlan.sequence use it. stageScene and cutSequence refuse a blank id and copy both fields into their artifacts; neither requires name to be non-blank or unique.
 *
 * @evidence contracts/common.md#principled-implementation `stageScene` and `cutSequence` check the id with a trimmed-length test and copy `id` and `name` unchanged into the artifact they produce, so references resolve by the authored id.
 * @evidence contracts/common.md#clear-and-simple-design One two-field record shared by both authoring inputs, rather than an id and a name repeated on each plan type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts References resolve by id only and never fall back to matching a name, and the documentation states that name uniqueness is not enforced.
 * @evidence contracts/common.md#meaningful-documentation States who uses the record, which producers check the id and copy both fields, and that the name is display-only and unchecked.
 */
export interface IAutoMovieNamedId {
  /** Stable, non-blank id that later references cite. */
  id: string;

  /** Display name for editors and logs; never used to resolve a reference. */
  name: string;
}
