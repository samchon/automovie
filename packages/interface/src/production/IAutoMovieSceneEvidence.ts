/**
 * One downstream citation of an authored screenplay scene.
 *
 * The reason comes first because traceability starts with why the consumer
 * needs evidence; {@link scene} then names the stable locked production fact. A
 * continuity claim may be cited as additional traceability, but only its
 * declared verification owner can prove it.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `IAutoMovieSceneEvidence` as the portable data boundary for the story screenplay index prose requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieSceneEvidence` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieSceneEvidence {
  /**
   * Why this downstream record depends on the cited scene.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `reason` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `reason` for the narrative intent scene prose index system contract.
   */
  reason: string;
  /**
   * Existing screenplay scene id.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `scene` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `scene` for the narrative intent scene prose index system contract.
   */
  scene: string;
  /**
   * Existing continuity claim id, or null when no canon claim is cited.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `claim` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `claim` for the narrative intent scene prose index system contract.
   */
  claim?: string;
}
