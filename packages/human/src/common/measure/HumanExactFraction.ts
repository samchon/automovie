import { HumanBinary64Arithmetic } from "./HumanBinary64Arithmetic";
import type { IHumanExactFraction } from "./IHumanExactFraction";

/**
 * Exact rational operations retain represented inputs through polynomial
 * construction. Binary64 decomposition and rounding reuse their existing
 * bit-arithmetic owner; no anatomical tolerance enters these operations.
 *
 */
export class HumanExactFraction {
  /**
   * Reduce a rational to a positive denominator; a zero denominator refuses.
   */
  static create(numerator: bigint, denominator = 1n): IHumanExactFraction {
    if (denominator === 0n)
      throw new Error("An exact fraction needs a nonzero denominator.");
    if (denominator < 0n) {
      numerator = -numerator;
      denominator = -denominator;
    }
    const a = this.gcd(numerator, denominator);
    return { numerator: numerator / a, denominator: denominator / a };
  }

  /**
   * Convert a finite represented binary64 value to its exact rational value through the shared dyadic decomposition.
   */
  static from(value: number): IHumanExactFraction {
    const [n, power] = HumanBinary64Arithmetic.dyadic(value);
    return power >= 0
      ? this.create(n << BigInt(power))
      : this.create(n, 1n << BigInt(-power));
  }

  /**
   * Add exact values; interval addition applies the same operation to ordered bounds.
   */
  static add(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    if (a.denominator === b.denominator)
      return this.create(a.numerator + b.numerator, a.denominator);
    const common = this.gcd(a.denominator, b.denominator);
    const left = a.denominator / common;
    const right = b.denominator / common;
    return this.create(
      a.numerator * right + b.numerator * left,
      left * b.denominator,
    );
  }

  /**
   * Subtract exact rationals without a rounded intermediate value.
   */
  static subtract(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    return this.add(a, this.negate(b));
  }

  /**
   * Negate an exact rational while retaining its normalized denominator.
   */
  static negate(a: IHumanExactFraction): IHumanExactFraction {
    return this.create(-a.numerator, a.denominator);
  }

  /**
   * Multiply exact rational values or take the extrema of all four products for ordered intervals.
   */
  static multiply(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    if (a.denominator === 0n || b.denominator === 0n)
      return this.create(a.numerator * b.numerator, 0n);
    const left = this.gcd(a.numerator, b.denominator);
    const right = this.gcd(b.numerator, a.denominator);
    return this.create(
      (a.numerator / left) * (b.numerator / right),
      (a.denominator / right) * (b.denominator / left),
    );
  }

  /**
   * Divide exact rationals; a zero divisor reaches the shared denominator refusal.
   */
  static divide(
    a: IHumanExactFraction,
    b: IHumanExactFraction,
  ): IHumanExactFraction {
    return this.multiply(a, {
      numerator: b.denominator,
      denominator: b.numerator,
    });
  }

  /**
   * Read a nonnegative common divisor before multiplying represented integers.
   * Final create normalization remains authoritative, including directly
   * constructed unreduced values and the original denominator refusal.
   */
  private static gcd(a: bigint, b: bigint): bigint {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b !== 0n) [a, b] = [b, a % b];
    return a;
  }

  /**
   * Convert an exact positive-denominator rational through shared nearest-even binary64 rounding.
   */
  static number(a: IHumanExactFraction): number {
    return HumanBinary64Arithmetic.numberAt(a.numerator, a.denominator);
  }

  /**
   * Compare rational cross-products exactly and return their order without converting to binary64.
   */
  static compare(a: IHumanExactFraction, b: IHumanExactFraction): number {
    const difference =
      a.numerator * b.denominator - b.numerator * a.denominator;
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
  }

  /** Binary64 lower and upper bounds whose squares bracket the exact value.
   */
  static sqrtBounds(a: IHumanExactFraction): [number, number] {
    if (a.numerator < 0n)
      throw new Error("A squared metric cannot be negative.");
    if (a.numerator === 0n) return [0, 0];
    let exponent =
      a.numerator.toString(2).length - a.denominator.toString(2).length;
    if (
      exponent >= 0
        ? a.numerator < a.denominator << BigInt(exponent)
        : a.numerator << BigInt(-exponent) < a.denominator
    )
      exponent--;
    const power = Math.floor(exponent / 2);
    const reduced =
      power >= 0
        ? this.create(a.numerator, a.denominator << BigInt(2 * power))
        : this.create(a.numerator << BigInt(-2 * power), a.denominator);
    let lower = Math.sqrt(this.number(reduced)) * 2 ** power;
    if (!Number.isFinite(lower))
      throw new Error("Metric magnitude exceeds binary64 coordinates.");
    const square = (value: number): IHumanExactFraction =>
      this.multiply(this.from(value), this.from(value));
    while (this.compare(square(lower), a) > 0)
      lower = HumanBinary64Arithmetic.nextDown(lower);
    let upper = HumanBinary64Arithmetic.nextUp(lower);
    while (Number.isFinite(upper) && this.compare(square(upper), a) < 0) {
      lower = upper;
      upper = HumanBinary64Arithmetic.nextUp(upper);
    }
    return this.compare(square(lower), a) === 0
      ? [lower, lower]
      : [lower, upper];
  }
}
