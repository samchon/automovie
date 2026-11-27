import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * Prepare left-to-right quaternion dots against one unchanged coefficient.
 * Every target must already have finite components; this operation admits no
 * input and adds no normalization. The projector supplies targets only after
 * its inverse's finite-quaternion admission.
 *
 * A coefficient with exactly one nonzero finite component needs one product
 * when that product is nonzero: all omitted terms are signed zeros, whose
 * addition leaves a nonzero binary64 number unchanged. A zero product keeps the
 * full expression to preserve its sign after the original additions. Dense,
 * zero and nonfinite coefficients also keep the full expression.
 *
 * Keep the borrowed coefficient unchanged until releasing the reader. Results
 * are numbers; no target, completed dot or target-dependent state is retained.
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
  const sparse: keyof IAutoMovieQuaternion | undefined = component;
  const factor: number = sparse === undefined ? 0 : coefficient[sparse];
  return (target: IAutoMovieQuaternion): number => {
    if (sparse !== undefined) {
      const product: number = target[sparse] * factor;
      if (product !== 0) return product;
    }
    return (
      target.x * coefficient.x +
      target.y * coefficient.y +
      target.z * coefficient.z +
      target.w * coefficient.w
    );
  };
}

/** Quaternion coordinates in the original dot-product summation order. */
const COMPONENTS: readonly (keyof IAutoMovieQuaternion)[] = [
  "x",
  "y",
  "z",
  "w",
];
