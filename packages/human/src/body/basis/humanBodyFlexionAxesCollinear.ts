import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBodyDyadicValue } from "./IHumanBodyDyadicValue";

/**
 * Prove whether two finite source-double directions share one line.
 *
 * The clinical pose reader uses this identity before combining sagittal
 * angles as scalars. Rounded products can cancel a nonzero determinant, so
 * each IEEE-754 component is decoded as an integer times a power of two and
 * the three determinants are compared with exact BigInt products. This is
 * equality of supplied finite doubles, not certification of the rotations or
 * trigonometric functions that produced them. A zero vector defines no axis
 * and returns false; nonfinite input refuses before bit arithmetic.
 *
 * @evidence contracts/common.md#principled-implementation A finite binary64 number is its signed integer significand times 2 raised to an integer exponent. Aligning exact BigInt product exponents compares all three cross-product determinants without rounded multiplication, including subnormals and signed zero.
 * @evidence contracts/common.md#clear-and-simple-design One finite/nonzero admission and three exact product equalities own the predicate used by the clinical reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No angular tolerance or name selects equality; the predicate reads the supplied source doubles.
 * @evidence contracts/common.md#meaningful-documentation States the source-double meaning, numerical limit, zero behavior, refusal and real consumer.
 * @evidence contracts/modeling.md#spatial-conventions Both directions must belong to the same frame; positive or negative scale leaves their line identity unchanged and no unit conversion occurs.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Constructs no surface boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Supplies a numerical identity and draws nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Establishes no clinical range or motion capacity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Reads directions rather than a personal authoring input.
 */
export function humanBodyFlexionAxesCollinear(a: IAutoMovieVector3, b: IAutoMovieVector3): boolean {
  if (![a.x, a.y, a.z, b.x, b.y, b.z].every(Number.isFinite))
    throw new Error("Body flexion-axis identity requires finite source directions.");
  if ([a, b].some((vector) => vector.x === 0 && vector.y === 0 && vector.z === 0)) return false;
  const bits = new DataView(new ArrayBuffer(8));
  const part = (value: number): IHumanBodyDyadicValue => {
    bits.setFloat64(0, value);
    const word = bits.getBigUint64(0);
    const exponent = Number((word >> 52n) & 2047n);
    const fraction = word & ((1n << 52n) - 1n);
    const mantissa = exponent === 0 ? fraction : fraction + (1n << 52n);
    return { mantissa: (word >> 63n) === 0n ? mantissa : -mantissa, exponent: exponent === 0 ? -1074 : exponent - 1075 };
  };
  const product = (left: number, right: number): IHumanBodyDyadicValue => {
    const l = part(left), r = part(right);
    return { mantissa: l.mantissa * r.mantissa, exponent: l.exponent + r.exponent };
  };
  const equal = (x: number, y: number, z: number, w: number): boolean => {
    const left = product(x, y), right = product(z, w);
    const exponent = Math.min(left.exponent, right.exponent);
    return (left.mantissa << BigInt(left.exponent - exponent)) === (right.mantissa << BigInt(right.exponent - exponent));
  };
  return equal(a.y, b.z, a.z, b.y) && equal(a.z, b.x, a.x, b.z) && equal(a.x, b.y, a.y, b.x);
}
