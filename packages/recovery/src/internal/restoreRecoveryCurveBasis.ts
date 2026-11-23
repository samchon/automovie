import type { AutoMovieRecoveryCurveData } from "@automovie/interface";

import { convertAutoMovieRecoveryCurves } from "../curves/convertAutoMovieRecoveryCurves";

/**
 * Restore saved Hermite curves for the Bernstein reconstruction operators.
 * Bernstein-only artifacts retain the reconstruction owner's local admission
 * and partial-result policy. A Hermite artifact instead passes complete basis
 * admission. The scan reads only own data descriptors and never executes
 * accessors.
 */
export function restoreRecoveryCurveBasis<T>(
  input: T,
): AutoMovieRecoveryCurveData<T, "bezier"> {
  const pending: unknown[] = [input];
  const seen: WeakSet<object> = new WeakSet();
  while (pending.length !== 0) {
    const value: unknown = pending.pop();
    if (value === null || typeof value !== "object" || seen.has(value))
      continue;
    seen.add(value);
    for (const key of Object.getOwnPropertyNames(value)) {
      const descriptor: PropertyDescriptor | undefined =
        Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, "value")) continue;
      if (key === "type" && descriptor.value === "cubicHermite")
        return convertAutoMovieRecoveryCurves(input, "bezier");
      if (descriptor.value !== null && typeof descriptor.value === "object")
        pending.push(descriptor.value);
    }
  }
  return input as AutoMovieRecoveryCurveData<T, "bezier">;
}
