import {
  IAutoMovieCompiledFormationLod,
  type IAutoMovieFormationLodInput,
  type IAutoMovieFormationLodSelection,
} from "@automovie/interface";

/**
 * Select automatic formation LOD from distance and projected contribution.
 *
 * Twenty-four projected pixels are neutral. A prior tier retains a 10% boundary
 * deadband so camera jitter cannot thrash instance buffers. The caller supplies
 * an ordered admitted tier list, finite distance/pixel values and an optional
 * fractional hysteresis. Returned lod aliases that list.
 */
export function selectFormationLod(
  input: IAutoMovieFormationLodInput,
): IAutoMovieFormationLodSelection {
  if (input.lod.length === 0)
    throw new Error("A compiled formation requires at least one LOD tier.");
  const projectedPixels: number = Math.max(1, input.projectedPixels);
  const effectiveDistance: number = input.distance * (24 / projectedPixels);
  const matchedIndex: number = input.lod.findIndex(
    (lod: IAutoMovieCompiledFormationLod): boolean =>
      lod.maxDistance === null || effectiveDistance <= lod.maxDistance,
  );
  const desiredIndex: number =
    matchedIndex < 0 ? input.lod.length - 1 : matchedIndex;
  const previousIndex: number = input.lod.findIndex(
    (lod: IAutoMovieCompiledFormationLod): boolean =>
      lod.tier === input.previous,
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
}
