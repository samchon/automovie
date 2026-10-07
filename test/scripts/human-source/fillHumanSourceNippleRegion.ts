import { fillHumanSourceRegion } from "./fillHumanSourceRegion.ts";
import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";

/**
 * Overwrite the nipple region of a per-sample vector field with the sampled
 * fill operator (the nipple-areola refill both the published body and this
 * generation apply). `fillHumanSourceRegion` owns the arithmetic; this names
 * the region whose operator the published body's extractor defined.
 */
export function fillHumanSourceNippleRegion(
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
