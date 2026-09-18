import { IAutoMovieFormationLodInput } from "./IAutoMovieFormationLodInput";
import { IAutoMovieFormationLodSelection } from "./IAutoMovieFormationLodSelection";

/**
 * Select automatic formation LOD from distance and projected contribution.
 *
 * Twenty-four projected pixels are neutral. A prior tier retains a 10% boundary
 * deadband so camera jitter cannot thrash instance buffers.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-lod-transition-stability Selects formation tiers from distance and projected size while retaining the previous tier inside an explicit hysteresis band.
 * @evidence requirements/formations/resolution-culling-and-evidence.md#formation-resolution-transition Retains the prior compiled tier inside the declared deadband before crossing to the distance-and-projection-selected tier.
 * @evidence requirements/production-design/visual-delivery-and-fidelity-tiers.md#production-design-tier-transition Changes only to a declared compiled tier after the distance-and-projection threshold clears the previous tier's hysteresis band.
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-representation-selection Selects only among caller-declared formation tiers using distance, projected contribution, prior tier, and explicit hysteresis.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-lod-transition-invariants Implements a stable automatic representation transition with an inspectable effective-distance result.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-bounds-framing-culling-failures Returns the chosen tier and its effective-distance basis while suppressing threshold flicker.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-fidelity-tier-transition Implements the compiled-tier selection and hysteresis subset of a representation transition without treating the automatic choice as fidelity approval.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-lod-selection-policy Applies the declared ordered thresholds and projected-size correction while retaining the previous tier inside the hysteresis band.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-alternative-selection-output Returns the selected compiled tier together with the effective-distance and projected-size basis used by this automatic formation subset.
 */
export const selectFormationLod = (
  input: IAutoMovieFormationLodInput,
): IAutoMovieFormationLodSelection => {
  if (input.lod.length === 0)
    throw new Error("A compiled formation requires at least one LOD tier.");
  const projectedPixels = Math.max(1, input.projectedPixels);
  const effectiveDistance = input.distance * (24 / projectedPixels);
  const matchedIndex = input.lod.findIndex(
    (lod) => lod.maxDistance === null || effectiveDistance <= lod.maxDistance,
  );
  const desiredIndex = matchedIndex < 0 ? input.lod.length - 1 : matchedIndex;
  const previousIndex = input.lod.findIndex(
    (lod) => lod.tier === input.previous,
  );
  if (previousIndex < 0 || previousIndex === desiredIndex)
    return { lod: input.lod[desiredIndex]!, effectiveDistance };
  const hysteresis = input.hysteresis ?? 0.1;
  if (desiredIndex > previousIndex) {
    const boundary = input.lod[previousIndex]!.maxDistance!;
    if (effectiveDistance <= boundary * (1 + hysteresis))
      return { lod: input.lod[previousIndex]!, effectiveDistance };
  } else {
    const boundary = input.lod[desiredIndex]!.maxDistance!;
    if (effectiveDistance >= boundary * (1 - hysteresis))
      return { lod: input.lod[previousIndex]!, effectiveDistance };
  }
  return { lod: input.lod[desiredIndex]!, effectiveDistance };
};
