import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One axis-aligned model-local volume.
 *
 * The engine transforms all eight corners by the prop's full staged TRS
 * (translation, unit quaternion, per-axis scale) and takes the world bounds of
 * the result, so a rotated box widens rather than being silently re-fitted.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `IAutoMoviePropBox` as the portable data boundary for the story scene local arc requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMoviePropBox` for the narrative intent scene prose index system contract.
 * @author Samchon
 */
export interface IAutoMoviePropBox {
  /**
   * Local minimum corner.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `min` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `min` for the narrative intent scene prose index system contract.
   */
  min: IAutoMovieVector3;

  /**
   * Local maximum corner, strictly greater on every axis.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `max` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `max` for the narrative intent scene prose index system contract.
   */
  max: IAutoMovieVector3;
}
