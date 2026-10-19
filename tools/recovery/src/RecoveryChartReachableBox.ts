/**
 * Bound one declared affine row over a common independent-coefficient box.
 * Duplicate original IDs first combine in input order using binary64 addition.
 * The resulting floating-point coefficients, constants, bounds and target are
 * then interpreted as exact dyadic numbers. Endpoint arithmetic and the strict
 * squared-distance comparison against tolerance are exact for that row.
 *
 * Returned endpoints round outward. minimumDistanceMm is an approximate number
 * view; only infeasibleAtTolerance uses the exact comparison. A false decision
 * does not establish that several observations can be fitted simultaneously.
 * Row identities do not identify source vertices, and this box is not generated
 * geometry, continuous source support or a closest-surface distance certificate.
 * Nonfinite input, conflicting bounds, invalid IDs, exhausted raw term budgets,
 * nonfinite duplicate sums or nonrepresentable number views throw atomically.
 *
 * @evidence contracts/common.md#principled-implementation An affine scalar row attains each coordinate extremum at the appropriate box endpoints, including signed weights. Exact binary64 decomposition into BigInt dyadics preserves the resulting row, and exact distance-squared comparison supplies a necessary single-observation feasibility condition without a coefficient solve.
 * @evidence contracts/common.md#clear-and-simple-design One pure operation combines declared IDs, accumulates exact intervals and compares one target; outward number views and approximate distance diagnostics are separate from its exact predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normalization, epsilon deletion, coefficient clamp, coordinate matching, source geometry or inferred boundary ownership changes the supplied affine problem. Exactly canceled IDs remain in the unique-address count.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, duplicate-sum order, exact float-row semantics, outward rounding, approximate distance, strict tolerance, failure effects and the limits of single-point feasibility.
 * @evidence contracts/performance.md#efficient-algorithms For T supplied terms the operation uses O(T) map work and O(T) exact arithmetic operations on bounded-exponent dyadics; integer width grows with the binary64 exponent range and log(T). There is no observation traversal, dense solve or geometry generation.
 * @evidence contracts/performance.md#reuse-equivalent-work Duplicate terms combine once before all three coordinate bounds, and their exact dyadic weights are reused across coordinates. A single local DataView decodes every binary64 input; no cross-call cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources maxTerms caps both supplied work and retained unique IDs. Call-local maps, BigInts and the eight-byte decoding buffer expire on return or throw; returned tuples own their numbers and no handles or input arrays are retained.
 */
export function RecoveryChartReachableBox(input: {
  /** Constant part of the substituted position row, millimetres. */
  constantMm: readonly [number, number, number];

  /** Original independent IDs and dimensionless weights; repeated IDs combine in input order. */
  terms: readonly { id: number; weight: number }[];

  /** Common independent-control lower bounds, millimetres. */
  lowerMm: readonly [number, number, number];

  /** Common independent-control upper bounds, millimetres. */
  upperMm: readonly [number, number, number];

  /** One private positional observation, millimetres; it need not be inside the box. */
  targetMm: readonly [number, number, number];

  /** Positive millimetre tolerance; exact equality is not infeasible. */
  toleranceMm: number;

  /** Positive safe cap on supplied terms, including repeated and canceled addresses. */
  maxTerms: number;
}): {
  /** Outward-rounded lower endpoints, millimetres. */
  lowerMm: [number, number, number];

  /** Outward-rounded upper endpoints, millimetres. */
  upperMm: [number, number, number];

  /** Approximate distance to the exact row image, millimetres. */
  minimumDistanceMm: number;

  /** Exact strict distance-squared comparison for the combined binary64 row. */
  infeasibleAtTolerance: boolean;

  /** Binary64 sum of combined weights, in first-address order. */
  weightSum: number;

  /** Binary64 sum of absolute combined weights, in first-address order. */
  absoluteWeightSum: number;

  /** Unique original addresses, including exact-zero cancellations. */
  terms: number;

  /** Predicate scope and diagnostic precision qualification. */
  diagnostic: string;
} {
  const finite: (p: readonly number[]) => boolean = (
    p: readonly number[],
  ): boolean => p.length === 3 && p.every(Number.isFinite);
  if (
    !finite(input.constantMm) ||
    !finite(input.lowerMm) ||
    !finite(input.upperMm) ||
    !finite(input.targetMm) ||
    input.lowerMm.some(
      (x: number, k: number): boolean => x > input.upperMm[k]!,
    ) ||
    !(input.toleranceMm > 0 && Number.isFinite(input.toleranceMm)) ||
    !Number.isSafeInteger(input.maxTerms) ||
    input.maxTerms < 1 ||
    input.terms.length > input.maxTerms
  )
    throw new Error(
      "Finite affine row, ordered box, positive tolerance and bounded terms are required",
    );
  type Dyadic = { n: bigint; e: number };
  const view: DataView = new DataView(new ArrayBuffer(8));
  const exact: (x: number) => Dyadic = (x: number): Dyadic => {
    view.setFloat64(0, x, false);
    const hi: number = view.getUint32(0, false),
      lo: number = view.getUint32(4, false),
      exponent: number = (hi >>> 20) & 2047;
    let n: bigint = (BigInt(hi & 1048575) << 32n) + BigInt(lo);
    if (exponent) n += 1n << 52n;
    if (hi >>> 31) n = -n;
    return { n, e: exponent ? exponent - 1075 : -1074 };
  };
  const add: (a: Dyadic, b: Dyadic) => Dyadic = (
    a: Dyadic,
    b: Dyadic,
  ): Dyadic => {
    const e: number = Math.min(a.e, b.e);
    return { n: (a.n << BigInt(a.e - e)) + (b.n << BigInt(b.e - e)), e };
  };
  const product: (a: Dyadic, b: Dyadic) => Dyadic = (
    a: Dyadic,
    b: Dyadic,
  ): Dyadic => ({ n: a.n * b.n, e: a.e + b.e });
  const difference: (a: Dyadic, b: Dyadic) => Dyadic = (
    a: Dyadic,
    b: Dyadic,
  ): Dyadic => add(a, { n: -b.n, e: b.e });
  const outward: (a: Dyadic, direction: -1 | 1) => number = (
    a: Dyadic,
    direction: -1 | 1,
  ): number => {
    if (a.n === 0n) return 0;
    const negative: boolean = a.n < 0n,
      magnitude: bigint = negative ? -a.n : a.n;
    const leading: number = magnitude.toString(2).length - 1 + a.e,
      quantum: number = Math.max(-1074, leading - 52);
    const shift: number = a.e - quantum;
    let units: bigint =
      shift >= 0 ? magnitude << BigInt(shift) : magnitude >> BigInt(-shift);
    const remainder: boolean =
      shift < 0 && magnitude !== units << BigInt(-shift);
    if (remainder && (negative ? direction < 0 : direction > 0)) units++;
    const value: number = (negative ? -1 : 1) * Number(units) * 2 ** quantum;
    if (!Number.isFinite(value))
      throw new Error("An outward affine-box number view is not representable");
    return value;
  };
  const combined: Map<number, number> = new Map();
  for (const term of input.terms) {
    if (
      !Number.isSafeInteger(term.id) ||
      term.id < 0 ||
      !Number.isFinite(term.weight)
    )
      throw new Error(
        "Finite weights and nonnegative original integer IDs are required",
      );
    const weight: number = (combined.get(term.id) ?? 0) + term.weight;
    if (!Number.isFinite(weight))
      throw new Error("A combined binary64 row weight became nonfinite");
    combined.set(term.id, weight);
  }
  const weights: Dyadic[] = [...combined.values()].map(exact);
  const lower: Dyadic[] = input.lowerMm.map(exact),
    upper: Dyadic[] = input.upperMm.map(exact);
  const lows: Dyadic[] = input.constantMm.map(exact),
    highs: Dyadic[] = input.constantMm.map(exact);
  let weightSum: number = 0,
    absoluteWeightSum: number = 0;
  for (const weight of combined.values()) {
    weightSum += weight;
    absoluteWeightSum += Math.abs(weight);
  }
  if (!Number.isFinite(weightSum) || !Number.isFinite(absoluteWeightSum))
    throw new Error("Affine-row weight diagnostics are not representable");
  for (const weight of weights)
    for (let k: number = 0; k < 3; k++) {
      lows[k] = add(
        lows[k]!,
        product(weight, weight.n < 0n ? upper[k]! : lower[k]!),
      );
      highs[k] = add(
        highs[k]!,
        product(weight, weight.n < 0n ? lower[k]! : upper[k]!),
      );
    }
  let squared: Dyadic = { n: 0n, e: 0 };
  const gaps: number[] = [];
  for (let k: number = 0; k < 3; k++) {
    const target: Dyadic = exact(input.targetMm[k]!),
      below: Dyadic = difference(lows[k]!, target),
      above: Dyadic = difference(target, highs[k]!);
    const gap: Dyadic =
      below.n > 0n ? below : above.n > 0n ? above : { n: 0n, e: 0 };
    squared = add(squared, product(gap, gap));
    gaps.push(outward(gap, -1));
  }
  const tolerance: Dyadic = exact(input.toleranceMm),
    minimumDistanceMm: number = Math.hypot(...gaps);
  if (!Number.isFinite(minimumDistanceMm))
    throw new Error("The approximate affine-box distance is not representable");
  return {
    lowerMm: [
      outward(lows[0]!, -1),
      outward(lows[1]!, -1),
      outward(lows[2]!, -1),
    ],
    upperMm: [
      outward(highs[0]!, 1),
      outward(highs[1]!, 1),
      outward(highs[2]!, 1),
    ],
    minimumDistanceMm,
    infeasibleAtTolerance:
      difference(squared, product(tolerance, tolerance)).n > 0n,
    weightSum,
    absoluteWeightSum,
    terms: combined.size,
    diagnostic:
      "Exact dyadic single-row predicate after binary64 duplicate combination; outward endpoint views and approximate distance do not certify joint fit, source support or closest-surface distance.",
  };
}
