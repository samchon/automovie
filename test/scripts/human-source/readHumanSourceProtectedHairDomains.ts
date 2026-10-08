import type { IAutoMovieHumanFaceBasisSurface } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceHairDomain } from "@automovie/human/face/structures/IAutoMovieHumanFaceHairDomain";

/**
 * Read the original growth metadata protected during facial registration.
 * The facial producer alone owns tagged terminal territories. Untagged scalp
 * and other original domains remain exact protected content in geometry and
 * head-projection checks. An absent or empty protected population means none;
 * this derived view does not mutate the source's array or any domain.
 */
export function readHumanSourceProtectedHairDomains(
  surface: IAutoMovieHumanFaceBasisSurface,
): IAutoMovieHumanFaceHairDomain[] | undefined {
  const protectedDomains = surface.hairDomains?.filter(
    (domain) => domain.facialHairSite === undefined,
  );
  return protectedDomains?.length === 0 ? undefined : protectedDomains;
}
