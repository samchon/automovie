import { HumanBinary64Arithmetic } from "../../common/measure/HumanBinary64Arithmetic";

/** Smallest normal binary64 magnitude: 2^52 * 2^-1074 (ECMA-262 Number type). */
const MINIMUM_NORMAL: number = 2 ** -1022;

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
 *
 * @evidence contracts/common.md#principled-implementation Broyden's good rank-one update uses the entire old matrix; exceptional rows use exact integer multiples of 2^-1074 and the shared nearest-even rational conversion, with finite aligned inputs and a nonzero accepted step required.
 * @evidence contracts/common.md#clear-and-simple-design The caller owns accepted steps; this owner computes only a fresh column-major matrix, and HumanBinary64Arithmetic owns decomposition and final binary64 rounding instead of duplicating those primitives.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Normal/subnormal boundaries follow Number representation rather than an accuracy epsilon; zero components preserve their original entries and no anatomical or consumer exceptions alter the equation.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the secant equation, column layout, dimensionless units, input premises, zero-step refusal, exceptional arithmetic and limits of the precision claim.
 * @evidence contracts/performance.md#efficient-algorithms For R residual rows and C columns, ordinary work and output cost O(R*C); exceptional rows perform O(C) BigInt operations whose bit widths grow with binary64 exponents, without repeating geometry evaluation.
 * @evidence contracts/performance.md#reuse-equivalent-work Each row computes its old prediction once before any correction; exact decomposition is call-local and recomputed for exceptional rows because no cross-step matrix identity establishes equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Row arrays and temporary BigInts are invocation-owned and bounded by matrix dimensions and finite binary64 widths; the new columns transfer to the caller, with no persistent buffers, handles or tasks.
 */
export function updateHumanBodySimpleJacobian(
  columns: readonly (readonly number[])[],
  step: readonly number[],
  delta: readonly number[],
): number[][] {
  const length: number = step.reduce((sum: number, value: number): number => sum + value * value, 0);
  const rescale: boolean = length < MINIMUM_NORMAL || !Number.isFinite(length);
  if (rescale) {
    const largest: number = step.reduce(
      (maximum: number, value: number): number => Math.max(maximum, Math.abs(value)),
      0,
    );
    if (largest === 0)
      throw new Error("A Jacobian secant update needs a nonzero step.");
  }
  const rows: number[][] = delta.map((value: number, row: number): number[] => {
    const products: number[] = columns.map((column: readonly number[], index: number): number => column[row] * step[index]);
    const predicted: number = products.reduce((sum: number, product: number): number => sum + product, 0);
    const error: number = value - predicted;
    const corrections: number[] = step.map((component: number): number => (error * component) / length);
    const exceptional: boolean =
      rescale ||
      !Number.isFinite(error) ||
      (value !== 0 && error === -predicted) ||
      products.some(
        (product: number, index: number): boolean =>
          !Number.isFinite(product) ||
          (columns[index][row] !== 0 &&
            step[index] !== 0 &&
            Math.abs(product) < MINIMUM_NORMAL),
      ) ||
      corrections.some(
        (correction: number, index: number): boolean =>
          !Number.isFinite(correction) ||
          (error !== 0 &&
            step[index] !== 0 &&
            Math.abs(error * step[index]) < MINIMUM_NORMAL),
      );
    return exceptional
      ? exactSecantRow(columns, step, value, row)
      : columns.map((column: readonly number[], index: number): number => column[row] + corrections[index]);
  });
  return columns.map((_column: readonly number[], index: number): number[] => rows.map((row: number[]): number => row[index]));
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
  const direction: bigint[] = step.map(binaryInteger);
  const norm: bigint = direction.reduce((sum: bigint, value: bigint): bigint => sum + value * value, 0n);
  const previous: bigint[] = columns.map((column: readonly number[]): bigint => binaryInteger(column[row]));
  const error: bigint =
    (binaryInteger(delta) << 1074n) -
    previous.reduce((sum: bigint, value: bigint, index: number): bigint => sum + value * direction[index], 0n);
  return previous.map((value: bigint, index: number): number =>
    direction[index] === 0n
      ? columns[index][row]
      : HumanBinary64Arithmetic.numberAt(value * norm + error * direction[index], norm, -1074),
  );
}

/** Read a finite binary64 value as its exact signed integer multiple of 2^-1074. */
function binaryInteger(value: number): bigint {
  const [mantissa, exponent]: [bigint, number] = HumanBinary64Arithmetic.dyadic(value);
  return mantissa << BigInt(exponent + 1074);
}
