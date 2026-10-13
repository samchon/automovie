/**
 * A stable id paired with a human / LLM readable name: the minimal identity an
 * authored artifact (a scene, a sequence) carries so later references resolve
 * it and an editor can label it.
 *
 * `IAutoMovieStage.scene` and `IAutoMovieEditPlan.sequence` use it.
 * `cutSequence` refuses an empty sequence id and copies both fields into the
 * assembled film; nothing requires `name` to be non-blank or unique.
 *
 * @evidence contracts/common.md#principled-implementation Separates the reference key from the label, so renaming an artifact never breaks a citation; `cutSequence` validates the id as non-empty and carries both strings into the assembled film unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Exactly two strings shared by the stage scene and the edit-plan sequence, instead of each artifact redeclaring its own identity pair.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No id format or name is special-cased here; emptiness and uniqueness checks stay with the artifact validators that own each collection.
 * @evidence contracts/common.md#meaningful-documentation States which artifacts carry the pair, what cites the id, that the name is a label only, and which checks consumers apply.
 * @author Samchon
 */
export interface IAutoMovieNamedId {
  /** Stable id later references cite. */
  id: string;

  /** Display name for editors and logs; never used to resolve a reference. */
  name: string;
}
