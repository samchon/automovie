import { IAutoMovieScriptNode } from "./IAutoMovieScriptNode";
import { IAutoMovieBeat } from "./IAutoMovieBeat";
import { IAutoMovieCastMember } from "./IAutoMovieCastMember";

/**
 * The script: the macro plan the rest of the production works from.
 *
 * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `IAutoMovieScript` as the portable data boundary for the story beat observation plan requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `IAutoMovieScript` for the narrative intent beat observation boundary system contract.
 */
export interface IAutoMovieScript {
  /**
   * One-sentence summary of the film.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `logline` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `logline` for the narrative intent beat observation boundary system contract.
   */
  logline: string;

  /**
   * The intent / mood the shots should serve.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `theme` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `theme` for the narrative intent beat observation boundary system contract.
   */
  theme: string;

  /**
   * Everyone who appears.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `cast` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `cast` for the narrative intent beat observation boundary system contract.
   */
  cast: IAutoMovieCastMember[];

  /**
   * The ordered beats (each becomes a shot).
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `beats` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `beats` for the narrative intent beat observation boundary system contract.
   */
  beats: IAutoMovieBeat[];

  /**
   * The screenplay refinement tree ({@link IAutoMovieScriptNode}, D013): intent
   * → acts/scenes/groups → beat nodes carrying stage direction, dialogue, and
   * shot captions. Evolving-schema optional: absent means the flat `beats` list
   * is the whole authored structure (fully backward-compatible); when present,
   * beat-kind nodes join `beats` 1:1 and the tree validates on commit.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `tree` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `tree` for the narrative intent beat observation boundary system contract.
   */
  tree?: IAutoMovieScriptNode[] | null;
}
