/**
 * Stable lock ledger retained after shooting-oriented downstream work starts.
 *
 * @evidence contracts/common.md#principled-implementation The lock captures every scene id at activation and preserves those addresses permanently; deletion becomes an OMITTED record and insertion uses an alpha-prefixed id so downstream references do not renumber.
 * @evidence contracts/common.md#clear-and-simple-design Activation actor, reason and retained id population express soft-lock provenance without embedding scene content or an editable revision counter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Locked ids cannot disappear or be reassigned to close numbering gaps; tombstones preserve identity rather than pretending that deletion removes downstream obligations silently.
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
