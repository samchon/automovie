import type { IAutoMovieVector3 } from "@automovie/interface";

import { ArchetypeBinary64 } from "./ArchetypeBinary64";

/*
 * Scalar arithmetic shared by archetype mass allocation and weighted centres.
 * Ordinary finite products use binary64 directly; representability boundaries
 * and a scaled mean losing subnormal precision use exact dyadic arithmetic.
 */
export namespace ArchetypeMassArithmetic {
  /*
   * Compute a_b/(c_d) without losing a representable result to intermediate
   * scale.
   * Parameter a: Finite nonnegative first numerator factor.
   * Parameter b: Finite nonnegative second numerator factor.
   * Parameter c: Finite positive first denominator factor.
   * Parameter d: Finite positive second denominator factor.
   * Returns: The ratio, with binary64 underflow/overflow only at the final
   * result.
   * For invalid scalar premises.
   */
  export function ratio(a: number, b: number, c: number, d: number): number {
    if (!(a >= 0 && b >= 0 && c > 0 && d > 0))
      throw new Error(
        "Mass ratios need finite nonnegative numerators and positive denominators",
      );
    if (a === 0 || b === 0) return 0;
    const numerator: number = a * b;
    const denominator: number = c * d;
    const ordinary: number = numerator / denominator;
    if (
      numerator >= NORMAL &&
      denominator >= NORMAL &&
      ordinary >= NORMAL &&
      ordinary < HIGH
    )
      return ordinary;
    const read: Reader = ArchetypeBinary64();
    return quotient(multiply([a, b], read), multiply([c, d], read));
  }

  /*
   * Form a positive local weight without admitting lost subnormal precision.
   * Parameter a: Finite positive first local factor.
   * Parameter b: Finite positive second local factor.
   * Returns: The ordinary normal product or an exact positive subnormal
   * product; null for zero, overflow or inexact subnormal local
   * representation.
   * For nonpositive or non-finite factors.
   */
  export function localProduct(a: number, b: number): number | null {
    if (!(a > 0 && b > 0))
      throw new Error("Local mass products need finite positive factors");
    const result: number = product(a, b);
    if (!(result > 0)) return null;
    if (result >= NORMAL) return result;
    const read: Reader = ArchetypeBinary64();
    const represented: IDyadic = read(result);
    return add([
      multiply([a, b], read),
      { integer: -represented.integer, exponent: represented.exponent },
    ]).integer === 0n
      ? result
      : null;
  }
  /*
   * Factor one allocated mass into every signed geometric contribution.
   * Parameter mass: Finite nonnegative total mass.
   * Parameter weight: Finite nonnegative relative weight of this solid.
   * Parameter scale: Finite positive weight scale.
   * Parameter total: Finite positive dimensionless normalized weight total.
   * Returns: A call-local reader of up to three finite signed geometric
   * factors; absent factors are one. Each result is
   * mass_weight_a_b_c/(scale*total).
   * For invalid allocation premises or a non-finite geometric
   * factor.
   */
  export function weightedProduct(
    mass: number,
    weight: number,
    scale: number,
    total: number,
  ): (a: number, b?: number, c?: number) => number {
    const allocated: number = ratio(mass, weight, scale, total);
    if (allocated >= NORMAL && allocated < HIGH)
      return (a: number, b: number = 1, c: number = 1): number =>
        product(allocated, a, b, c);
    const read: Reader = ArchetypeBinary64();
    const numerator: IDyadic = multiply([mass, weight], read);
    const denominator: IDyadic = multiply([scale, total], read);
    return (a: number, b: number = 1, c: number = 1): number => {
      if (a === 0 || b === 0 || c === 0) return 0;
      const geometric: IDyadic = multiply([a, b, c], read);
      return quotient(
        {
          integer: numerator.integer * geometric.integer,
          exponent: numerator.exponent + geometric.exponent,
        },
        denominator,
      );
    };
  }

  /*
   * Multiply up to four signed finite factors, rounding an exceptional product
   * once.
   * Parameter a: First factor.
   * Parameter b: Second factor.
   * Parameter c: Third factor, one when unused.
   * Parameter d: Fourth factor, one when unused.
   * Returns: The product, including final zero/infinity when not representable.
   * For non-finite inputs.
   */
  export function product(
    a: number,
    b: number,
    c: number = 1,
    d: number = 1,
  ): number {
    if (a === 0 || b === 0 || c === 0 || d === 0) return 0;
    const pair: number = a * b;
    const triple: number = pair * c;
    const result: number = triple * d;
    return Math.abs(pair) >= NORMAL &&
      Math.abs(triple) >= NORMAL &&
      Math.abs(result) >= NORMAL &&
      Math.abs(result) < HIGH
      ? result
      : quotient(multiply([a, b, c, d], ArchetypeBinary64()), {
          integer: 1n,
          exponent: 0,
        });
  }

  /*
   * Sum finite signed contributions, using exact arithmetic at the overflow
   * boundary.
   * Parameter values: Contributions in their physical accumulation order.
   * Returns: Their sum; true final overflow is infinite.
   * For a non-finite contribution.
   */
  export function sum(values: readonly number[]): number {
    let result: number = 0;
    for (const value of values) {
      result += value;
    }
    return Math.abs(result) < HIGH
      ? result
      : quotient(add(values.map(ArchetypeBinary64())), {
          integer: 1n,
          exponent: 0,
        });
  }

  /*
   * The convex weighted mean of finite coordinates and nonnegative weights.
   * Parameter coordinates: One finite coordinate per weight, in a common unit.
   * Parameter weights: Nonnegative finite weights with at least one positive
   * member.
   * Parameter exact: Request the exact input-value mean rounded once, for
   * relationships between independently computed means.
   * Returns: The mean in the coordinates' unit, always finite.
   * For missing/mismatched inputs or invalid
   * weights/coordinates.
   */
  export function mean(
    coordinates: readonly number[],
    weights: readonly number[],
    exact: boolean = false,
  ): number {
    if (coordinates.length !== weights.length || weights.length === 0)
      throw new Error(
        "A mass mean needs matching nonempty coordinates and weights",
      );
    let coordinateScale: number = 0;
    let weightScale: number = 0;
    for (let i: number = 0; i < weights.length; i++) {
      const coordinate: number = coordinates[i]!;
      const weight: number = weights[i]!;
      if (!(weight >= 0))
        throw new Error(
          "A mass mean needs finite coordinates and nonnegative finite weights",
        );
      coordinateScale = Math.max(coordinateScale, Math.abs(coordinate));
      weightScale = Math.max(weightScale, weight);
    }
    if (!(weightScale > 0))
      throw new Error("A mass mean needs positive total weight");
    if (coordinateScale === 0) return 0;
    if (!exact) {
      let numerator: number = 0;
      let denominator: number = 0;
      let lost: boolean = false;
      for (let i: number = 0; i < weights.length; i++) {
        const weight: number = weights[i]! / weightScale;
        const coordinate: number = coordinates[i]! / coordinateScale;
        const term: number = weight * coordinate;
        lost ||=
          (weights[i] !== 0 && weight < NORMAL) ||
          (coordinates[i] !== 0 && Math.abs(coordinate) < NORMAL) ||
          (weight !== 0 && coordinate !== 0 && Math.abs(term) < NORMAL);
        numerator += term;
        denominator += weight;
      }
      if (!lost) return coordinateScale * (numerator / denominator);
    }
    const read: Reader = ArchetypeBinary64();
    const products: IDyadic[] = coordinates.map(
      (coordinate: number, i: number): IDyadic =>
        multiply([coordinate, weights[i]!], read),
    );
    return quotient(add(products), add(weights.map(read)));
  }

  /*
   * Normalize nonnegative weights before their total can overflow.
   * Parameter weights: Finite nonnegative relative weights, at least one positive.
   * Returns: Maximum weight scale and the dimensionless sum of weights/scale.
   * For invalid or all-zero weights.
   */
  export function normalization(weights: readonly number[]): {
    scale: number;
    total: number;
  } {
    let scale: number = 0;
    for (const weight of weights) {
      if (!(weight >= 0))
        throw new Error("Mass weights must be finite and nonnegative");
      scale = Math.max(scale, weight);
    }
    if (!(scale > 0))
      throw new Error(
        "Mass properties need a positive solid volume or mass share",
      );
    let total: number = 0;
    for (const weight of weights) total += weight / scale;
    return { scale, total };
  }

  /*
   * A finite weighted centre in three coordinates, using the scalar mean owner.
   * Parameter points: Model-local centres, each finite in all components.
   * Parameter weights: Matching finite nonnegative weights with a positive member.
   * Returns: The common centre in the points' units and space.
   * Under mean's matching-length, finite-input and
   * positive-weight conditions.
   */
  export function vectorMean(
    points: readonly IAutoMovieVector3[],
    weights: readonly number[],
  ): IAutoMovieVector3 {
    return {
      x: mean(
        points.map((p: IAutoMovieVector3): number => p.x),
        weights,
      ),
      y: mean(
        points.map((p: IAutoMovieVector3): number => p.y),
        weights,
      ),
      z: mean(
        points.map((p: IAutoMovieVector3): number => p.z),
        weights,
      ),
    };
  }
}

/*
 * IEEE-754 binary64's least positive normal value; smaller intermediate
 * products lose significand bits.
 */
const NORMAL: number = 2 ** -1022;

/*
 * The largest finite normal binade begins here; exact fallback protects its
 * overflow-rounding boundary.
 */
const HIGH: number = 2 ** 1023;

/*
 * Exact fixed-factor product.
 */
function multiply(values: readonly number[], read: Reader): IDyadic {
  let integer: bigint = 1n;
  let exponent: number = 0;
  for (const value of values) {
    const term: IDyadic = read(value);
    integer *= term.integer;
    exponent += term.exponent;
  }
  return { integer, exponent };
}

/*
 * Exact aligned sum; zero terms do not enlarge the alignment span.
 */
function add(terms: readonly IDyadic[]): IDyadic {
  const nonzero: IDyadic[] = terms.filter(
    (term: IDyadic): boolean => term.integer !== 0n,
  );
  if (nonzero.length === 0) return { integer: 0n, exponent: 0 };
  let exponent: number = nonzero[0]!.exponent;
  for (const term of nonzero) exponent = Math.min(exponent, term.exponent);
  let integer: bigint = 0n;
  for (const term of nonzero)
    integer += term.integer << BigInt(term.exponent - exponent);
  return { integer, exponent };
}

/*
 * Round an exact rational to nearest binary64, ties to even, including
 * subnormals.
 */
function quotient(numerator: IDyadic, denominator: IDyadic): number {
  if (numerator.integer === 0n) return 0;
  const negative: boolean = numerator.integer < 0n !== denominator.integer < 0n;
  const n: bigint =
    numerator.integer < 0n ? -numerator.integer : numerator.integer;
  const d: bigint =
    denominator.integer < 0n ? -denominator.integer : denominator.integer;
  const bitDifference: number = n.toString(2).length - d.toString(2).length;
  let exponent: number =
    bitDifference + numerator.exponent - denominator.exponent;
  if (
    bitDifference >= 0
      ? n < d << BigInt(bitDifference)
      : n << BigInt(-bitDifference) < d
  )
    exponent--;
  if (exponent > 1023) return negative ? -Infinity : Infinity;
  if (exponent < -1075) return negative ? -0 : 0;
  const power: number = Math.max(exponent - 52, -1074);
  const shift: number = numerator.exponent - denominator.exponent - power;
  const top: bigint = shift >= 0 ? n << BigInt(shift) : n;
  const bottom: bigint = shift < 0 ? d << BigInt(-shift) : d;
  let rounded: bigint = top / bottom;
  const remainder: bigint = top % bottom;
  if (
    2n * remainder > bottom ||
    (2n * remainder === bottom && (rounded & 1n) !== 0n)
  )
    rounded++;
  const value: number = Number(rounded) * 2 ** power;
  return negative ? -value : value;
}

/*
 * An exact signed binary64 value, integer times a power of two.
 */
type IDyadic = ReturnType<ReturnType<typeof ArchetypeBinary64>>;

/*
 * One call-local reader reused across all terms of an exceptional calculation.
 */
type Reader = ReturnType<typeof ArchetypeBinary64>;
