import { decomposeFiniteBinary64 } from "./decomposeFiniteBinary64";
import { overflowsBinary64 } from "./overflowsBinary64";

/*
 * Evaluate a finite row-major 3 by 3 determinant with an exact-sign fallback. A
 * conservative forward-error filter accepts a separated binary64 value.
 * Uncertain cancellation instead sums the six products of the input doubles as
 * exact signed binary integers and exponents. Its returned magnitude is rounded
 * to a representable double; zero is returned only for an exactly zero sum. An
 * unrepresentable nonzero magnitude refuses rather than becoming zero. This
 * proves the sign of the supplied doubles, not a physical measurement.
 */
export function determinantMatrix3(matrix: readonly number[]): number {
  if (matrix.length !== 9)
    throw new Error("A complete row-major 3 by 3 matrix is required");
  for (const component of matrix)
    if (!Number.isFinite(component))
      throw new RangeError("Matrix determinant entries must be finite");
  let value: number = 0,
    permanent: number = 0;
  const minimumNormal: number = 2 ** -1022;
  let filterSafe: boolean = true;
  for (const indices of PRODUCTS) {
    const a: number = matrix[indices[0]],
      b: number = matrix[indices[1]],
      c: number = matrix[indices[2]];
    const pair: number = a * b,
      product: number = pair * c;
    value += indices[3] * product;
    permanent += Math.abs(product);
    // A lost intermediate product can become significant after multiplication
    // by c. A normal total permanent alone cannot bound that missing term.
    if (
      a !== 0 &&
      b !== 0 &&
      c !== 0 &&
      (Math.abs(pair) < minimumNormal || Math.abs(product) < minimumNormal)
    )
      filterSafe = false;
  }
  if (
    filterSafe &&
    permanent >= minimumNormal &&
    Math.abs(value) > 64 * Number.EPSILON * permanent
  )
    return value;
  const exact: { integer: bigint; exponent: number }[] = [];
  for (const indices of PRODUCTS) {
    // A zero factor makes this exact product zero, even if another product
    // overflows or underflows.
    if (
      matrix[indices[0]] === 0 ||
      matrix[indices[1]] === 0 ||
      matrix[indices[2]] === 0
    )
      continue;
    const a = decomposeFiniteBinary64(matrix[indices[0]]);
    const b = decomposeFiniteBinary64(matrix[indices[1]]);
    const c = decomposeFiniteBinary64(matrix[indices[2]]);
    exact.push({
      integer:
        BigInt(indices[3]) * a.significand * b.significand * c.significand,
      exponent: a.exponent + b.exponent + c.exponent,
    });
  }
  if (!exact.length) return 0;
  const exponent: number = Math.min(
    ...exact.map((term: (typeof exact)[number]): number => term.exponent),
  );
  const sum: bigint = exact.reduce(
    (total: bigint, term: (typeof exact)[number]): bigint =>
      total + (term.integer << BigInt(term.exponent - exponent)),
    0n,
  );
  if (sum === 0n) return 0;
  const sign: number = sum < 0n ? -1 : 1;
  const magnitude: bigint = sum < 0n ? -sum : sum;
  const shift: number = Math.max(0, magnitude.toString(2).length - 53);
  const leading: number = Number(magnitude >> BigInt(shift));
  const power: number = exponent + shift;
  const converted: number =
    sign *
    (power < -1022
      ? leading * 2 ** -1022 * 2 ** (power + 1022)
      : leading * 2 ** power);
  if (converted === 0 || overflowsBinary64(converted))
    throw new Error(
      "The nonzero determinant magnitude is outside binary64 range",
    );
  return converted;
}

const PRODUCTS: readonly (readonly [number, number, number, number])[] = [
  [0, 4, 8, 1],
  [1, 5, 6, 1],
  [2, 3, 7, 1],
  [2, 4, 6, -1],
  [1, 3, 8, -1],
  [0, 5, 7, -1],
];
