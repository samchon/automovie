/**
 * One exact prose beat promised by the treatment.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `IAutoMovieTreatmentBeat` as the portable data boundary for the story screenplay index prose requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieTreatmentBeat` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieTreatmentBeat {
  /**
   * Stable beat id used for diagnosis and human navigation.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `id` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `id` for the narrative intent scene prose index system contract.
   */
  id: string;

  /**
   * Exact non-blank prose copied by a scene's `covers` entry.
   *
   * Verbatim matching keeps the machine layer from pretending that a nearby
   * label proves the dramatic promise was actually carried forward.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `text` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `text` for the narrative intent scene prose index system contract.
   */
  text: string;
}
