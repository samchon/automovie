/**
 * One planned shot, described in words before it is blocked and performed.
 *
 * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `IAutoMovieBeat` as the portable data boundary for the story beat observation plan requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `IAutoMovieBeat` for the narrative intent beat observation boundary system contract.
 */
export interface IAutoMovieBeat {
  /**
   * Stable id, referenced by the shot built from it.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `id` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `id` for the narrative intent beat observation boundary system contract.
   */
  id: string;

  /**
   * Short title ("the charge", "the rear").
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `name` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `name` for the narrative intent beat observation boundary system contract.
   */
  name: string;

  /**
   * What happens in this beat, in prose: the brief the blocking stage works to.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `summary` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `summary` for the narrative intent beat observation boundary system contract.
   */
  summary: string;

  /**
   * Rough length (seconds) the script imagines; blocking may refine it.
   *
   * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan Exposes `durationHint` as the portable data boundary for the story beat observation plan requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary Types `durationHint` for the narrative intent beat observation boundary system contract.
   */
  durationHint: number;
}
