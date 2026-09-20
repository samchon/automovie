/**
 * Common shape of every screenplay node: the refinement edge plus the two
 * cross-cutting edges of the refinement graph.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `IAutoMovieScriptNodeBase` as the portable data boundary for the story screenplay index prose requirement.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `IAutoMovieScriptNodeBase` for the narrative intent scene prose index system contract.
 */
export interface IAutoMovieScriptNodeBase {
  /**
   * Stable id, unique across the whole tree.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `id` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `id` for the narrative intent scene prose index system contract.
   */
  id: string;

  /**
   * The refinement edge: the parent this node makes concrete, or `null` for the
   * single intent root. The refinement axis is a strict tree (acyclic, one
   * root); feedback propagates up this chain.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `parent` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `parent` for the narrative intent scene prose index system contract.
   */
  parent: string | null;

  /**
   * The temporal edge: the node this one follows on the timeline (a beat
   * continuing from the previous beat, aligning with the beat-end continuity
   * handoff), or `null` when nothing precedes it.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `temporal` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `temporal` for the narrative intent scene prose index system contract.
   */
  temporal: string | null;

  /**
   * Cross-cutting interaction edges: nodes this one plays against (the beat of
   * the opponent in a duel). Free-form, validated to resolve.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-screenplay-index-prose Exposes `interactsWith` as the portable data boundary for the story screenplay index prose requirement.
   * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types `interactsWith` for the narrative intent scene prose index system contract.
   */
  interactsWith: string[];
}
