/**
 * Stable lock ledger retained after shooting-oriented downstream work starts.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `IAutoMovieScreenplayLock` as the portable data boundary for the story screenplay index prose requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieScreenplayLock` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieScreenplayLock {
  /**
   * Actor that intentionally activated the soft lock.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `activatedBy` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `activatedBy` for the narrative intent scene prose index system contract.
   */
  activatedBy: "user" | "agent-before-first-shot";

  /**
   * Why stable numbering is now required by downstream work.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `reason` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `reason` for the narrative intent scene prose index system contract.
   */
  reason: string;

  /**
   * Every scene id present when locked.
   *
   * Entries never disappear. Deleted scenes remain as `OMITTED` scene records;
   * newly inserted scenes use the alpha-prefixed insertion form.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `sceneIds` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `sceneIds` for the narrative intent scene prose index system contract.
   */
  sceneIds: string[];
}
