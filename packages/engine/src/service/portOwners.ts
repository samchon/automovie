import {
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
} from "@automovie/interface";

/**
 * Map every port id to the node that declares it, first declaration winning.
 */
export const portOwners = (
  network: IAutoMovieServiceNetwork,
): Map<string, IAutoMovieServiceNode> => {
  const owners = new Map<string, IAutoMovieServiceNode>();
  for (const node of network.nodes)
    for (const port of node.ports)
      if (!owners.has(port.id)) owners.set(port.id, node);
  return owners;
};
