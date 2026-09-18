import { IAutoMovieDialogueLine } from "./IAutoMovieDialogueLine";

/**
 * The beat payload, the tree's authored leaf level: stage direction, dialogue,
 * and the shot caption. A beat node joins the script's flat
 * {@link IAutoMovieBeat} list 1:1 through {@link beat}; the compiled shot
 * (`shot.id = "shot:" + beat`) is the graph's computed leaf below it.
 *
 * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `IAutoMovieBeatPayload` as the portable data boundary for the story beat observation plan requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `IAutoMovieBeatPayload` for the narrative intent beat observation boundary system contract.
 */
export interface IAutoMovieBeatPayload {
  /**
   * Id of the flat {@link IAutoMovieScript.beats} entry this node refines.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `beat` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `beat` for the narrative intent beat observation boundary system contract.
   */
  beat: string;

  /**
   * Stage direction: what happens, in prose (the blocking brief).
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `direction` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `direction` for the narrative intent beat observation boundary system contract.
   */
  direction: string;

  /**
   * Spoken lines in order, possibly empty.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `dialogue` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `dialogue` for the narrative intent beat observation boundary system contract.
   */
  dialogue: IAutoMovieDialogueLine[];

  /**
   * How this shot should read, for the human reviewer AND the diffusion pass
   * (the caption sidecar exports it), or `null`.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `caption` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `caption` for the narrative intent beat observation boundary system contract.
   */
  caption: string | null;
}
