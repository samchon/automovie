import type { IAutoMovieServiceNetwork, IAutoMovieWetZone } from "@automovie/interface";

/** Map all matching wet zones in declaration order, retaining unmatched record identities. */
export function withZone(network: IAutoMovieServiceNetwork, id: string, edit: (zone: IAutoMovieWetZone) => IAutoMovieWetZone): IAutoMovieServiceNetwork {
  return {
    ...network,
    zones: network.zones.map((candidate: IAutoMovieWetZone): IAutoMovieWetZone =>
      candidate.id === id ? edit(candidate) : candidate,
    ),
  };
}
