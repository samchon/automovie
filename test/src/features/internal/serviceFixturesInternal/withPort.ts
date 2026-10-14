import type { IAutoMovieServiceNetwork, IAutoMovieServiceNode, IAutoMovieServicePort } from "@automovie/interface";

/** Copy every node and port array, editing all matching port ids in order; unmatched port records remain borrowed. */
export function withPort(network: IAutoMovieServiceNetwork, id: string, edit: (port: IAutoMovieServicePort) => IAutoMovieServicePort): IAutoMovieServiceNetwork {
  return {
    ...network,
    nodes: network.nodes.map((node: IAutoMovieServiceNode): IAutoMovieServiceNode => ({
      ...node,
      ports: node.ports.map((candidate: IAutoMovieServicePort): IAutoMovieServicePort =>
        candidate.id === id ? edit(candidate) : candidate,
      ),
    })),
  };
}
