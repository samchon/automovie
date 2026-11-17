/**
 * Postural gestures synthesized by gestureMotion's clinical-angle templates.
 * Jump carries root translation through a separate branch; targeted strikes
 * belong to the actor synthesizer's reach path.
 *
 * @evidence contracts/development/design.md#principled-representation A closed key union matches the ten clinical posture templates; root-translating jump is synthesized separately and targeted reach requires the actor's positional context.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Names the gesture shape table's keys without adding unsupported target data or a separate template registry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These supported gesture choices apply to every actor, without asset ids or renderer-dependent alternatives.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the template producer and explains the separate jump and targeted strike paths.
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
