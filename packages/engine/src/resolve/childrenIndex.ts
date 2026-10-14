import { IAutoMovieNode } from "@automovie/interface";

/** Build the parent → children adjacency the recompose walk needs.
 *
 * @evidence contracts/common.md#principled-implementation Group each non-root node id under its declared parent, preserving input sibling order; composeScene separately admits unique ids and valid acyclic parent references.
 * @evidence contracts/common.md#clear-and-simple-design One adjacency index supports descendant recomposition without rescanning the full node list for every visited parent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No inferred parent or fixture ordering is introduced; standalone indexing does not prove graph validity.
 * @evidence contracts/common.md#meaningful-documentation Docs identify parent-to-children direction, staging-order preservation and root omission.
 * @evidence contracts/performance.md#efficient-algorithms N nodes require O(N) traversal and O(N) child references plus one entry per represented parent.
 * @evidence contracts/performance.md#reuse-equivalent-work resolveFrame builds one adjacency map for all world drivers in that frame; changed parent/id topology requires rebuilding.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh map/arrays and borrowed id strings; no source node records, traversal task or host handle is retained.
 */
export const childrenIndex: (
  nodes: IAutoMovieNode[],
) => Map<string, string[]> = (
  nodes: IAutoMovieNode[],
): Map<string, string[]> => {
  const map: Map<string, string[]> = new Map<string, string[]>();
  for (const n of nodes)
    if (n.parent !== null) {
      const siblings: string[] | undefined = map.get(n.parent);
      if (siblings !== undefined) siblings.push(n.id);
      else map.set(n.parent, [n.id]);
    }
  return map;
};
