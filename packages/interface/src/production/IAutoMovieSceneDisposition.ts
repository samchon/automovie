/**
 * Explicit scene omission in a phase-local coverage ledger.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `IAutoMovieSceneDisposition` as the portable data boundary for the story scene local arc requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieSceneDisposition` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieSceneDisposition {
  /**
   * Workflow phase whose output intentionally omits the scene.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `phase` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `phase` for the narrative intent scene prose index system contract.
   */
  phase: "screenplay" | "production" | "edit";

  /**
   * Auditable reason the scene does not require a realized shot in this phase.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `reason` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `reason` for the narrative intent scene prose index system contract.
   */
  reason: string;
}
