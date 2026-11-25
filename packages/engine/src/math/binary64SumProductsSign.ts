/**
 * Find the exact sign of a sum of products of finite binary64 inputs.
 *
 * @param terms Additive terms, each a list of factors; an empty product is one.
 * @returns Negative, zero or positive sign, or undefined for a nonfinite
 *   factor.
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
