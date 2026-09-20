/**
 * One treatment beat cited verbatim by a screenplay scene.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `IAutoMovieSceneBeatCoverage` as the portable data boundary for the story screenplay index prose requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieSceneBeatCoverage` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieSceneBeatCoverage {
  /**
   * Stable {@link IAutoMovieTreatmentBeat.id} carried by this scene.
   *
   * Identity, rather than coincidentally equal prose, keeps a beat in the
   * scene that owns it when two scenes use similar words.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes the exact treatment-beat join that authoritative scene prose must carry.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types the stable beat identity compared with the prose authority carrier.
   */
  id: string;

  /**
   * Why this scene is responsible for the cited dramatic beat.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `reason` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `reason` for the narrative intent scene prose index system contract.
   */
  reason: string;

  /**
   * Exact {@link IAutoMovieTreatmentBeat.text} value.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `beat` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `beat` for the narrative intent scene prose index system contract.
   */
  beat: string;
}
