/**
 * A character the film needs, mapped to the scene node that will play it.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `IAutoMovieCastMember` as the portable data boundary for the story scene local arc requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieCastMember` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieCastMember {
  /**
   * Id of the scene node (set in staging) that embodies this character.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `node` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `node` for the narrative intent scene prose index system contract.
   */
  node: string;

  /**
   * Who they are, read by the model when blocking their action.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `character` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `character` for the narrative intent scene prose index system contract.
   */
  character: string;

  /**
   * Optional reference to an existing/importable model (a VRM, a built rig), or
   * null to use a generated stand-in.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `modelRef` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `modelRef` for the narrative intent scene prose index system contract.
   */
  modelRef: string | null;
}
