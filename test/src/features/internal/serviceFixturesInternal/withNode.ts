import type {
  IAutoMovieServiceNetwork,
  IAutoMovieServiceNode,
} from "@automovie/interface";

/** Map every matching node in declaration order; unmatched records and other populations remain borrowed. */
export function withNode(
  network: IAutoMovieServiceNetwork,
  id: string,
  edit: (node: IAutoMovieServiceNode) => IAutoMovieServiceNode,
): IAutoMovieServiceNetwork {
  return {
    ...network,
    nodes: network.nodes.map(
      (candidate: IAutoMovieServiceNode): IAutoMovieServiceNode =>
        candidate.id === id ? edit(candidate) : candidate,
    ),
  };
}
