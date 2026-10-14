import type {
  IAutoMovieServiceNetwork,
  IAutoMovieServiceSystem,
} from "@automovie/interface";

/** Map all matching systems in declaration order, retaining unmatched record identities. */
export function withSystem(
  network: IAutoMovieServiceNetwork,
  id: string,
  edit: (system: IAutoMovieServiceSystem) => IAutoMovieServiceSystem,
): IAutoMovieServiceNetwork {
  return {
    ...network,
    systems: network.systems.map(
      (candidate: IAutoMovieServiceSystem): IAutoMovieServiceSystem =>
        candidate.id === id ? edit(candidate) : candidate,
    ),
  };
}
