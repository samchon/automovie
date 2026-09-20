import { IAutoMovieScriptNode } from "@automovie/interface";

/**
 * The beat-kind node claiming one flat {@link IAutoMovieScript.beats} entry, or
 * `null` when there is no tree or no node claims it. This is the join
 * `validateScriptTree` enforces 1:1 on a committed tree, the lookup a
 * beat-scoped consumer uses to locate its feedback on the graph.
 *
 * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan beatNodeOf makes the beat observation plan explicit: The beat-kind node claiming one flat {@link IAutoMovieScript.beats} entry, or `null` when there is no tree or no node claims it. This is the join `validateScriptTree` enforces 1:1 on a committed tree, the lookup a beat-scoped consumer uses to locate its feedback on the graph.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary beatNodeOf realizes beat observation boundaries: The beat-kind node claiming one flat {@link IAutoMovieScript.beats} entry, or `null` when there is no tree or no node claims it. This is the join `validateScriptTree` enforces 1:1 on a committed tree, the lookup a beat-scoped consumer uses to locate its feedback on the graph.
 */
export const beatNodeOf = (
  tree: readonly IAutoMovieScriptNode[] | null | undefined,
  beatId: string,
): string | null => {
  if (tree === null || tree === undefined) return null;
  for (const node of tree)
    if (node.kind === "beat" && node.payload.beat === beatId) return node.id;
  return null;
};
