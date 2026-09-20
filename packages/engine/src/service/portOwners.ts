import { IAutoMovieServiceNetwork, IAutoMovieServiceNode } from "@automovie/interface";

/**
 * Map every port id to the node that declares it, first declaration winning.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `portOwners` resolves each route endpoint to the fitting or terminal that physically owns that service connection.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `portOwners` builds a first-declaration-wins map from every port id to its containing network node.
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
