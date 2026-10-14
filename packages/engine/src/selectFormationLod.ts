import { IAutoMovieFormationLodInput } from "./IAutoMovieFormationLodInput";
import { IAutoMovieFormationLodSelection } from "./IAutoMovieFormationLodSelection";
import { IAutoMovieCompiledFormationLod } from "@automovie/interface";
/**
 * Select automatic formation LOD from distance and projected contribution.
 *
 * Twenty-four projected pixels are neutral. A prior tier retains a 10% boundary
 * deadband so camera jitter cannot thrash instance buffers.
 * The caller supplies an ordered admitted tier list, finite distance/pixel
 * values and an optional fractional hysteresis. Returned lod aliases that list.
 *
 * @evidence contracts/common.md#principled-implementation Effective distance scales physical distance by neutral twenty-four pixels over max(1,pixels); a previous tier remains while its directional boundary lies inside the supplied hysteresis fraction.
 * @evidence contracts/common.md#clear-and-simple-design Formation and instance-set renderers share selection while their projected contribution and previous tier storage remain consumer-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neutral pixel size and default ten-percent hysteresis are documented rendering policy, and an empty tier list refuses instead of fabricating a tier.
 * @evidence contracts/common.md#meaningful-documentation States neutral contribution, default deadband, admitted ordered inputs and returned tier alias ownership.
 * @evidence contracts/performance.md#efficient-algorithms Two findIndex scans cost O(L) for L tiers, with constant arithmetic and one returned record, independent of instance population.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The renderer supplies its prior selection; this query stores no camera history or buffer allocation itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the result record is allocated, its tier is a caller-owned alias, and no instance buffer or camera reference survives.
 */
export const selectFormationLod: (input: IAutoMovieFormationLodInput) => IAutoMovieFormationLodSelection = (
  input: IAutoMovieFormationLodInput,
): IAutoMovieFormationLodSelection => {
  if (input.lod.length === 0)
    throw new Error("A compiled formation requires at least one LOD tier.");
  const projectedPixels: number = Math.max(1, input.projectedPixels);
  const effectiveDistance: number = input.distance * (24 / projectedPixels);
  const matchedIndex: number = input.lod.findIndex(
    (lod: IAutoMovieCompiledFormationLod): boolean => lod.maxDistance === null || effectiveDistance <= lod.maxDistance,
  );
  const desiredIndex: number = matchedIndex < 0 ? input.lod.length - 1 : matchedIndex;
  const previousIndex: number = input.lod.findIndex(
    (lod: IAutoMovieCompiledFormationLod): boolean => lod.tier === input.previous,
  );
  if (previousIndex < 0 || previousIndex === desiredIndex)
    return { lod: input.lod[desiredIndex]!, effectiveDistance };
  const hysteresis: number = input.hysteresis ?? 0.1;
  if (desiredIndex > previousIndex) {
    const boundary: number = input.lod[previousIndex]!.maxDistance!;
    if (effectiveDistance <= boundary * (1 + hysteresis))
      return { lod: input.lod[previousIndex]!, effectiveDistance };
  } else {
    const boundary: number = input.lod[desiredIndex]!.maxDistance!;
    if (effectiveDistance >= boundary * (1 - hysteresis))
      return { lod: input.lod[previousIndex]!, effectiveDistance };
  }
  return { lod: input.lod[desiredIndex]!, effectiveDistance };
};
