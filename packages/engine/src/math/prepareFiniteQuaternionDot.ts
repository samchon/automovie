import type { IAutoMovieQuaternion } from "@automovie/interface";

/** Quaternion coordinates in the original dot-product summation order. */
const COMPONENTS: readonly (keyof IAutoMovieQuaternion)[] = ["x", "y", "z", "w"];

/**
 * Prepare left-to-right quaternion dots against one unchanged coefficient.
 * Every target must already have finite components; this operation admits no
 * input and adds no normalization. The projector supplies targets only after
 * its inverse's finite-quaternion admission.
 *
 * A coefficient with exactly one nonzero finite component needs one product
 * when that product is nonzero: all omitted terms are signed zeros, whose
 * addition leaves a nonzero binary64 number unchanged. A zero product keeps
 * the full expression to preserve its sign after the original additions.
 * Dense, zero and nonfinite coefficients also keep the full expression.
 *
 * Keep the borrowed coefficient unchanged until releasing the reader. Results
 * are numbers; no target, completed dot or target-dependent state is retained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States finite-target admission, unchanged coefficient lifetime, absence of normalization, the single-component proof, signed-zero fallback and scalar ownership.
 * @evidence contracts/development/implementation.md#principled-implementation With finite target coordinates and all but one coefficient equal to positive or negative zero, every omitted product is a signed zero. Adding such terms to a nonzero product leaves its binary64 value unchanged, including a subnormal or infinity. A zero product retains all original additions and signs; every other coefficient retains the original four-term formula.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One preparation classifies the fixed coefficient and one reader owns the original expression and its certified sparse case. The actual projector uses it after finite admission rather than adding its own dot variant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No small-value cutoff, normalized-axis assumption, target cache or caller/fixture case chooses the shortcut. Only exact zero membership and a nonzero completed product permit omission; signed-zero results retain their original arithmetic.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation scans four fixed components once. A single-component nonzero reading performs one product and one zero test; zero-product or general coefficients perform the original four products and three additions. Every path uses constant storage and work; runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One unchanged coefficient shares its exact component classification and finite scalar across the projector's repeated admitted targets. The direct dot is still evaluated for each new target and no result or reference crosses calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one closure borrowing its fixed coefficient and retaining at most one component name and one scalar. It returns a number, allocates no per-target record and releases all preparation when the owning operation drops the reader.
 */
export function prepareFiniteQuaternionDot(
  coefficient: IAutoMovieQuaternion,
): (target: IAutoMovieQuaternion) => number {
  let component: keyof IAutoMovieQuaternion | undefined;
  for (const key of COMPONENTS)
    if (coefficient[key] !== 0) {
      if (component !== undefined) {
        component = undefined;
        break;
      }
      component = key;
    }
  const factor: number = component === undefined ? 0 : coefficient[component];
  const sparse: keyof IAutoMovieQuaternion | undefined =
    Number.isFinite(factor) ? component : undefined;
  return (target: IAutoMovieQuaternion): number => {
    if (sparse !== undefined) {
      const product: number = target[sparse] * factor;
      if (product !== 0) return product;
    }
    return target.x * coefficient.x + target.y * coefficient.y +
      target.z * coefficient.z + target.w * coefficient.w;
  };
}
