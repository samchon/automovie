import { convertAutoMovieRecoveryCurves } from "../curves/convertAutoMovieRecoveryCurves";
import type { AutoMovieRecoveryCurveData } from "../typings/AutoMovieRecoveryCurveData";

/**
 * Restore saved Hermite curves for the Bernstein reconstruction operators.
 * Bernstein-only artifacts retain the reconstruction owner's local admission and
 * partial-result policy. A Hermite artifact instead passes complete basis admission.
 * The scan reads only own data descriptors and never executes accessors.
 *
 * @evidence contracts/common.md#principled-implementation Basis discovery precedes conversion so existing Bernstein domain admission remains local while Hermite coefficients use their original phase intervals.
 * @evidence contracts/common.md#clear-and-simple-design One internal boundary serves all saved reconstruction hosts without adding a public validation bypass.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source data, tolerance change, malformed coefficient repair or consumer-specific fallback is introduced.
 * @evidence contracts/common.md#meaningful-documentation States basis selection, partial-result ownership and accessor-free inspection.
 * @evidence contracts/performance.md#efficient-algorithms An iterative O(N) identity scan visits each object once, followed by one conversion only when Hermite occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Identity tracking avoids repeated metadata traversal within the scan; no cross-call result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local scan storage expires on return; borrowed Bernstein inputs remain unmodified and converted data transfer to the caller.
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
