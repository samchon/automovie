import { IAutoMovieScenePayload } from "./IAutoMovieScenePayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * A scene (slug level).
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `IAutoMovieScriptSceneNode` as the portable data boundary for the story scene local arc requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieScriptSceneNode` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieScriptSceneNode extends IAutoMovieScriptNodeBase {
  /**
   * Discriminator.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `kind` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `kind` for the narrative intent scene prose index system contract.
   */
  kind: "scene";

  /**
   * What this level of thought carries.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-local-arc Exposes `payload` as the portable data boundary for the story scene local arc requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `payload` for the narrative intent scene prose index system contract.
   */
  payload: IAutoMovieScenePayload;
}
