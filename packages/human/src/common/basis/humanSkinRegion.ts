import type { IAutoMovieHumanSkinRegion } from "./IAutoMovieHumanSkinRegion";
import type { IAutoMovieHumanSkinRegionHolder } from "./IAutoMovieHumanSkinRegionHolder";

/**
 * A basis's named skin area, or a refusal naming the area and the basis when
 * the basis does not declare it. There is no fallback: another basis's vertex
 * list names a different place.
 */
export function humanSkinRegion(
  basis: Pick<IAutoMovieHumanSkinRegionHolder, "id" | "skinRegions">,
  name: string,
): IAutoMovieHumanSkinRegion {
  const regions = basis.skinRegions;
  const region =
    regions !== undefined && Object.hasOwn(regions, name)
      ? regions[name]
      : undefined;
  if (region === undefined)
    throw new Error(`The basis ${basis.id} declares no skin region ${name}.`);
  return region;
}
