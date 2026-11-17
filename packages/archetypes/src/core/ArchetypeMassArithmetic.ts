import type { IAutoMovieVector3 } from "@automovie/interface";

import { ArchetypeBinary64 } from "./ArchetypeBinary64";

/** An exact signed binary64 value, integer times a power of two. */
type IDyadic = ReturnType<ReturnType<typeof ArchetypeBinary64>>;

/** One call-local reader reused across all terms of an exceptional calculation. */
type Reader = ReturnType<typeof ArchetypeBinary64>;

/** IEEE-754 binary64's least positive normal value; smaller intermediate products lose significand bits. */
const NORMAL: number = 2 ** -1022;

/** The largest finite normal binade begins here; exact fallback protects its overflow-rounding boundary. */
const HIGH: number = 2 ** 1023;

/**
 * Scalar arithmetic shared by archetype mass allocation and weighted centres.
 * Ordinary finite products use binary64 directly; representability boundaries
 * and a scaled mean losing subnormal precision use exact dyadic arithmetic.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the mass/centroid purpose, ordinary numeric path and exact exceptional path.
 * @evidence contracts/development/design.md#principled-representation Scaled convex means and products/quotients are the same physical formulas; binary64 inputs are exact dyadic rationals and round only at the exceptional path's final result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Scalar/vector means, weight normalization, local products, ratio, weighted-product readers, product and sum serve existing primitive, composite and line-moment consumers without geometry, material or model ownership.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No physical cap, tolerance, clamp or cached scene state changes an input. A genuinely unrepresentable scalar remains infinite for its mass-property caller to refuse.
 */
export namespace ArchetypeMassArithmetic {
  /**
   * Compute a*b/(c*d) without losing a representable result to intermediate scale.
   *
   * @param a Finite nonnegative first numerator factor.
   * @param b Finite nonnegative second numerator factor.
   * @param c Finite positive first denominator factor.
   * @param d Finite positive second denominator factor.
   * @returns The ratio, with binary64 underflow/overflow only at the final result.
   * @throws {Error} For invalid scalar premises.
   * @evidence contracts/development/common.md#meaningful-documentation States the factor signs, numeric domain, exact fallback and final representability.
   * @evidence contracts/development/implementation.md#principled-implementation Cancelling no physical quantity, the exceptional path multiplies the exact integer significands and subtracts denominator exponents, then rounds the quotient to nearest binary64 with ties to even.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit factors, take the ordinary product/quotient when finite and nonzero, otherwise evaluate that same rational exactly.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero is returned only for a zero numerator or final representational underflow; neither an overflowing intermediate nor a density ratio is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four fixed factors bound both ordinary work and fallback integer width by binary64's exponent/significand range.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the exceptional path decomposes factors with one shared call-local ArchetypeBinary64 reader; no normal-call integer conversion or view allocation is performed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Call-local scalars and bounded integers only.
   */
  export function ratio(a: number, b: number, c: number, d: number): number {
    if (
      !(
        Number.isFinite(a) &&
        a >= 0 &&
        Number.isFinite(b) &&
        b >= 0 &&
        Number.isFinite(c) &&
        c > 0 &&
        Number.isFinite(d) &&
        d > 0
      )
    )
      throw new Error(
        "Mass ratios need finite nonnegative numerators and positive denominators",
      );
    if (a === 0 || b === 0) return 0;
    const numerator: number = a * b;
    const denominator: number = c * d;
    const ordinary: number = numerator / denominator;
    if (
      Number.isFinite(numerator) &&
      numerator >= NORMAL &&
      Number.isFinite(denominator) &&
      denominator >= NORMAL &&
      Number.isFinite(ordinary) &&
      ordinary >= NORMAL &&
      ordinary < HIGH
    )
      return ordinary;
    const read: Reader = ArchetypeBinary64();
    return quotient(multiply([a, b], read), multiply([c, d], read));
  }

  /**
   * Form a positive local weight without admitting lost subnormal precision.
   *
   * @param a Finite positive first local factor.
   * @param b Finite positive second local factor.
   * @returns The ordinary normal product or an exact positive subnormal product; null for zero, overflow or inexact subnormal local representation.
   * @throws {Error} For nonpositive or non-finite factors.
   * @evidence contracts/development/common.md#meaningful-documentation States factor premises, normal grouping and the local representation refusal marker.
   * @evidence contracts/development/implementation.md#principled-implementation Relative weight is a local datum consumed by normalization and weighted centres before aggregate mass allocation. Normal products retain the existing grouping. For a subnormal result, exact dyadic multiplication minus the represented result must be exactly zero, so quantization cannot change the weight before a large coordinate or lever magnifies it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit factors, compute the shared product, then compare exact and represented values only at the subnormal boundary.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Exact subnormal products remain supported; null is an explicit unsupported local datum for weightOf to refuse with its part id, never a replacement zero. Authored zero shares do not call this positive implicit-product path.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two fixed factors bound scalar work and exceptional integer width; ordinary normal products allocate no exact reader.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses product and the single Binary64/multiply/add owners for exact equality; no density or geometry representation is duplicated.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Scalars and exceptional dyadic records are call-local and no view, input or history escapes.
   */
  export function localProduct(a: number, b: number): number | null {
    if (!(Number.isFinite(a) && a > 0 && Number.isFinite(b) && b > 0))
      throw new Error("Local mass products need finite positive factors");
    const result: number = product(a, b);
    if (!(Number.isFinite(result) && result > 0)) return null;
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
  /**
   * Factor one allocated mass into every signed geometric contribution.
   *
   * @param mass Finite nonnegative total mass.
   * @param weight Finite nonnegative relative weight of this solid.
   * @param scale Finite positive weight scale.
   * @param total Finite positive dimensionless normalized weight total.
   * @returns A call-local reader of up to three finite signed geometric factors; absent factors are one. Each result is mass*weight*a*b*c/(scale*total).
   * @throws {Error} For invalid allocation premises or a non-finite geometric factor.
   * @evidence contracts/development/common.md#meaningful-documentation States the physical allocation, signed factor domain, optional identities, result and synchronous reader lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation A normal allocated mass below the highest binade uses the existing product grouping. At underflow or overflow boundaries, its exact mass*weight numerator and scale*total denominator remain separate from geometric factors until one quotient rounds the complete contribution to nearest binary64, ties to even. A nonzero subnormal allocation is not an exact mass operand: its rounding error could be magnified by a large local moment or lever.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit and allocate once, then return either the ordinary product reader or a fixed-factor exact quotient reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No positive weight is omitted because its scalar allocated mass rounds to zero. Truly final underflow/overflow remains representational; parts still publishes its independently rounded scalar masses and local primitive admission is unchanged.
   * @evidence contracts/development/implementation.md#efficient-algorithms One allocation per solid and constant work per contribution. The exceptional numerator has at most five finite binary64 factors and the denominator two, bounding integer width independently of scene size.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses ratio, product, the single exact multiply/quotient owner and one exceptional binary64 reader. All intrinsic and parallel-axis terms of one solid share its fixed exact allocation factors.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned synchronous reader retains only allocation scalars or their bounded dyadic values and one call-local eight-byte view; of discards it after this solid's six tensor entries. No model, history or global buffer is retained.
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
      if (!(Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c)))
        throw new Error("Mass products need finite factors");
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

  /**
   * Multiply up to four signed finite factors, rounding an exceptional product once.
   *
   * @param a First factor.
   * @param b Second factor.
   * @param c Third factor, one when unused.
   * @param d Fourth factor, one when unused.
   * @returns The product, including final zero/infinity when not representable.
   * @throws {Error} For non-finite inputs.
   * @evidence contracts/development/common.md#meaningful-documentation States finite signed factors, optional identities and final underflow/overflow meaning.
   * @evidence contracts/development/implementation.md#principled-implementation The fallback multiplies exact signed significands and adds exponents, then rounds once to binary64; this preserves a small mass times large squared lever when the final product is finite.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, ordinary multiplication, exact exceptional product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No magnitude cap or epsilon substitutes a representable product.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four factors give constant bounded work and integer width.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The ordinary path creates no factor array or dyadic values.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No retained input or resource.
   */
  export function product(
    a: number,
    b: number,
    c: number = 1,
    d: number = 1,
  ): number {
    if (
      !(
        Number.isFinite(a) &&
        Number.isFinite(b) &&
        Number.isFinite(c) &&
        Number.isFinite(d)
      )
    )
      throw new Error("Mass products need finite factors");
    if (a === 0 || b === 0 || c === 0 || d === 0) return 0;
    const pair: number = a * b;
    const triple: number = pair * c;
    const result: number = triple * d;
    return Number.isFinite(result) &&
      Math.abs(pair) >= NORMAL &&
      Math.abs(triple) >= NORMAL &&
      Math.abs(result) >= NORMAL &&
      Math.abs(result) < HIGH
      ? result
      : quotient(multiply([a, b, c, d], ArchetypeBinary64()), {
          integer: 1n,
          exponent: 0,
        });
  }

  /**
   * Sum finite signed contributions, using exact arithmetic at the overflow boundary.
   *
   * @param values Contributions in their physical accumulation order.
   * @returns Their sum; true final overflow is infinite.
   * @throws {Error} For a non-finite contribution.
   * @evidence contracts/development/common.md#meaningful-documentation States signed finite terms, accumulation order and final overflow meaning.
   * @evidence contracts/development/implementation.md#principled-implementation The normal ordered sum is retained. Non-finite output or a result in the largest normal binade invokes exact aligned dyadic summation before final rounding, preserving cancellation and the overflow midpoint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Check and add terms, then use one exact reduction only on non-finite output.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts True non-finite contributions are refused rather than hidden as cancellation or zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in contribution count on both paths, with exponent width bounded by binary64 plus logarithmic sum carry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Ordinary sums perform no integer decomposition.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Temporary exact terms exist only in the fallback call.
   */
  export function sum(values: readonly number[]): number {
    let result: number = 0;
    for (const value of values) {
      if (!Number.isFinite(value))
        throw new Error("Mass sums need finite contributions");
      result += value;
    }
    return Number.isFinite(result) && Math.abs(result) < HIGH
      ? result
      : quotient(add(values.map(ArchetypeBinary64())), {
          integer: 1n,
          exponent: 0,
        });
  }

  /**
   * The convex weighted mean of finite coordinates and nonnegative weights.
   *
   * @param coordinates One finite coordinate per weight, in a common unit.
   * @param weights Nonnegative finite weights with at least one positive member.
   * @param exact Request the exact input-value mean rounded once, for relationships between independently computed means.
   * @returns The mean in the coordinates' unit, always finite.
   * @throws {Error} For missing/mismatched inputs or invalid weights/coordinates.
   * @evidence contracts/development/common.md#meaningful-documentation States matching input lengths, finite coordinates, nonnegative nonempty weights and finite convex output.
   * @evidence contracts/development/implementation.md#principled-implementation Scale weights and coordinates by their maxima, sum normalized products and divide by the same ordered positive-weight sum. Every normalized coordinate is in [-1,1], bounding the quotient without a clamp. If scaling underflows a nonzero factor or term, or a caller explicitly needs the same final rounding law across related means, exact dyadic weighted numerator/denominator rounds only the final quotient.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit and find scales, preserve an all-zero coordinate result, then use the normal scaled path unless exact arithmetic is requested or normalization loses precision.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No small-weight cutoff, coordinate cap or guessed mean is used; a singleton and all-zero coordinates follow the same convex law.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two linear passes and constant scalar state normally; the exceptional exact reduction retains O(N) dyadic terms with binary64-bounded exponent span plus sum carry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One coordinate/weight scale serves the entire component mean. Requested exact means and detected scaling loss share the same single dyadic reduction; existing two-argument callers keep their ordinary arithmetic.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources All arrays and integer terms are call-local; no body, input history or handle is retained.
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
      if (
        !(Number.isFinite(coordinate) && Number.isFinite(weight) && weight >= 0)
      )
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

  /**
   * Normalize nonnegative weights before their total can overflow.
   *
   * @param weights Finite nonnegative relative weights, at least one positive.
   * @returns Maximum weight scale and the dimensionless sum of weights/scale.
   * @throws {Error} For invalid or all-zero weights.
   * @evidence contracts/development/common.md#meaningful-documentation States input signs, scale units and normalized total.
   * @evidence contracts/development/implementation.md#principled-implementation Dividing every weight by the same positive maximum preserves their relative allocation while each summed term lies in [0,1]. The total is at most the array length, rather than a potentially overflowing physical weight sum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit and find the maximum, then sum the normalized weights.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No zero-total fallback, small-weight cutoff or physical weight cap is introduced; ratio's exact exceptional path can restore a tiny numerator.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two linear passes and constant scalar state.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One result is shared by all of's or parts' allocations.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns only two numbers and retains no array.
   */
  export function normalization(weights: readonly number[]): {
    scale: number;
    total: number;
  } {
    let scale: number = 0;
    for (const weight of weights) {
      if (!(Number.isFinite(weight) && weight >= 0))
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

  /**
   * A finite weighted centre in three coordinates, using the scalar mean owner.
   *
   * @param points Model-local centres, each finite in all components.
   * @param weights Matching finite nonnegative weights with a positive member.
   * @returns The common centre in the points' units and space.
   * @throws {Error} Under mean's matching-length, finite-input and positive-weight conditions.
   * @evidence contracts/development/common.md#meaningful-documentation States common space, matching weights and scalar-owner refusals.
   * @evidence contracts/development/implementation.md#principled-implementation A vector's mass-weighted mean is the same scalar convex mean in each independent coordinate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three component projections and mean calls.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no coordinate fallback, mass guess or special geometry case.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three linear reductions use O(N) temporary component arrays; exact fallback is scalar mean's exceptional path.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work of and combine share the same scalar mean and coordinate projection owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only a new three-number vector escapes; component arrays are call-local.
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

/** Exact fixed-factor product. */
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

/** Exact aligned sum; zero terms do not enlarge the alignment span. */
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

/** Round an exact rational to nearest binary64, ties to even, including subnormals. */
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
