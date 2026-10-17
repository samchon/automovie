/**
 * A scalar piecewise cubic with Fritsch–Butland slope seeds, in arbitrary consistent coordinate and value units. Explicit derivatives replace those seeds; evaluation rejects extrapolation and chooses the right interval at an interior knot.
 *
 * @evidence contracts/common.md#principled-implementation Weighted harmonic interior slopes and bounded three-point endpoint slopes follow Fritsch and Butland, https://doi.org/10.1137/0905021; local power coefficients interpolate the supplied values and derivatives.
 * @evidence contracts/common.md#clear-and-simple-design One scalar field owns its interval coefficients; reusable slope resolution is exposed separately for callers constructing vector or tensor fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomy, smoothing fit, coordinate conversion or replacement endpoint derivative is introduced.
 * @evidence contracts/common.md#meaningful-documentation States derivative units, caller-owned immutable station storage, knot selection and extrapolation refusal.
 * @evidence contracts/performance.md#efficient-algorithms Construction is linear in station count and evaluates one interval with Horner arithmetic after a linear interval search.
 * @evidence contracts/performance.md#reuse-equivalent-work Coefficients are computed once per constructed field and reused for value and derivative queries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A field retains its supplied station array and four coefficients per interval, with no global cache or consumer references.
 */
export class AutoMoviePchip64 {
  /** Local power coefficients [cubic, quadratic, derivative, value] relative to each interval's start. */
  private readonly coefficients: readonly (readonly [
    number,
    number,
    number,
    number,
  ])[];

  /** Store stable coordinates and resolve coefficients from values and derivatives per coordinate unit; callers must not mutate coordinates during this field's lifetime. */
  public constructor(
    private readonly xs: readonly number[],
    values: readonly number[],
    derivatives: readonly number[] = AutoMoviePchip64.slopes(xs, values),
  ) {
    if (
      xs.length < 2 ||
      values.length !== xs.length ||
      derivatives.length !== xs.length ||
      ![...xs, ...values, ...derivatives].every(Number.isFinite) ||
      xs.some((x: number, i: number): boolean => i > 0 && x <= xs[i - 1]!)
    )
      throw new Error("Ordered finite spline coordinates required");
    const coefficients: [number, number, number, number][] = [];
    for (let i: number = 0; i < xs.length - 1; i++) {
      const h: number = xs[i + 1]! - xs[i]!;
      const secant: number = (values[i + 1]! - values[i]!) / h;
      const t: number =
        (derivatives[i]! + derivatives[i + 1]! - 2 * secant) / h;
      coefficients.push([
        t / h,
        (secant - derivatives[i]!) / h - t,
        derivatives[i]!,
        values[i]!,
      ]);
    }
    this.coefficients = coefficients;
  }

  /**
   * Evaluate inside the closed coordinate range; derivative output has value units per coordinate unit. Nonfinite input, extrapolation and nonfinite results reject.
   *
   * @evidence contracts/common.md#principled-implementation Horner evaluation uses the interval's local coordinate; differentiating those same power coefficients gives the first derivative.
   * @evidence contracts/common.md#clear-and-simple-design The derivative switch shares interval selection and coefficient storage with ordinary evaluation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An out-of-domain query is rejected rather than clamped or extrapolated, and no derivative normalization changes its units.
   * @evidence contracts/common.md#meaningful-documentation States the closed domain, right-interval knot convention and finite-result requirement.
   * @evidence contracts/performance.md#efficient-algorithms Interval search is O(n); the selected cubic then uses a fixed number of scalar operations.
   * @evidence contracts/performance.md#reuse-equivalent-work Both query kinds read the coefficients retained by the constructor, without rebuilding slopes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A query retains no prior coordinate or result and allocates no interval arrays.
   */
  public at(x: number, derivative: boolean = false): number {
    if (!Number.isFinite(x) || x < this.xs[0]! || x > this.xs.at(-1)!)
      throw new Error("Outside scalar spline coordinate range");
    let i: number = 0;
    while (i < this.xs.length - 2 && x >= this.xs[i + 1]!) i++;
    const d: number = x - this.xs[i]!;
    const c: readonly [number, number, number, number] = this.coefficients[i]!;
    const result: number = derivative
      ? (3 * c[0] * d + 2 * c[1]) * d + c[2]
      : ((c[0] * d + c[1]) * d + c[2]) * d + c[3];
    if (!Number.isFinite(result))
      throw new Error("Unresolved scalar spline arithmetic");
    return result;
  }

  /**
   * Resolve dy/dx at finite, strictly increasing matching stations; two points use their common secant. Equal or opposite-sign neighboring secants give a zero interior derivative.
   *
   * @evidence contracts/common.md#principled-implementation Secants and interval widths feed the shared Fritsch–Butland weighted harmonic and endpoint-limited slope operation.
   * @evidence contracts/common.md#clear-and-simple-design Admission and coordinate-to-secant conversion precede the independently reusable slope kernel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite secants and nonpositive intervals reject; the function does not substitute a monotone interpolator with a different endpoint rule.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes derivative units, the two-point case and sign-change treatment.
   * @evidence contracts/performance.md#efficient-algorithms Two linear array passes prepare widths and secants, followed by the linear slope kernel.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result is the reusable slope vector; mutable caller data do not receive a retained cross-call verdict.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary widths and secants expire on return; only the new slope array transfers to the caller.
   */
  public static slopes(
    xs: readonly number[],
    values: readonly number[],
  ): number[] {
    if (xs.length < 2 || xs.length !== values.length)
      throw new Error("Matching station values required");
    const h: number[] = xs
      .slice(1)
      .map((x: number, i: number): number => x - xs[i]!);
    const m: number[] = values
      .slice(1)
      .map((y: number, i: number): number => (y - values[i]!) / h[i]!);
    if (
      ![...xs, ...values, ...m].every(Number.isFinite) ||
      h.some((x: number): boolean => x <= 0)
    )
      throw new Error("Finite increasing spline coordinates required");
    return AutoMoviePchip64.fromSecants(h, m);
  }

  /**
   * Resolve slopes from one or more corresponding positive interval widths and finite secants; these are admitted premises owned by slopes() or the vector coefficient constructor. Output has one more entry than the interval arrays.
   *
   * @evidence contracts/common.md#principled-implementation Interior weights are 2hNext+hPrevious and hNext+2hPrevious; one-sided endpoint estimates retain the adjacent secant's sign and three-times bound.
   * @evidence contracts/common.md#clear-and-simple-design Scalar and vector coefficient producers share this one numerical slope rule without sharing their domain-evaluation policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This low-level operation requires admitted widths/secants and performs no anatomy-dependent tangent override.
   * @evidence contracts/common.md#meaningful-documentation States the prevalidated array contract and the number of returned station slopes.
   * @evidence contracts/performance.md#efficient-algorithms One slope per station is computed in O(n), with fixed endpoint calculations.
   * @evidence contracts/performance.md#reuse-equivalent-work Vector callers reuse their already computed secants rather than rebuild coordinate differences for each derivative query.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The new output array owns scalar slopes only and retains neither supplied array.
   */
  public static fromSecants(
    h: readonly number[],
    m: readonly number[],
  ): number[] {
    if (h.length === 1) return [m[0]!, m[0]!];
    const d: number[] = new Array<number>(h.length + 1).fill(0);
    for (let i: number = 1; i < h.length; i++) {
      if (
        m[i - 1] === 0 ||
        m[i] === 0 ||
        Math.sign(m[i - 1]!) !== Math.sign(m[i]!)
      )
        continue;
      const w1: number = 2 * h[i]! + h[i - 1]!;
      const w2: number = h[i]! + 2 * h[i - 1]!;
      d[i] = (w1 + w2) / (w1 / m[i - 1]! + w2 / m[i]!);
    }
    d[0] = AutoMoviePchip64.edge(h[0]!, h[1]!, m[0]!, m[1]!);
    d[d.length - 1] = AutoMoviePchip64.edge(
      h.at(-1)!,
      h.at(-2)!,
      m.at(-1)!,
      m.at(-2)!,
    );
    return d;
  }

  /**
   * Apply scalar slope resolution to corresponding three-component nodes in each station row; finite matching rows with at least two increasing stations are caller premises.
   *
   * @evidence contracts/common.md#principled-implementation Independent scalar PCHIP slopes are computed per node and coordinate, preserving the original component order.
   * @evidence contracts/common.md#clear-and-simple-design The nested layout adapter shares scalar admission and limiting rather than introducing a second vector slope formula.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It performs no spatial tangent normalization, axis fitting or per-node sample fitting.
   * @evidence contracts/common.md#meaningful-documentation Identifies the station/node/coordinate ordering and corresponding-row premise.
   * @evidence contracts/performance.md#efficient-algorithms For S stations and N nodes, three scalar columns per node take O(SN) work and output storage.
   * @evidence contracts/performance.md#reuse-equivalent-work One derivative field is returned for downstream coefficient construction; later curve evaluation need not repeat the slope solve.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary component columns are released and returned triples do not alias the supplied station rows.
   */
  public static fieldSlopes(
    xs: readonly number[],
    rows: readonly (readonly (readonly number[])[])[],
  ): [number, number, number][][] {
    const out: [number, number, number][][] = rows.map(
      (row: readonly (readonly number[])[]): [number, number, number][] =>
        row.map((): [number, number, number] => [0, 0, 0]),
    );
    for (let node: number = 0; node < rows[0]!.length; node++)
      for (let axis: number = 0; axis < 3; axis++) {
        const ds: number[] = AutoMoviePchip64.slopes(
          xs,
          rows.map(
            (row: readonly (readonly number[])[]): number => row[node]![axis]!,
          ),
        );
        ds.forEach((d: number, i: number): void => {
          out[i]![node]![axis] = d;
        });
      }
    return out;
  }

  /** Limit the endpoint derivative to the first secant sign and its three-times bound across a sign change. */
  private static edge(h0: number, h1: number, m0: number, m1: number): number {
    const d: number = ((2 * h0 + h1) * m0 - h0 * m1) / (h0 + h1);
    if (Math.sign(d) !== Math.sign(m0)) return 0;
    return Math.sign(m0) !== Math.sign(m1) && Math.abs(d) > 3 * Math.abs(m0)
      ? 3 * m0
      : d;
  }
}
