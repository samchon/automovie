import { HumanBinary64Arithmetic } from "./HumanBinary64Arithmetic";
import { HumanExactFraction } from "./HumanExactFraction";
import type { IHumanExactFraction } from "./IHumanExactFraction";
import type { IHumanPolynomialRoot } from "./IHumanPolynomialRoot";

/** One dyadic interval used by the exact Sturm subdivision.
 *
 * @evidence contracts/common.md#principled-implementation Integer endpoints and a common binary denominator retain exact interval boundaries and their Sturm root count.
 * @evidence contracts/common.md#clear-and-simple-design One traversal record carries the two endpoints, denominator exponent and interior root count.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rounded endpoint or fixed subdivision tolerance replaces exact interval state.
 * @evidence contracts/common.md#meaningful-documentation Each field names its role in exact subdivision.
 *
 * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
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
 * @evidence contracts/common.md#principled-implementation Sturm variation differences count all roots; exact one-sided signs and dyadic subdivision certify binary64 parameter isolation.
 * @evidence contracts/common.md#clear-and-simple-design Integer sequence construction precedes immutable dyadic interval traversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sample grid, curvature assumption or small coefficient hides a root.
 * @evidence contracts/common.md#meaningful-documentation States coefficient order, repeated-root handling, interval and rounding termination.
 *
 * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
 */
export function isolateHumanPolynomialRoots(
  coefficients: readonly IHumanExactFraction[],
): IHumanPolynomialRoot[] {
  let denominator = 1n;
  for (const coefficient of coefficients)
    denominator *= coefficient.denominator;
  const polynomial = primitive(
    coefficients.map(
      (coefficient) =>
        coefficient.numerator * (denominator / coefficient.denominator),
    ),
  );
  if (polynomial.length === 0)
    throw new Error("An identically zero polynomial has no isolated root set.");
  if (polynomial.length === 1) return [];
  const sequence = [polynomial, derivative(polynomial)];
  while (sequence.at(-1)!.length > 0) {
    const remainder = primitive(
      pseudoRemainder(sequence.at(-2)!, sequence.at(-1)!).map(
        (value) => -value,
      ),
    );
    if (remainder.length === 0) break;
    sequence.push(remainder);
  }
  const variation = (
    numerator: bigint,
    power: number,
    side: 1 | -1,
  ): number => {
    let previous = 0,
      changes = 0;
    for (const member of sequence) {
      let current = member,
        order = 0,
        value = evaluate(current, numerator, power);
      while (value === 0n && current.length > 1) {
        current = derivative(current);
        order++;
        value = evaluate(current, numerator, power);
      }
      const sign =
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
  const exact = (
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
    const interval = pending.pop()!;
    if (interval.roots === 0) continue;
    const scale = 1n << BigInt(interval.power);
    const low = HumanBinary64Arithmetic.numberAt(interval.low, scale);
    const high = HumanBinary64Arithmetic.numberAt(interval.high, scale);
    if (low === high) {
      output.push({
        lower: HumanExactFraction.create(interval.low, scale),
        upper: HumanExactFraction.create(interval.high, scale),
        parameter: low,
      });
      continue;
    }
    const power = interval.power + 1,
      middle = interval.low + interval.high;
    const a = 2n * interval.low,
      b = 2n * interval.high;
    if (evaluate(polynomial, middle, power) === 0n)
      output.push(exact(middle, 1n << BigInt(power)));
    const left = variation(a, power, 1) - variation(middle, power, -1);
    const right = variation(middle, power, 1) - variation(b, power, -1);
    pending.push(
      { low: middle, high: b, power, roots: right },
      { low: a, high: middle, power, roots: left },
    );
  }
  return output.sort((a, b) => a.parameter - b.parameter);
}

/** Positive integer content normalization preserves all polynomial signs.
 *
 * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
 *
 * @evidence contracts/common.md#principled-implementation Positive integer-content normalization removes only common factors and trailing zero coefficients, preserving polynomial signs.
 * @evidence contracts/common.md#clear-and-simple-design primitive owns this exact polynomial or interval operation for the shared numerical caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact represented coefficients and endpoint signs are retained without a magnitude cutoff.
 * @evidence contracts/common.md#meaningful-documentation Positive integer-content normalization removes only common factors and trailing zero coefficients, preserving polynomial signs.
 */
function primitive(values: readonly bigint[]): bigint[] {
  const result = [...values];
  while (result.at(-1) === 0n) result.pop();
  let content = 0n;
  for (const value of result) {
    let a = content,
      b = value < 0n ? -value : value;
    while (b !== 0n) [a, b] = [b, a % b];
    content = a;
  }
  return content === 0n ? [] : result.map((value) => value / content);
}

/** The formal derivative lowers degree and preserves exact coefficients.
 *
 * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
 *
 * @evidence contracts/common.md#principled-implementation Formal power coefficients produce the exact polynomial derivative before positive-content normalization.
 * @evidence contracts/common.md#clear-and-simple-design derivative owns this exact polynomial or interval operation for the shared numerical caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact represented coefficients and endpoint signs are retained without a magnitude cutoff.
 * @evidence contracts/common.md#meaningful-documentation Formal power coefficients produce the exact polynomial derivative before positive-content normalization.
 */
function derivative(values: readonly bigint[]): bigint[] {
  return primitive(values.slice(1).map((value, at) => value * BigInt(at + 1)));
}

/** Multiply each division step by a positive leading magnitude.
 *
 * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
 *
 * @evidence contracts/common.md#principled-implementation Positive leading-magnitude scaling preserves the signs needed by the exact Sturm sequence.
 * @evidence contracts/common.md#clear-and-simple-design pseudoRemainder owns this exact polynomial or interval operation for the shared numerical caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact represented coefficients and endpoint signs are retained without a magnitude cutoff.
 * @evidence contracts/common.md#meaningful-documentation Positive leading-magnitude scaling preserves the signs needed by the exact Sturm sequence.
 */
function pseudoRemainder(a: readonly bigint[], b: readonly bigint[]): bigint[] {
  let result = [...a];
  const leading = b.at(-1)!;
  const magnitude = leading < 0n ? -leading : leading;
  while (result.length >= b.length) {
    const shift = result.length - b.length,
      factor = result.at(-1)! * (leading < 0n ? -1n : 1n);
    result = result.map((value) => magnitude * value);
    for (let at = 0; at < b.length; at++) result[at + shift] -= factor * b[at];
    result = primitive(result);
  }
  return result;
}

/** Homogeneous Horner evaluation returns the exact sign at n/2^power.
 *
 * @evidenceExclude contracts/modeling.md#spatial-conventions Unit-agnostic arithmetic carries no physical frame; its caller owns units.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Numerical representations and operations define no anatomical part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Existing source and parameter owners supply values; this operation introduces no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no render primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Computes numerical data; construction owners define geometric joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical data has no independent rendered output; geometry consumers observe their results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no clinical measurement, acquisition protocol or anatomical default.
 * @evidenceExclude contracts/anatomy.md#permitted-range Anatomical input admission remains with the profile and source owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Does not expose personal sculpting or a clinical conversion.
 *
 * @evidence contracts/common.md#principled-implementation Homogeneous Horner evaluation keeps the sign exact at the supplied dyadic parameter.
 * @evidence contracts/common.md#clear-and-simple-design evaluate owns this exact polynomial or interval operation for the shared numerical caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact represented coefficients and endpoint signs are retained without a magnitude cutoff.
 * @evidence contracts/common.md#meaningful-documentation Homogeneous Horner evaluation keeps the sign exact at the supplied dyadic parameter.
 */
function evaluate(
  values: readonly bigint[],
  numerator: bigint,
  power: number,
): bigint {
  const denominator = 1n << BigInt(power);
  let result = values.at(-1) ?? 0n,
    scale = denominator;
  for (let at = values.length - 2; at >= 0; at--) {
    result = result * numerator + values[at] * scale;
    scale *= denominator;
  }
  return result;
}
