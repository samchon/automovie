/** Smallest normal binary64 magnitude: 2^52 * 2^-1074 (ECMA-262 Number type). */
const MINIMUM_NORMAL = 2 ** -1022;

/**
 * Advance the simple body's column-major Jacobian by Broyden's good update.
 *
 * The coupled solver owns the dimensionless residuals and scalar steps. For
 * the accepted step s and residual change y, B_new = B + (y - B s) s^T /
 * (s^T s). Compute B s from the entire old matrix before changing any column:
 * otherwise later columns use an already changed error and the secant
 * equation B_new s = y no longer holds. This is a fresh matrix; the caller's
 * columns, step and residual change remain unchanged.
 *
 * Inputs have the same system dimension and finite entries, supplied by the
 * coupled solver. An actual zero step throws because it has no secant
 * direction. Ordinary normal intermediates keep their original arithmetic
 * order. An exceptional squared norm, dot product, residual subtraction or
 * correction, or subtraction that entirely loses a nonzero residual change,
 * recomputes the affected row from the original finite inputs as
 * exact binary integers, then rounds the rational result once to binary64.
 * Every finite binary64 value is an integer multiple of 2^-1074; this common
 * unit lets the secant numerator cancel before any overflow or underflow.
 * Columns with a zero step component keep their original row entry.
 * ECMA-262 6.1.6.1 defines the binary64 normal/subnormal boundary, not an
 * accuracy epsilon. This does not promise an
 * accurate matrix for every ill-conditioned input or unrepresentable update.
 * Units are dimensionless residual per scalar step.
 * This numerical update establishes no physiological admission or anatomy.
 */
export function updateHumanBodySimpleJacobian(
  columns: readonly (readonly number[])[],
  step: readonly number[],
  delta: readonly number[],
): number[][] {
  const length = step.reduce((sum, value) => sum + value * value, 0);
  const rescale = length < MINIMUM_NORMAL || !Number.isFinite(length);
  if (rescale) {
    const largest = step.reduce(
      (maximum, value) => Math.max(maximum, Math.abs(value)),
      0,
    );
    if (largest === 0)
      throw new Error("A Jacobian secant update needs a nonzero step.");
  }
  const rows = delta.map((value, row) => {
    const products = columns.map((column, index) => column[row] * step[index]);
    const predicted = products.reduce((sum, product) => sum + product, 0);
    const error = value - predicted;
    const corrections = step.map((component) => (error * component) / length);
    const exceptional =
      rescale ||
      !Number.isFinite(error) ||
      (value !== 0 && error === -predicted) ||
      products.some(
        (product, index) =>
          !Number.isFinite(product) ||
          (columns[index][row] !== 0 &&
            step[index] !== 0 &&
            Math.abs(product) < MINIMUM_NORMAL),
      ) ||
      corrections.some(
        (correction, index) =>
          !Number.isFinite(correction) ||
          (error !== 0 &&
            step[index] !== 0 &&
            Math.abs(error * step[index]) < MINIMUM_NORMAL),
      );
    return exceptional
      ? exactSecantRow(columns, step, value, row)
      : columns.map((column, index) => column[row] + corrections[index]);
  });
  return columns.map((_column, index) => rows.map((row) => row[index]));
}

/**
 * Evaluate the same rank-one row over exact multiples of u=2^-1074.
 * B_new/u = (B*D + (Y*2^1074 - sum(B*S))*S)/D, D=sum(S*S).
 * All capital letters in this formula are signed integers, so even large
 * opposing products cancel before the result is rounded. The caller has
 * established D>0 and finite binary64 inputs. No input array is changed.
 */
function exactSecantRow(
  columns: readonly (readonly number[])[],
  step: readonly number[],
  delta: number,
  row: number,
): number[] {
  const direction = step.map(binaryInteger);
  const norm = direction.reduce((sum, value) => sum + value * value, 0n);
  const previous = columns.map((column) => binaryInteger(column[row]));
  const error =
    (binaryInteger(delta) << 1074n) -
    previous.reduce((sum, value, index) => sum + value * direction[index], 0n);
  return previous.map((value, index) =>
    direction[index] === 0n
      ? columns[index][row]
      : roundedBinaryRatio(value * norm + error * direction[index], norm),
  );
}

/** Read a finite binary64 value as its exact signed integer multiple of 2^-1074. */
function binaryInteger(value: number): bigint {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  const bits = view.getBigUint64(0);
  const exponent = Number((bits >> 52n) & 2047n);
  const fraction = bits & ((1n << 52n) - 1n);
  const magnitude =
    exponent === 0
      ? fraction
      : ((1n << 52n) | fraction) << BigInt(exponent - 1);
  return value < 0 ? -magnitude : magnitude;
}

/**
 * Round (numerator/denominator)*2^-1074 to nearest binary64, ties to even.
 * A normal result keeps 53 significant bits; a subnormal rounds to a whole
 * multiple of 2^-1074. Integer remainder comparison owns the tie decision.
 * Multiplication by a power of two then encodes that already-rounded result,
 * including signed underflow zero and genuine overflow to infinity.
 */
function roundedBinaryRatio(numerator: bigint, denominator: bigint): number {
  const negative = numerator < 0n;
  const magnitude = negative ? -numerator : numerator;
  const quotient = magnitude / denominator;
  const shift = Math.max(0, quotient.toString(2).length - 53);
  const divisor = denominator << BigInt(shift);
  const significand = magnitude / divisor;
  const remainder = magnitude % divisor;
  const rounded =
    significand +
    (2n * remainder > divisor ||
    (2n * remainder === divisor && significand % 2n !== 0n)
      ? 1n
      : 0n);
  const result =
    shift < 52
      ? Number(rounded) * Number.MIN_VALUE * 2 ** shift
      : Number(rounded) * 2 ** (shift - 1074);
  return negative ? -result : result;
}
