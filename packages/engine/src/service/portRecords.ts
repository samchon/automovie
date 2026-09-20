import { IAutoMovieServiceNetwork, IAutoMovieServicePort } from "@automovie/interface";

/**
 * Map every port id to the port record itself, first declaration winning.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `portRecords` exposes the medium, direction, demand, and system declaration behind every route endpoint id.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `portRecords` indexes the first declared typed port record for each identifier across all network nodes.
 */
export const portRecords = (
  network: IAutoMovieServiceNetwork,
): Map<string, IAutoMovieServicePort> => {
  const ports = new Map<string, IAutoMovieServicePort>();
  for (const node of network.nodes)
    for (const port of node.ports)
      if (!ports.has(port.id)) ports.set(port.id, port);
  return ports;
};
