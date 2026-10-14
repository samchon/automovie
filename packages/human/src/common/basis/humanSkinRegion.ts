import type { IAutoMovieHumanSkinRegion } from "./IAutoMovieHumanSkinRegion";
import type { IAutoMovieHumanSkinRegionHolder } from "./IAutoMovieHumanSkinRegionHolder";

/**
 * A basis's named skin area, or a refusal naming the area and the basis when
 * the basis does not declare it. There is no fallback: another basis's vertex
 * list names a different place.
 *
 * @evidence contracts/common.md#principled-implementation Requires an own region entry, preserving its object unchanged and refusing with area/basis labels when absent.
 * @evidence contracts/common.md#clear-and-simple-design One named-area lookup keeps measurement rules independent of topology-specific vertex lists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inherited names and membership from another basis cannot satisfy a required area.
 * @evidence contracts/common.md#meaningful-documentation Documents ownership and name-specific refusal without fallback.
 * @evidence contracts/performance.md#efficient-algorithms Expected O(1) own-key lookup does not copy or scan the region's vertices.
 * @evidence contracts/performance.md#reuse-equivalent-work Returns the current existing region instead of caching resolution across membership changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no dictionary or vertex list; the borrowed result remains with its basis owner.
 */
export function humanSkinRegion(
  basis: Pick<IAutoMovieHumanSkinRegionHolder, "id" | "skinRegions">,
  name: string,
): IAutoMovieHumanSkinRegion {
  const regions: IAutoMovieHumanSkinRegionHolder["skinRegions"] =
    basis.skinRegions;
  const region: IAutoMovieHumanSkinRegion | undefined =
    regions !== undefined && Object.hasOwn(regions, name)
      ? regions[name]
      : undefined;
  if (region === undefined)
    throw new Error(`The basis ${basis.id} declares no skin region ${name}.`);
  return region;
}
