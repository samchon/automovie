import {
  IAutoMovieServiceNetwork,
  IAutoMovieServicePort,
} from "@automovie/interface";

/*
 * Map port ids to their source records, retaining the first declaration.
 */
export function portRecords(
  network: IAutoMovieServiceNetwork,
): Map<string, IAutoMovieServicePort> {
  const ports: Map<string, IAutoMovieServicePort> = new Map<
    string,
    IAutoMovieServicePort
  >();
  for (const node of network.nodes)
    for (const port of node.ports)
      if (!ports.has(port.id)) ports.set(port.id, port);
  return ports;
}
