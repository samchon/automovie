import { IAutoMovieBeatPayload } from "./IAutoMovieBeatPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * The authored leaf: one beat's direction, dialogue, and caption.
 *
 * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `IAutoMovieScriptBeatNode` as the portable data boundary for the story beat observation plan requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `IAutoMovieScriptBeatNode` for the narrative intent beat observation boundary system contract.
 */
export interface IAutoMovieScriptBeatNode extends IAutoMovieScriptNodeBase {
  /**
   * Discriminator.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `kind` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `kind` for the narrative intent beat observation boundary system contract.
   */
  kind: "beat";

  /**
   * What this level of thought carries.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `payload` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `payload` for the narrative intent beat observation boundary system contract.
   */
  payload: IAutoMovieBeatPayload;
}
