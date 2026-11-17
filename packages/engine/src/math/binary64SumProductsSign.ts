/**
 * Find the exact sign of a sum of products of finite binary64 inputs.
 *
 * @param terms Additive terms, each a list of factors; an empty product is one.
 * @returns Negative, zero or positive sign, or undefined for a nonfinite factor.
 * @evidence contracts/development/common.md#meaningful-documentation States the exact dyadic input interpretation, product/sum shape and nonfinite refusal marker.
 * @evidence contracts/development/implementation.md#principled-implementation Every finite binary64 is an integer significand times a power of two. BigInt products are aligned at their smallest exponent and summed without rounding, so overflow, underflow and cancellation cannot reverse a certificate's sign.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Decode factors, retain one exact product per term, align products and read the total's sign.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No floating tolerance, clamped product, physical bound or guessed sign is used. Nonfinite factors return no certificate.
 * @evidence contracts/development/implementation.md#efficient-algorithms For F factors and T products, decoding is O(F); BigInt multiplication and shifts depend on significand lengths and the exponent span. Storage is O(T) exact products, with no trajectory retained.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One synchronous arithmetic query has no repeated external computation to share.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The eight-byte decoder and BigInt products belong to one call and no input, cache, handle or task escapes.
 */
export function binary64SumProductsSign(
  terms: readonly (readonly number[])[],
): -1 | 0 | 1 | undefined {
  const view: DataView = new DataView(new ArrayBuffer(8));
  const products: { integer: bigint; exponent: number }[] = [];
  let minimum: number = Infinity;
  for (const factors of terms) {
    let integer: bigint = 1n;
    let exponent: number = 0;
    for (const value of factors) {
      if (!Number.isFinite(value)) return undefined;
      view.setFloat64(0, value, false);
      const bits: bigint = view.getBigUint64(0, false);
      const field: number = Number((bits >> 52n) & 2047n);
      const significand: bigint =
        (bits & ((1n << 52n) - 1n)) | (field === 0 ? 0n : 1n << 52n);
      integer *= bits >> 63n ? -significand : significand;
      exponent += field === 0 ? -1074 : field - 1075;
    }
    if (integer !== 0n) {
      products.push({ integer, exponent });
      minimum = Math.min(minimum, exponent);
    }
  }
  let total: bigint = 0n;
  for (const product of products)
    total += product.integer << BigInt(product.exponent - minimum);
  return total < 0n ? -1 : total > 0n ? 1 : 0;
}
