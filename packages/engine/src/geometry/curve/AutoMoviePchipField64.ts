import { AutoMoviePchip64 } from "./AutoMoviePchip64";

/**
 * Componentwise Fritsch–Butland interpolation with exposed local power coefficients and station derivatives. Coordinates and component values use caller-defined consistent units; queries outside the station range extrapolate the first or last polynomial.
 *
 * @evidence contracts/common.md#principled-implementation Each component uses the same weighted harmonic and endpoint-limited scalar slopes, then the cubic Hermite power coefficients interpolate its supports and first derivatives.
 * @evidence contracts/common.md#clear-and-simple-design The coefficient field is separate from AutoMoviePchip64 because vector consumers need coefficient access and polynomial extrapolation rather than the scalar field's closed-domain query policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No spatial tangent normalization or anatomical coordinate convention modifies the componentwise interpolation.
 * @evidence contracts/common.md#meaningful-documentation States component ordering, derivative units, extrapolation and caller responsibility for stable supplied arrays.
 * @evidence contracts/performance.md#efficient-algorithms S stations with D components require O(SD) construction and coefficient storage; queries search stations and evaluate D cubics.
 * @evidence contracts/performance.md#reuse-equivalent-work Secants are computed once and passed to the shared slope kernel; the resulting coefficients serve every later query and coefficient consumer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains coordinate/value arrays, station derivatives and four coefficients per component per interval, with no global cache.
 */
export class AutoMoviePchipField64 {
  /** Per-interval and per-component power coefficients [cubic, quadratic, derivative, value] relative to the interval start. */
  public readonly coefficients: number[][][];

  /** Station derivatives in component units per coordinate unit. */
  public readonly derivatives: number[][];

  /** Build finite coefficients on increasing coordinates with corresponding equal-length component rows; supplied arrays must remain stable for the field's lifetime. */
  public constructor(
    /** Increasing coordinates in one caller-owned chart. */
    public readonly x: readonly number[],
    /** Finite component rows in fixed corresponding order. */
    public readonly y: readonly (readonly number[])[],
  ) {
    if (
      x.length < 2 ||
      x.length !== y.length ||
      !y.flat().every(Number.isFinite)
    )
      throw new Error("Finite PCHIP supports required");
    const h: number[] = x
      .slice(1)
      .map((v: number, i: number): number => v - x[i]!);
    if (h.some((v: number): boolean => !Number.isFinite(v) || v <= 0))
      throw new Error("Increasing PCHIP coordinates required");
    const m: number[][] = h.map((w: number, i: number): number[] =>
      y[i]!.map((v: number, k: number): number => (y[i + 1]![k]! - v) / w),
    );
    const columns: number[][] = y[0]!.map((_: number, k: number): number[] =>
      AutoMoviePchip64.fromSecants(
        h,
        m.map((row: number[]): number => row[k]!),
      ),
    );
    this.derivatives = x.map((_: number, i: number): number[] =>
      columns.map((column: number[]): number => column[i]!),
    );
    this.coefficients = h.map((width: number, i: number): number[][] =>
      y[0]!.map((_: number, k: number): number[] => {
        const slope: number = m[i]![k]!;
        const d0: number = this.derivatives[i]![k]!;
        const d1: number = this.derivatives[i + 1]![k]!;
        const t: number = (d0 + d1 - 2 * slope) / width;
        return [t / width, (slope - d0) / width - t, d0, y[i]![k]!];
      }),
    );
    if (!this.coefficients.flat(2).every(Number.isFinite))
      throw new Error("Unresolved PCHIP coefficients");
  }

  /**
   * Evaluate every component or its first derivative, selecting the right interval at an interior knot. Values outside the coordinate range extrapolate the nearest interval; the caller owns a narrower supported domain when needed.
   *
   * @evidence contracts/common.md#principled-implementation The same retained local power coefficients produce values and their analytic first derivatives through Horner arithmetic.
   * @evidence contracts/common.md#clear-and-simple-design One interval selection serves every component and both query kinds.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Extrapolation is explicit polynomial continuation, without hidden end clamps or spatial renormalization.
   * @evidence contracts/common.md#meaningful-documentation States right-interval knot selection, extrapolation and derivative units inherited from the coefficient field.
   * @evidence contracts/performance.md#efficient-algorithms Linear station search plus O(D) component evaluation, with no slope resolution in the query path.
   * @evidence contracts/performance.md#reuse-equivalent-work Queries share the constructor's coefficients, including when consumers query derivatives at the same station repeatedly.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned component array is allocated; no query coordinate or result is retained by the field.
   */
  public at(value: number, derivative: boolean = false): number[] {
    let i: number = 0;
    while (i < this.x.length - 2 && value >= this.x[i + 1]!) i++;
    const s: number = value - this.x[i]!;
    return this.coefficients[i]!.map((c: readonly number[]): number =>
      derivative
        ? (3 * c[0]! * s + 2 * c[1]!) * s + c[2]!
        : ((c[0]! * s + c[1]!) * s + c[2]!) * s + c[3]!,
    );
  }
}
