/**
 * Stable lock ledger retained after shooting-oriented downstream work starts.
 */
export interface IAutoMovieScreenplayLock {
  /** Actor that intentionally activated the soft lock. */
  activatedBy: "user" | "agent-before-first-shot";

  /** Why stable numbering is now required by downstream work. */
  reason: string;

  /**
   * Every scene id present when locked.
   *
   * Entries never disappear. Deleted scenes remain as `OMITTED` scene records;
   * newly inserted scenes use the alpha-prefixed insertion form.
   */
  sceneIds: string[];
}
