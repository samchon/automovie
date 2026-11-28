import { decomposeFiniteBinary64 } from "./decomposeFiniteBinary64";

/* Place a fixed population on its finest nonzero dyadic grid. */
export function finiteBinary64Grid(values: readonly number[]): bigint[] {
  const numbers = values.map(decomposeFiniteBinary64);
  let commonExponent: number = Infinity;
  for (const { significand, exponent } of numbers)
    if (significand !== 0n) commonExponent = Math.min(commonExponent, exponent);
  return numbers.map(({ significand, exponent }): bigint =>
    significand === 0n ? 0n : significand << BigInt(exponent - commonExponent),
  );
}
