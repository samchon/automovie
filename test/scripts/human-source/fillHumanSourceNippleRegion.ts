import type { IHumanSourceSample } from "./structures/IHumanSourceSample.ts";

/**
 * Overwrite the nipple region of a per-sample vector field with the sampled
 * fill operator (the nipple-areola refill both the published body and this
 * generation apply): each interior sample becomes the operator's combination
 * of the boundary samples, component by component. The operator is linear and
 * acts per component, so it applies alike to absolute positions in the
 * Blender frame and to displacements in the shared frame. The product is
 * summed in index order.
 */
export function fillHumanSourceNippleRegion(sample: IHumanSourceSample, values: Float64Array): void {
  const interior = sample.flattenInterior;
  const boundary = sample.flattenBoundary;
  const operator = sample.flattenOperator;
  const k = boundary.length;
  for (let i = 0; i < interior.length; i++)
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let j = 0; j < k; j++) sum += operator[i * k + j] * values[3 * boundary[j] + c];
      values[3 * interior[i] + c] = sum;
    }
}
