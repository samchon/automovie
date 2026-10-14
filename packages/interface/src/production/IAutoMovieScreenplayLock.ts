/**
 * Stable lock ledger retained after shooting-oriented downstream work starts.
 *
 * @evidence contracts/common.md#principled-implementation An activation discriminator, reason and scene-id array record intended lock provenance; retaining every original id and using insertion numbering are authoring conventions, not enforced immutability.
 * @evidence contracts/common.md#clear-and-simple-design Activation actor, reason and retained id population express soft-lock provenance without embedding scene content or an editable revision counter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No runtime lock or renumbering compensation is implemented here; consumers must preserve original ids and tombstones when editing this mutable record.
 * @evidence contracts/common.md#meaningful-documentation Defines intentional activation, reason, permanent id retention, deletion tombstones and insertion numbering.
 * @author Samchon
 */
export interface IAutoMovieScreenplayLock {
  /** Actor that intentionally activated the soft lock. */
  activatedBy: "user" | "agent-before-first-shot";

  /** Why stable numbering is now required by downstream work. */
  reason: string;

  /**
   * Every scene id present when locked.
   *
   * Entries never disappear. Deleted scenes remain as `OMITTED` scene records; newly inserted scenes use the alpha-prefixed insertion form.
   */
  sceneIds: string[];
}
