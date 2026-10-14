import { HumanBinary64Arithmetic } from "./HumanBinary64Arithmetic";
import { HumanExactFraction } from "./HumanExactFraction";
import type { IHumanExactFraction } from "./IHumanExactFraction";
import type { IHumanPolynomialRoot } from "./IHumanPolynomialRoot";

/** One dyadic interval used by the exact Sturm subdivision.
 *
 *
 * @author Samchon
 */
interface RootInterval {
  /** Lower numerator over 2^power. */
  low: bigint;
  /** Upper numerator over the same denominator. */
  high: bigint;
  /** Nonnegative binary exponent of the common denominator. */
  power: number;
  /** Exact count of interior roots, excluding endpoints recorded separately. */
  roots: number;
}

/**
 * Isolate every real root in [0,1] of an exact rational polynomial.
 * Coefficients are ascending powers. Positive-content integer pseudo-
 * remainders preserve Sturm signs without floating coefficient cancellation.
 * One-sided derivative signs retain repeated roots and exact dyadic roots.
 * Subdivision stops only when the complete interval rounds to one binary64
 * parameter; several roots rounding to that parameter need one output point.
 * There is no iteration cap, coefficient epsilon or anatomical limit.
 *
 *
 * @evidence contracts/common.md#principled-implementation Positive-content integer pseudo-remainders form an exact Sturm sequence; one-sided derivative signs count repeated/end roots, and dyadic subdivision stops when the whole interval rounds to one binary64 parameter. Positive fraction denominators are premises and the zero polynomial refuses.
 * @evidence contracts/common.md#clear-and-simple-design Canonical fraction/binary64 owners supply exact endpoints and represented parameters, while private polynomial routines own content reduction, derivatives, remainders and sign evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no coefficient epsilon, anatomical range heuristic or iteration cap selecting expected roots; several roots sharing one represented parameter deliberately share an output interval.
 * @evidence contracts/common.md#meaningful-documentation The comment gives coefficient ordering, exact sign method, repeated/dyadic roots and representational stopping rather than promising one isolated real root per output.
 * @evidence contracts/performance.md#efficient-algorithms For degree D, integer bit width B and Q visited dyadic intervals, sequence/remainder arithmetic and Q sign evaluations dominate; output sorting adds O(R log R), and subdivision/coefficient growth has no explicit global cap.
 * @evidence contracts/performance.md#reuse-equivalent-work One Sturm sequence is reused for all interval sign counts and the stack holds current subdivisions; canonical fraction/rounding routines avoid a second coefficient normalization implementation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Sequence arrays, BigInts and pending intervals are invocation-owned, growing with degree, coefficient magnitude and subdivision; root records transfer on completion and no background task or persistent registry remains.
 */
export function isolateHumanPolynomialRoots(
  coefficients: readonly IHumanExactFraction[],
): IHumanPolynomialRoot[] {
  let denominator: bigint = 1n;
  for (const coefficient of coefficients)
    denominator *= coefficient.denominator;
  const polynomial: bigint[] = primitive(
    coefficients.map(
      (coefficient: IHumanExactFraction): bigint =>
        coefficient.numerator * (denominator / coefficient.denominator),
    ),
  );
  if (polynomial.length === 0)
    throw new Error("An identically zero polynomial has no isolated root set.");
  if (polynomial.length === 1) return [];
  const sequence: bigint[][] = [polynomial, derivative(polynomial)];
  while (sequence.at(-1)!.length > 0) {
    const remainder: bigint[] = primitive(
      pseudoRemainder(sequence.at(-2)!, sequence.at(-1)!).map(
        (value: bigint): bigint => -value,
      ),
    );
    if (remainder.length === 0) break;
    sequence.push(remainder);
  }
  const variation: (numerator: bigint, power: number, side: 1 | -1) => number = (
    numerator: bigint,
    power: number,
    side: 1 | -1,
  ): number => {
    let previous: number = 0;
    let changes: number = 0;
    for (const member of sequence) {
      let current: bigint[] = member;
      let order: number = 0;
      let value: bigint = evaluate(current, numerator, power);
      while (value === 0n && current.length > 1) {
        current = derivative(current);
        order++;
        value = evaluate(current, numerator, power);
      }
      const sign: number =
        value === 0n
          ? 0
          : (value < 0n ? -1 : 1) * (side < 0 && order % 2 !== 0 ? -1 : 1);
      if (sign !== 0) {
        if (previous !== 0 && sign !== previous) changes++;
        previous = sign;
      }
    }
    return changes;
  };
  const output: IHumanPolynomialRoot[] = [];
  const exact: (numerator: bigint, denominator: bigint) => IHumanPolynomialRoot = (
    numerator: bigint,
    denominator: bigint,
  ): IHumanPolynomialRoot => ({
    lower: HumanExactFraction.create(numerator, denominator),
    upper: HumanExactFraction.create(numerator, denominator),
    parameter: HumanBinary64Arithmetic.numberAt(numerator, denominator),
  });
  if (evaluate(polynomial, 0n, 0) === 0n) output.push(exact(0n, 1n));
  if (evaluate(polynomial, 1n, 0) === 0n) output.push(exact(1n, 1n));
  const pending: RootInterval[] = [
    {
      low: 0n,
      high: 1n,
      power: 0,
      roots: variation(0n, 0, 1) - variation(1n, 0, -1),
    },
  ];
  while (pending.length !== 0) {
    const interval: RootInterval = pending.pop()!;
    if (interval.roots === 0) continue;
    const scale: bigint = 1n << BigInt(interval.power);
    const low: number = HumanBinary64Arithmetic.numberAt(interval.low, scale);
    const high: number = HumanBinary64Arithmetic.numberAt(interval.high, scale);
    if (low === high) {
      output.push({
        lower: HumanExactFraction.create(interval.low, scale),
        upper: HumanExactFraction.create(interval.high, scale),
        parameter: low,
      });
      continue;
    }
    const power: number = interval.power + 1;
    const middle: bigint = interval.low + interval.high;
    const a: bigint = 2n * interval.low;
    const b: bigint = 2n * interval.high;
    if (evaluate(polynomial, middle, power) === 0n)
      output.push(exact(middle, 1n << BigInt(power)));
    const left: number = variation(a, power, 1) - variation(middle, power, -1);
    const right: number = variation(middle, power, 1) - variation(b, power, -1);
    pending.push(
      { low: middle, high: b, power, roots: right },
      { low: a, high: middle, power, roots: left },
    );
  }
  return output.sort((a: IHumanPolynomialRoot, b: IHumanPolynomialRoot): number => a.parameter - b.parameter);
}

/** Positive integer content normalization preserves all polynomial signs.
 *
 */
function primitive(values: readonly bigint[]): bigint[] {
  const result: bigint[] = [...values];
  while (result.at(-1) === 0n) result.pop();
  let content: bigint = 0n;
  for (const value of result) {
    let a: bigint = content;
    let b: bigint = value < 0n ? -value : value;
    while (b !== 0n) [a, b] = [b, a % b];
    content = a;
  }
  return content === 0n ? [] : result.map((value: bigint): bigint => value / content);
}

/** The formal derivative lowers degree; positive content reduction preserves its exact signs and roots.
 *
 */
function derivative(values: readonly bigint[]): bigint[] {
  return primitive(values.slice(1).map((value: bigint, at: number): bigint => value * BigInt(at + 1)));
}

/** Multiply each division step by a positive leading magnitude.
 *
 */
function pseudoRemainder(a: readonly bigint[], b: readonly bigint[]): bigint[] {
  let result: bigint[] = [...a];
  const leading: bigint = b.at(-1)!;
  const magnitude: bigint = leading < 0n ? -leading : leading;
  while (result.length >= b.length) {
    const shift: number = result.length - b.length;
    const factor: bigint = result.at(-1)! * (leading < 0n ? -1n : 1n);
    result = result.map((value: bigint): bigint => magnitude * value);
    for (let at: number = 0; at < b.length; at++) result[at + shift] -= factor * b[at];
    result = primitive(result);
  }
  return result;
}

/** Homogeneous Horner evaluation returns the exact sign at n/2^power.
 *
 */
function evaluate(
  values: readonly bigint[],
  numerator: bigint,
  power: number,
): bigint {
  const denominator: bigint = 1n << BigInt(power);
  let result: bigint = values.at(-1) ?? 0n;
  let scale: bigint = denominator;
  for (let at: number = values.length - 2; at >= 0; at--) {
    result = result * numerator + values[at] * scale;
    scale *= denominator;
  }
  return result;
}
