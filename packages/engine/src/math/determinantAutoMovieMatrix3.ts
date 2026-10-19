const PRODUCTS: readonly (readonly [number, number, number, number])[] = [
  [0, 4, 8, 1],
  [1, 5, 6, 1],
  [2, 3, 7, 1],
  [2, 4, 6, -1],
  [1, 3, 8, -1],
  [0, 5, 7, -1],
];

/**
 * Evaluate a finite row-major 3 by 3 determinant with an exact-sign fallback.
 * A conservative forward-error filter accepts a separated binary64 value.
 * Uncertain cancellation instead sums the six products of the input doubles as
 * exact signed binary integers and exponents. Its returned magnitude is rounded
 * to a representable double; zero is returned only for an exactly zero sum.
 * An unrepresentable nonzero magnitude refuses rather than becoming zero.
 * This proves the sign of the supplied doubles, not a physical measurement.
 *
 * @evidence contracts/common.md#principled-implementation The six determinant products have a 64-epsilon absolute-sum filter, with subnormal/overflow cases excluded from the filter. IEEE-754 mantissa/exponent decomposition and BigInt alignment then determine the exact cancellation sign before one bounded scalar conversion.
 * @evidence contracts/common.md#clear-and-simple-design One generic engine scalar primitive owns uncertain determinant classification for actual support-boundary incidence, without changing the caller's geometry or tolerances.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No determinant epsilon replacement, guessed zero, coordinate weld or fixture-specific sign is returned. Nonfinite input and unrepresentable nonzero magnitudes refuse.
 * @evidence contracts/common.md#meaningful-documentation States row-major ordering, adaptive versus exact-sign paths, rounded magnitude, binary64 input meaning and underflow/overflow refusal.
 * @evidence contracts/performance.md#efficient-algorithms A fixed-size filter is constant work. The fallback multiplies six fixed-count binary64 mantissas and aligns a bounded exponent range, so BigInt work/storage are bounded by the input format rather than geometry size.
 * @evidence contracts/performance.md#reuse-equivalent-work The six module-private Leibniz permutation/sign tuples are fixed mathematical constants reused across queries; each nonzero input is decomposed at most once within a fallback, and no input-dependent result survives or requires invalidation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one number escapes; the optional eight-byte view, six integer terms and aligned sum expire synchronously. The fixed six-entry mathematical index table is module-owned, without handles or global input-dependent state.
 */
export function determinantAutoMovieMatrix3(matrix: readonly number[]): number {
  let finite: boolean = matrix.length === 9;
  for (let index: number = 0; index < 9 && finite; index++)
    finite = Number.isFinite(matrix[index]);
  if (!finite)
    throw new Error("A complete finite row-major 3 by 3 matrix is required");
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
      (!Number.isFinite(pair) ||
        Math.abs(pair) < minimumNormal ||
        !Number.isFinite(product) ||
        Math.abs(product) < minimumNormal)
    )
      filterSafe = false;
  }
  if (
    filterSafe &&
    Number.isFinite(permanent) &&
    permanent >= minimumNormal &&
    Math.abs(value) > 64 * Number.EPSILON * permanent
  )
    return value;
  const view: DataView = new DataView(new ArrayBuffer(8));
  const parts: (value: number) => { integer: bigint; exponent: number } = (
    value: number,
  ): { integer: bigint; exponent: number } => {
    view.setFloat64(0, value, false);
    const bits: bigint = view.getBigUint64(0, false);
    const exponent: number = Number((bits >> 52n) & 2047n);
    const fraction: bigint = bits & ((1n << 52n) - 1n);
    return {
      integer:
        (bits >> 63n ? -1n : 1n) *
        (exponent ? fraction + (1n << 52n) : fraction),
      exponent: exponent ? exponent - 1075 : -1074,
    };
  };
  const decomposed: ({ integer: bigint; exponent: number } | undefined)[] =
    new Array(9);
  const exact: { integer: bigint; exponent: number }[] = [];
  for (const indices of PRODUCTS) {
    // A zero factor makes this exact product zero, even if another product
    // overflows or underflows. Each nonzero input is decomposed at most once.
    if (
      matrix[indices[0]] === 0 ||
      matrix[indices[1]] === 0 ||
      matrix[indices[2]] === 0
    )
      continue;
    const a: { integer: bigint; exponent: number } = (decomposed[indices[0]] ??=
      parts(matrix[indices[0]]));
    const b: { integer: bigint; exponent: number } = (decomposed[indices[1]] ??=
      parts(matrix[indices[1]]));
    const c: { integer: bigint; exponent: number } = (decomposed[indices[2]] ??=
      parts(matrix[indices[2]]));
    exact.push({
      integer: BigInt(indices[3]) * a.integer * b.integer * c.integer,
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
  if (!Number.isFinite(converted) || converted === 0)
    throw new Error(
      "The nonzero determinant magnitude is outside binary64 range",
    );
  return converted;
}
