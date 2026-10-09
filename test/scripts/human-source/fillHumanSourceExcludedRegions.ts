import { fillHumanSourceRegion } from "./fillHumanSourceRegion.ts";
import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";

/**
 * Apply the existing sampled nipple product-exclusion to a source vector field.
 *
 * The product's figure is an unsexed outer skin without either detail. The
 * original acquired sampler defines the nipple footprint from its excluded
 * targets and carries the published body's existing operator. Applied to a
 * neutral it replaces the sculpted detail with the
 * surface its surroundings continue into; applied to an endpoint displacement
 * it keeps that endpoint from putting the detail back. No genital fill,
 * restoration, anatomy domain or registration metadata belongs to this input.
 */
export function fillHumanSourceExcludedRegions(
  sample: IHumanSourceSample,
  values: Float64Array,
  nativeToSource?: Int32Array,
): void {
  fillHumanSourceRegion(
    sample.flattenInterior,
    sample.flattenBoundary,
    sample.flattenOperator,
    values,
    nativeToSource,
  );
}
