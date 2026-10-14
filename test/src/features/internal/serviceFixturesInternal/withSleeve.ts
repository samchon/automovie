import type {
  IAutoMovieServiceNetwork,
  IAutoMovieServicePenetration,
} from "@automovie/interface";

/** Map all matching penetrations in declaration order, retaining unmatched record identities. */
export function withSleeve(
  network: IAutoMovieServiceNetwork,
  id: string,
  edit: (sleeve: IAutoMovieServicePenetration) => IAutoMovieServicePenetration,
): IAutoMovieServiceNetwork {
  return {
    ...network,
    penetrations: network.penetrations.map(
      (
        candidate: IAutoMovieServicePenetration,
      ): IAutoMovieServicePenetration =>
        candidate.id === id ? edit(candidate) : candidate,
    ),
  };
}
