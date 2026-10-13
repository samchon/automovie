import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanBinary64Arithmetic } from "../../common/measure/HumanBinary64Arithmetic";
import type { IHumanBodyDyadicValue } from "./IHumanBodyDyadicValue";

/**
 * Prove whether two finite source-double directions share one line.
 *
 * The clinical pose reader uses this identity before combining sagittal angles as scalars. Rounded products can cancel a nonzero determinant, so each IEEE-754 component is decoded as an integer times a power of two and the three determinants are compared with exact BigInt products. This is equality of supplied finite doubles, not certification of the rotations or trigonometric functions that produced them. A zero vector defines no axis and returns false; nonfinite input refuses before bit arithmetic.
 *
 * @evidence contracts/common.md#principled-implementation Shared exact binary64 decomposition feeds integer products whose powers are aligned before comparing the three cross determinants, preserving identity of represented finite directions.
 * @evidence contracts/common.md#clear-and-simple-design Local dyadic product and equality operations compose the canonical decoder rather than duplicating IEEE-754 field parsing in the clinical pose reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite components refuse and a zero vector defines no axis; exact represented determinant equality supplies no certification of upstream trigonometry or clinical rotation validity.
 * @evidence contracts/common.md#meaningful-documentation The prose gives finite-input scope, zero behavior, rounded-cancellation motivation and why the result concerns supplied doubles alone.
 * @evidence contracts/performance.md#efficient-algorithms A fixed three determinants use four bounded binary64 decompositions per determinant, BigInt products and exponent alignment; integer widths are bounded by binary64 component/exponent ranges rather than source mesh size.
 * @evidence contracts/performance.md#reuse-equivalent-work All components reuse the shared binary64 decoder, and each equality computes its product pair once; this pure scalar predicate needs no persistent cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Dyadic records and aligned BigInts are call-local, only a boolean escapes, and no source geometry, handle or asynchronous task is retained.
 */
export function humanBodyFlexionAxesCollinear(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): boolean {
  if (![a.x, a.y, a.z, b.x, b.y, b.z].every(Number.isFinite))
    throw new Error(
      "Body flexion-axis identity requires finite source directions.",
    );
  if (
    [a, b].some((vector: IAutoMovieVector3): boolean => vector.x === 0 && vector.y === 0 && vector.z === 0)
  )
    return false;
  const part: (value: number) => IHumanBodyDyadicValue = (value: number): IHumanBodyDyadicValue => {
    const [mantissa, exponent]: [bigint, number] = HumanBinary64Arithmetic.dyadic(value);
    return { mantissa, exponent };
  };
  const product: (left: number, right: number) => IHumanBodyDyadicValue = (left: number, right: number): IHumanBodyDyadicValue => {
    const l: IHumanBodyDyadicValue = part(left),
      r: IHumanBodyDyadicValue = part(right);
    return {
      mantissa: l.mantissa * r.mantissa,
      exponent: l.exponent + r.exponent,
    };
  };
  const equal: (x: number, y: number, z: number, w: number) => boolean = (x: number, y: number, z: number, w: number): boolean => {
    const left: IHumanBodyDyadicValue = product(x, y),
      right: IHumanBodyDyadicValue = product(z, w);
    const exponent: number = Math.min(left.exponent, right.exponent);
    return (
      left.mantissa << BigInt(left.exponent - exponent) ===
      right.mantissa << BigInt(right.exponent - exponent)
    );
  };
  return (
    equal(a.y, b.z, a.z, b.y) &&
    equal(a.z, b.x, a.x, b.z) &&
    equal(a.x, b.y, a.y, b.x)
  );
}
