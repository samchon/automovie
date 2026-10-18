import { AutoMoviePchip64 } from "./AutoMoviePchip64";

/**
 * Componentwise Fritsch–Butland interpolation with exposed local power coefficients and station derivatives. Coordinates and component values use caller-defined consistent units; queries outside the station range extrapolate the first or last polynomial. Optional station or endpoint derivatives replace the corresponding slope seeds without normalization or unit conversion; those authored slopes can overshoot and do not retain the default shape-preserving rule.
 *
 * @evidence contracts/common.md#principled-implementation Each component uses the same weighted harmonic and endpoint-limited scalar slopes unless explicitly replaced, then the same cubic Hermite power coefficients interpolate its supports and declared first derivatives. Authored slopes do not imply monotonicity.
 * @evidence contracts/common.md#clear-and-simple-design The coefficient field is separate from AutoMoviePchip64 because vector consumers need coefficient access and polynomial extrapolation rather than the scalar field's closed-domain query policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No spatial tangent normalization or anatomical coordinate convention modifies the componentwise interpolation.
 * @evidence contracts/common.md#meaningful-documentation States component ordering, derivative units, explicit slope authority, extrapolation and caller responsibility for stable supplied support arrays. Overrides are copied at construction.
 * @evidence contracts/performance.md#efficient-algorithms S stations with D components require O(SD) construction and coefficient storage; queries search stations and evaluate D cubics.
 * @evidence contracts/performance.md#reuse-equivalent-work Secants are computed once and passed to the shared slope kernel; the resulting coefficients serve every later query and coefficient consumer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains coordinate/value arrays, station derivatives and four coefficients per component per interval, with no global cache.
 */
export class AutoMoviePchipField64 {
  /** Per-interval and per-component power coefficients [cubic, quadratic, derivative, value] relative to the interval start. */
  public readonly coefficients: number[][][];

  /** Station derivatives in component units per coordinate unit. */
  public readonly derivatives: number[][];

  /** Build finite coefficients on increasing coordinates with corresponding equal-length component rows. Coordinate/value arrays must remain stable for the field's lifetime; supplied derivatives are copied. Invalid supports, slope shapes or nonfinite coefficients throw before an instance is returned. */
  public constructor(
    /** Increasing coordinates in one caller-owned chart. */
    public readonly x: readonly number[],
    /** Finite component rows in fixed corresponding order. */
    public readonly y: readonly (readonly number[])[],
    /** Component values per coordinate unit, either all station rows or selected endpoint rows; omitted entries keep their original Fritsch–Butland seeds. No spatial normalization or unit conversion occurs. */
    derivatives?:
      | readonly (readonly number[])[]
      | {
          start?: readonly number[];
          end?: readonly number[];
        },
  ) {
    if (
      x.length < 2 ||
      x.length !== y.length ||
      !y.flat().every(Number.isFinite)
    )
      throw new Error("Finite PCHIP supports required");
    if (!Array.isArray(y[0]))
      throw new Error("Dense PCHIP component rows required");
    const dimension: number = y[0]!.length;
    for (let i: number = 0; i < x.length; ++i) {
      const row: readonly number[] | undefined = y[i];
      if (
        !Number.isFinite(x[i]!) ||
        !Array.isArray(row) ||
        row.length !== dimension
      )
        throw new Error("Dense matching finite PCHIP supports required");
      for (let k: number = 0; k < dimension; ++k)
        if (!Number.isFinite(row[k]!))
          throw new Error("Dense matching finite PCHIP components required");
    }
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
    const replace: (index: number, row: readonly number[]) => void = (
      index: number,
      row: readonly number[],
    ): void => {
      if (!Array.isArray(row) || row.length !== dimension)
        throw new Error("PCHIP derivative rows must match component count");
      for (let k: number = 0; k < dimension; ++k)
        if (!Number.isFinite(row[k]!))
          throw new Error("PCHIP derivatives must be dense and finite");
      this.derivatives[index] = Array.from(row);
    };
    if (Array.isArray(derivatives)) {
      if (derivatives.length !== x.length)
        throw new Error("PCHIP derivatives need one row per station");
      for (let i: number = 0; i < x.length; ++i) replace(i, derivatives[i]!);
    } else if (derivatives !== undefined) {
      if (
        derivatives === null ||
        typeof derivatives !== "object" ||
        Object.keys(derivatives).some(
          (key: string): boolean => key !== "start" && key !== "end",
        )
      )
        throw new Error(
          "PCHIP endpoint derivatives need start/end component rows",
        );
      const ends: { start?: readonly number[]; end?: readonly number[] } =
        derivatives as {
          start?: readonly number[];
          end?: readonly number[];
        };
      if (ends.start !== undefined) replace(0, ends.start);
      if (ends.end !== undefined) replace(x.length - 1, ends.end);
    }
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
   * Evaluate every component or its first/second derivative, selecting the right interval at an interior knot. False/0 reads values, true/1 reads first derivatives, and 2 reads second derivatives, in component units per coordinate unit squared. Values outside the coordinate range extrapolate the nearest interval; the caller owns a narrower supported domain when needed. Nonfinite queries or generated results throw. Endpoint derivative queries keep the existing Horner arithmetic and may differ from an authored slope by rounding.
   *
   * @evidence contracts/common.md#principled-implementation The same retained local power coefficients produce values and their analytic first or second derivatives through Horner arithmetic; no independently fitted derivative field is introduced.
   * @evidence contracts/common.md#clear-and-simple-design One interval selection serves every component and both query kinds.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Extrapolation is explicit polynomial continuation, without hidden end clamps or spatial renormalization.
   * @evidence contracts/common.md#meaningful-documentation States backward-compatible boolean queries, explicit derivative orders, right-interval knot selection, extrapolation, units and endpoint rounding.
   * @evidence contracts/performance.md#efficient-algorithms Linear station search plus O(D) component evaluation, with no slope resolution in the query path.
   * @evidence contracts/performance.md#reuse-equivalent-work Queries share the constructor's coefficients, including when consumers query derivatives at the same station repeatedly.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned component array is allocated; no query coordinate or result is retained by the field.
   */
  public at(value: number, derivative: boolean | 0 | 1 | 2 = false): number[] {
    if (!Number.isFinite(value)) throw new Error("PCHIP query must be finite");
    if (
      derivative !== false &&
      derivative !== true &&
      derivative !== 0 &&
      derivative !== 1 &&
      derivative !== 2
    )
      throw new Error("PCHIP derivative order must be zero, one or two");
    let i: number = 0;
    while (i < this.x.length - 2 && value >= this.x[i + 1]!) i++;
    const s: number = value - this.x[i]!;
    const result: number[] = this.coefficients[i]!.map(
      (c: readonly number[]): number =>
        derivative === 2
          ? 6 * c[0]! * s + 2 * c[1]!
          : derivative
            ? (3 * c[0]! * s + 2 * c[1]!) * s + c[2]!
            : ((c[0]! * s + c[1]!) * s + c[2]!) * s + c[3]!,
    );
    if (!result.every(Number.isFinite))
      throw new Error("Unresolved vector PCHIP arithmetic");
    return result;
  }
}
