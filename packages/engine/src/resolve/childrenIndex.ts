import { IAutoMovieNode } from "@automovie/interface";

/**
 * Build the parent → children adjacency the recompose walk needs.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Preserves hierarchy dependency edges so a driver update propagates through descendants.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Builds the concrete subtree graph used by world-driver recomposition.
 */
export const childrenIndex = (
  nodes: IAutoMovieNode[],
): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const n of nodes)
    if (n.parent !== null) {
      const siblings = map.get(n.parent);
      if (siblings !== undefined) siblings.push(n.id);
      else map.set(n.parent, [n.id]);
    }
  return map;
};
