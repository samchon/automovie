import { IAutoMovieServiceNetwork, IAutoMovieServicePort } from "@automovie/interface";
/**
 * Map port ids to their source records, retaining the first declaration.
 *
 * @evidence contracts/common.md#principled-implementation A has-before-set traversal interns exact ids in declaration order, matching validator port-path selection when duplicate ids are reported.
 * @evidence contracts/common.md#clear-and-simple-design Network validation resolves each segment endpoint through one shared map rather than scanning every node's ports repeatedly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate and whitespace ids retain their source spelling and first occurrence; this lookup does not replace identity admission.
 * @evidence contracts/common.md#meaningful-documentation Defines exact keys, source-record values and first-occurrence policy without claiming the map validates its input.
 * @evidence contracts/performance.md#efficient-algorithms P inspected ports require expected O(P) map work and up to P distinct entries, with no pairwise id comparisons.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The validator reuses this map within one network check; a different or mutated graph requires another construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned entries alias input port records; releasing the caller-owned map drops its references and retains no network cache.
 */
export const portRecords: (network: IAutoMovieServiceNetwork) => Map<string, IAutoMovieServicePort> = (
  network: IAutoMovieServiceNetwork,
): Map<string, IAutoMovieServicePort> => {
  const ports: Map<string, IAutoMovieServicePort> = new Map<string, IAutoMovieServicePort>();
  for (const node of network.nodes)
    for (const port of node.ports)
      if (!ports.has(port.id)) ports.set(port.id, port);
  return ports;
};
