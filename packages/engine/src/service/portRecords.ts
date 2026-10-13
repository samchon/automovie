import {
  IAutoMovieServiceNetwork,
  IAutoMovieServicePort,
} from "@automovie/interface";

/** Map every port id to the port record itself, first declaration winning. */
export const portRecords = (
  network: IAutoMovieServiceNetwork,
): Map<string, IAutoMovieServicePort> => {
  const ports = new Map<string, IAutoMovieServicePort>();
  for (const node of network.nodes)
    for (const port of node.ports)
      if (!ports.has(port.id)) ports.set(port.id, port);
  return ports;
};
