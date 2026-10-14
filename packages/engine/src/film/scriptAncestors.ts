import { IAutoMovieScriptNode } from "@automovie/interface";

/**
 * The refinement chain above one screenplay node, nearest first and excluding the node itself: `["scene-1", "act-1", "intent"]` for a beat under that scene.
 *
 * Feedback located on a leaf walks this chain so a correction can target the beat, the scene, the act or the intent; which level to fix is the agent's call. The walker serves trees `validateScriptTree` has accepted, but throws on an unknown `nodeId`, a parent reference that does not resolve, or a parent cycle, naming the id at fault, because a chain that silently stopped short would misdirect the correction round. When ids repeat, the last node with an id is the one walked.
 *
 * @param tree Every node of the screenplay tree.
 * @param nodeId The node whose ancestors are wanted.
 * @returns Ancestor ids from the parent up to the root.
 *
 * @evidence contracts/common.md#principled-implementation Follows parent links from an id index and tracks visited ids, the standard way to walk a parent-pointer tree while proving termination, so a cycle is reported at the first repeated id rather than looping.
 * @evidence contracts/common.md#clear-and-simple-design One walk returning plain ids, which is all the cascade needs to address a level; validation of the whole tree stays in `validateScriptTree`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No node kind or depth is special-cased, and a malformed chain throws instead of returning the prefix that was found.
 * @evidence contracts/common.md#meaningful-documentation States the order and exclusion with an example, why the chain exists, the precondition, every throw, and which node wins a repeated id.
 * @evidence contracts/performance.md#efficient-algorithms O(N) to index the N nodes, then O(D) for a chain of depth D with constant-time lookups; the index is rebuilt per call because the tree is passed as a plain array.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one node per call; the tree carries no identity or version to key a reusable index on.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The index and the visited set are released on return; the returned chain holds at most the tree's node count of ids.
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
