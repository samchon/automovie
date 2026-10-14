import type { IAutoMovieServiceNetwork, IAutoMovieServiceSegment } from "@automovie/interface";

/** Map all matching runs in declaration order; unmatched records and other populations remain borrowed. */
export function withSegment(network: IAutoMovieServiceNetwork, id: string, edit: (segment: IAutoMovieServiceSegment) => IAutoMovieServiceSegment): IAutoMovieServiceNetwork {
  return {
    ...network,
    segments: network.segments.map((candidate: IAutoMovieServiceSegment): IAutoMovieServiceSegment =>
      candidate.id === id ? edit(candidate) : candidate,
    ),
  };
}
