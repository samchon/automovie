/**
 * Add a product to one interleaved twofold accumulator: high at 2*index and
 * low at 2*index+1. The caller owns complete storage and initializes both parts.
 * Ogita, Rump and Oishi (2005), algorithms 3.1, 3.3 and 5.3, derive the
 * TwoSum/TwoProduct correction used here:
 * https://www.tuhh.de/ti3/paper/rump/OgRuOi05.pdf
 *
 * Binary64 splitting retains product rounding error and TwoSum retains addition
 * rounding error. Exact power-of-two transfers prevent splitter overflow; a
 * large product is scaled before the error calculation. Without underflow the
 * product decomposition is exact; underflow retains the paper's absolute-error
 * limitation. Nonfinite arithmetic propagates to the numerical owner's refusal.
 * This improves evaluation of the same coefficients, never their objective,
 * constraint, stabilization or convergence tolerances.
 *
 * @evidence contracts/development/implementation.md#principled-implementation IEEE binary64 TwoProduct and TwoSum retain first-order product/addition errors in a second component, following the cited Dot2 derivation; power-of-two scaling protects splitting near the finite exponent limit.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One mutation adds one product to caller-owned scalar or vector accumulators, so sparse residuals, factors and homogeneous scalars share the same arithmetic.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coefficient, row, objective term or tolerance is changed, no fixture selects arithmetic, and nonfinite values are not replaced by zero.
 * @evidence contracts/development/common.md#meaningful-documentation States interleaved layout, initialization premise, source algorithm, exponent scaling, underflow limitation and refusal propagation.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and no allocation per product; callers retain two doubles per accumulated value and preserve their sparse traversal costs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Adds to the existing pair without allocating a product record or recomputing the preceding sum.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no storage; the caller owns and releases the supplied array.
 */
export function addAutoMovieQuadraticProduct(
  target: Float64Array,
  index: number,
  a: number,
  b: number,
): void {
  const product: number = a * b;
  let left: number = a;
  let right: number = b;
  let base: number = product;
  let scale: number = 1;

  // Keep the high-part product below overflow even when the final product is finite.
  if (Math.abs(product) > 2 ** 1020) {
    left *= 2 ** -4;
    base *= 2 ** -4;
    scale = 2 ** 4;
  }

  // Reciprocal transfers preserve the product while bounding both splitter inputs.
  if (Math.abs(left) > 2 ** 996) {
    left *= 2 ** -28;
    right *= 2 ** 28;
  } else if (Math.abs(right) > 2 ** 996) {
    right *= 2 ** -28;
    left *= 2 ** 28;
  }
  const splitLeft: number = (2 ** 27 + 1) * left;
  const splitRight: number = (2 ** 27 + 1) * right;
  const leftHigh: number = splitLeft - (splitLeft - left);
  const rightHigh: number = splitRight - (splitRight - right);
  const leftLow: number = left - leftHigh;
  const rightLow: number = right - rightHigh;
  const productError: number =
    (leftLow * rightLow -
      (base -
        leftHigh * rightHigh -
        leftLow * rightHigh -
        leftHigh * rightLow)) *
    scale;
  const high: number = target[2 * index]!;
  const sum: number = high + product;
  const virtual: number = sum - high;
  const sumError: number = high - (sum - virtual) + (product - virtual);
  target[2 * index] = sum;
  target[2 * index + 1] += sumError + productError;
}
