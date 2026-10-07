import { fillHumanSourceRegion } from "./fillHumanSourceRegion.ts";
import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";

/**
 * Fill both product-excluded skin regions of a per-sample vector field: the
 * nipple-areola region and the genital crease region.
 *
 * The product's figure is an unsexed outer skin without either detail. The
 * sampler defines each region as the footprint of the upstream's own excluded
 * targets and publishes one fill operator per region; the two regions lie on
 * the chest and at the crotch and share no vertex, so their order does not
 * matter. Applied to a neutral it replaces the sculpted detail with the
 * surface its surroundings continue into; applied to an endpoint displacement
 * it keeps that endpoint from putting the detail back.
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
  fillHumanSourceRegion(
    sample.genitalInterior,
    sample.genitalBoundary,
    sample.genitalOperator,
    values,
    nativeToSource,
  );
}
