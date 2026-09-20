import { IAutoMovieScriptNode } from "@automovie/interface";

/**
 * The refinement chain above one screenplay node, nearest-first and excluding
 * the node itself: `["scene-1", "act-1", "intent"]` for a beat under that
 * scene. This is the cascade path of D013: feedback located on a leaf walks
 * this chain so a correction can target the beat, the scene, the act, or the
 * intent (which level to fix is the agent's call, D012).
 *
 * The walker serves already-validated trees (`validateScriptTree`) but refuses
 * silent drops on malformed input, the `bindProfile` precedent: an unknown
 * `nodeId`, a parent reference that does not resolve, or a parent cycle all
 * **throw**. A cascade that silently stopped short would misdirect the
 * correction round.
 *
 * @evidence requirements/story/beats-and-causality.md#story-beat-observation-plan scriptAncestors exposes the nearest-first refinement path that lets beat evidence and corrections cascade to their owning scene, act, and intent.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-beat-observation-boundary scriptAncestors realizes beat observation boundaries: The refinement chain above one screenplay node, nearest-first and excluding the node itself: `["scene-1", "act-1", "intent"]` for a beat under that scene. This is the cascade path of D013: feedback located on a leaf walks this chain so a correction can target the beat, the scene, the act, or the intent (which level to fix is the agent's call, D012). The walker serves already-validated trees (`validateScriptTree`) but refuses silent drops on malformed input, the `bindProfile` precedent: an unknown `nodeId`, a parent reference that does not resolve, or a parent cycle all **throw**. A cascade that silently stopped short would misdirect the correction round.
 */
export const scriptAncestors = (
  tree: readonly IAutoMovieScriptNode[],
  nodeId: string,
): string[] => {
  const byId = new Map(tree.map((node) => [node.id, node]));
  const start = byId.get(nodeId);
  if (start === undefined)
    throw new Error(
      `scriptAncestors node "${nodeId}" is not in the screenplay tree`,
    );

  const chain: string[] = [];
  const visited = new Set<string>([nodeId]);
  let parent = start.parent;
  while (parent !== null) {
    if (visited.has(parent))
      throw new Error(
        `scriptAncestors parent chain of "${nodeId}" is cyclic at "${parent}"`,
      );
    const node = byId.get(parent);
    if (node === undefined)
      throw new Error(
        `scriptAncestors parent "${parent}" is not in the screenplay tree`,
      );
    visited.add(parent);
    chain.push(parent);
    parent = node.parent;
  }
  return chain;
};
