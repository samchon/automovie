import { IAutoMovieScriptNode } from "@automovie/interface";

/**
 * The refinement chain above one screenplay node, nearest first and excluding
 * the node itself: `["scene-1", "act-1", "intent"]` for a beat under that
 * scene.
 *
 * Feedback located on a leaf walks this chain so a correction can target the
 * beat, the scene, the act or the intent; which level to fix is the agent's
 * call. The walker serves trees `validateScriptTree` has accepted, but throws
 * on an unknown `nodeId`, a parent reference that does not resolve, or a parent
 * cycle, naming the id at fault, because a chain that silently stopped short
 * would misdirect the correction round. When ids repeat, the last node with an
 * id is the one walked.
 *
 * @param tree Every node of the screenplay tree.
 * @param nodeId The node whose ancestors are wanted.
 * @returns Ancestor ids from the parent up to the root.
 */
export function scriptAncestors(
  tree: readonly IAutoMovieScriptNode[],
  nodeId: string,
): string[] {
  const byId: Map<string, IAutoMovieScriptNode> = new Map(
    tree.map((node: IAutoMovieScriptNode): [string, IAutoMovieScriptNode] => [
      node.id,
      node,
    ]),
  );
  const start: IAutoMovieScriptNode | undefined = byId.get(nodeId);
  if (start === undefined)
    throw new Error(
      `scriptAncestors node "${nodeId}" is not in the screenplay tree`,
    );

  const chain: string[] = [];
  const visited: Set<string> = new Set([nodeId]);
  let parent: string | null = start.parent;
  while (parent !== null) {
    if (visited.has(parent))
      throw new Error(
        `scriptAncestors parent chain of "${nodeId}" is cyclic at "${parent}"`,
      );
    const node: IAutoMovieScriptNode | undefined = byId.get(parent);
    if (node === undefined)
      throw new Error(
        `scriptAncestors parent "${parent}" is not in the screenplay tree`,
      );
    visited.add(parent);
    chain.push(parent);
    parent = node.parent;
  }
  return chain;
}
