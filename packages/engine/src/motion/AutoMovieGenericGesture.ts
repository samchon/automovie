/**
 * Postural gestures synthesized by gestureMotion's clinical-angle templates.
 * Jump carries root translation through a separate branch; targeted strikes
 * belong to the actor synthesizer's reach path.
 *
 * @evidence contracts/common.md#principled-implementation A closed key union matches the ten clinical posture templates; root-translating jump is synthesized separately and targeted reach requires the actor's positional context.
 * @evidence contracts/common.md#clear-and-simple-design Names the gesture shape table's keys without adding unsupported target data or a separate template registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These supported gesture choices apply to every actor, without asset ids or renderer-dependent alternatives.
 * @evidence contracts/common.md#meaningful-documentation Identifies the template producer and explains the separate jump and targeted strike paths.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Ten erased literal alternatives choose no runtime synthesis algorithm themselves.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Template-key typing neither caches gestures nor coordinates synthesis across clip requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A gesture key owns no collection, handle or task; generated clips belong to the synthesizer's result.
 */
export type AutoMovieGenericGesture =
  | "bow"
  | "nod"
  | "shake"
  | "crouch"
  | "kick"
  | "stagger"
  | "wave"
  | "celebrate"
  | "draw"
  | "throw";
