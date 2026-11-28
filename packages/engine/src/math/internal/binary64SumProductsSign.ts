import { decomposeFiniteBinary64 } from "./decomposeFiniteBinary64";

/*
 * Find the exact sign of a sum of products of finite binary64 inputs.
 * Parameter terms: Additive terms, each a list of factors; an empty product is one.
 * Returns: Negative, zero or positive sign, or undefined for a nonfinite
 * factor.
 */
export function binary64SumProductsSign(
  terms: readonly (readonly number[])[],
): -1 | 0 | 1 | undefined {
  const products: { integer: bigint; exponent: number }[] = [];
  let minimum: number = Infinity;
  for (const factors of terms) {
    let integer: bigint = 1n;
    let exponent: number = 0;
    for (const value of factors) {
      if (!Number.isFinite(value)) return undefined;
      const factor = decomposeFiniteBinary64(value);
      integer *= factor.significand;
      exponent += factor.exponent;
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
