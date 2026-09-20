/**
 * The scene payload, the screenplay slug plus optional description: where and
 * when the scene lives. The slug is the human-and-diffusion shared address of
 * the location.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `IAutoMovieScenePayload` as the portable data boundary for the story scene local arc requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieScenePayload` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieScenePayload {
  /**
   * Interior or exterior.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `interiorExterior` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `interiorExterior` for the narrative intent scene prose index system contract.
   */
  interiorExterior: "INT" | "EXT";

  /**
   * Location name ("hotel lobby").
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `location` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `location` for the narrative intent scene prose index system contract.
   */
  location: string;

  /**
   * Time of day ("dawn", "night").
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `timeOfDay` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `timeOfDay` for the narrative intent scene prose index system contract.
   */
  timeOfDay: string;

  /**
   * Optional scene-setting prose, or `null`.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `description` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `description` for the narrative intent scene prose index system contract.
   */
  description: string | null;
}
