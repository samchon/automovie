import { IAutoMovieServiceNetwork, IAutoMovieServiceNode } from "@automovie/interface";
/**
 * Map every port id to the node that declares it, first declaration winning.
 * Values alias source nodes; duplicate admission belongs to validateServiceNetwork.
 *
 * @evidence contracts/common.md#principled-implementation First-occurrence map insertion gives a deterministic owner for each port id even while the validator separately reports duplicate declarations.
 * @evidence contracts/common.md#clear-and-simple-design Reach, clashes and schematic consumers share one port-to-node lookup instead of repeating network traversal at every endpoint.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate ids are neither normalized nor overwritten; the declared first-owner convention is visible to diagnostics rather than silently repaired.
 * @evidence contracts/common.md#meaningful-documentation States key identity, first-occurrence tie policy, source-node aliases and the validator's separate duplicate obligation.
 * @evidence contracts/performance.md#efficient-algorithms One traversal of P ports builds at most P map entries in expected O(P) time and space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One caller owns each constructed lookup for its operation; no cross-call map assumes mutable node/port equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The new map transfers to its caller and retains source-node aliases only while that lookup remains reachable.
 */
export const portOwners: (network: IAutoMovieServiceNetwork) => Map<string, IAutoMovieServiceNode> = (
  network: IAutoMovieServiceNetwork,
): Map<string, IAutoMovieServiceNode> => {
  const owners: Map<string, IAutoMovieServiceNode> = new Map<string, IAutoMovieServiceNode>();
  for (const node of network.nodes)
    for (const port of node.ports)
      if (!owners.has(port.id)) owners.set(port.id, node);
  return owners;
};
