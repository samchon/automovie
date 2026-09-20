import { IAutoMoviePropBox } from "./IAutoMoviePropBox";

/**
 * One axis-aligned model-local volume another prop may not occupy.
 *
 * The validator compares the transformed keep-out volume against the
 * transformed occupancy of every other uniquely staged, valid prop.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `IAutoMovieClearanceBox` as the portable data boundary for the story scene local arc requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieClearanceBox` for the narrative intent scene prose index system contract.
 * @author Samchon
 */
export interface IAutoMovieClearanceBox extends IAutoMoviePropBox {
  /**
   * Stable clearance identity, unique within the prop.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `id` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `id` for the narrative intent scene prose index system contract.
   */
  id: string;
}
