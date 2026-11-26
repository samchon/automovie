import { evaluatePchipPowers } from "./internal/evaluatePchipPowers";
import { isDenseFinite } from "./internal/isDenseFinite";
import { readPchipWidths } from "./internal/readPchipWidths";
import { resolvePchipPowers } from "./internal/resolvePchipPowers";

/**
 * A scalar piecewise cubic with Fritsch–Butland slope seeds, in arbitrary
 * consistent coordinate and value units. Explicit derivatives replace those
 * seeds. Evaluation rejects extrapolation and chooses the right interval at
 * interior knots.
 */
export class AutoMovieEnginePchip64 {
  /**
   * Resolve powers from finite values and derivatives per coordinate unit.
   * Coordinates are snapshotted for the scalar evaluator's lifetime.
   */
  public constructor(
    xs: readonly number[],
    values: readonly number[],
    derivatives?: readonly number[],
  ) {
    const widths: number[] = readPchipWidths(xs);
    if (values.length !== xs.length || !isDenseFinite(values))
      throw new Error("Matching finite spline values required");
    const secants: number[] = stationSecants(widths, values);
    const resolved: readonly number[] =
      derivatives ?? AutoMovieEnginePchip64.fromSecants(widths, secants);
    if (resolved.length !== xs.length || !isDenseFinite(resolved))
      throw new Error("Matching finite spline derivatives required");
    this.xs = Object.freeze(Array.from(xs));
    this.coefficients = widths.map(
      (width: number, i: number): [number, number, number, number] =>
        resolvePchipPowers(
          width,
          secants[i]!,
          values[i]!,
          resolved[i]!,
          resolved[i + 1]!,
        ),
    );
  }

  /**
   * Evaluate inside the closed coordinate range. Derivative output has value
   * units per coordinate unit. Nonfinite inputs and results throw.
   */
  public at(x: number, derivative: boolean = false): number {
    if (!Number.isFinite(x) || x < this.xs[0]! || x > this.xs.at(-1)!)
      throw new Error("Outside finite scalar spline coordinate range");
    let i: number = 0;
    while (i < this.xs.length - 2 && x >= this.xs[i + 1]!) i++;
    return evaluatePchipPowers(
      this.coefficients[i]!,
      x - this.xs[i]!,
      derivative ? 1 : 0,
    );
  }

  /**
   * Resolve dy/dx at finite, strictly increasing matching stations. Two points
   * use their common secant. Zero or opposite-sign adjacent secants give a zero
   * interior derivative.
   */
  public static slopes(xs: readonly number[], values: readonly number[]): number[] {
    const widths: number[] = readPchipWidths(xs);
    if (values.length !== xs.length || !isDenseFinite(values))
      throw new Error("Matching finite spline values required");
    return AutoMovieEnginePchip64.fromSecants(widths, stationSecants(widths, values));
  }

  /**
   * Resolve slopes from corresponding positive finite interval widths and
   * finite secants. The result has one more entry than the interval arrays.
   * Unrepresentable arithmetic throws.
   */
  public static fromSecants(h: readonly number[], m: readonly number[]): number[] {
    if (
      h.length === 0 ||
      h.length !== m.length ||
      !isDenseFinite(h) ||
      !isDenseFinite(m) ||
      h.some((width: number): boolean => width <= 0)
    )
      throw new Error("Positive finite widths and matching finite secants required");
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
    d[0] = AutoMovieEnginePchip64.edge(h[0]!, h[1]!, m[0]!, m[1]!);
    d[d.length - 1] = AutoMovieEnginePchip64.edge(
      h.at(-1)!,
      h.at(-2)!,
      m.at(-1)!,
      m.at(-2)!,
    );
    if (!isDenseFinite(d))
      throw new Error("Spline slopes must be finite");
    return d;
  }

  /**
   * Apply scalar slope resolution to corresponding three-component nodes in
   * each station row. Station coordinates and every component must be finite.
   */
  public static fieldSlopes(
    xs: readonly number[],
    rows: readonly (readonly (readonly number[])[])[],
  ): [number, number, number][][] {
    const widths: number[] = readPchipWidths(xs);
    const size: number | undefined = rows[0]?.length;
    if (rows.length !== xs.length || size === undefined || size === 0)
      throw new Error("Matching spline field rows required");
    for (const row of rows) {
      if (row?.length !== size)
        throw new Error("Matching spline field rows required");
      for (const node of row)
        if (node?.length !== 3 || !isDenseFinite(node))
          throw new Error("Finite three-component spline nodes required");
    }
    const out: [number, number, number][][] = rows.map(
      (row: readonly (readonly number[])[]): [number, number, number][] =>
        row.map((): [number, number, number] => [0, 0, 0]),
    );
    for (let node: number = 0; node < size; node++)
      for (let axis: number = 0; axis < 3; axis++) {
        const values: number[] = rows.map(
          (row: readonly (readonly number[])[]): number => row[node]![axis]!,
        );
        const ds: number[] = AutoMovieEnginePchip64.fromSecants(
          widths,
          stationSecants(widths, values),
        );
        ds.forEach((d: number, i: number): void => {
          out[i]![node]![axis] = d;
        });
      }
    return out;
  }

  /** Powers relative to each interval start. */
  private readonly coefficients: readonly (readonly [
    number,
    number,
    number,
    number,
  ])[];

  /** Owned coordinate snapshot used by admission and evaluation. */
  private readonly xs: readonly number[];

  /** Limit the endpoint to the first secant sign and its three-times bound. */
  private static edge(h0: number, h1: number, m0: number, m1: number): number {
    const width: number = h0 + h1;
    const d: number = ((2 * h0 + h1) * m0 - h0 * m1) / width;
    if (!Number.isFinite(width) || !Number.isFinite(d))
      throw new Error("Spline endpoint slopes must be finite");
    if (Math.sign(d) !== Math.sign(m0)) return 0;
    return Math.sign(m0) !== Math.sign(m1) && Math.abs(d) > 3 * Math.abs(m0)
      ? 3 * m0
      : d;
  }
}

/** Convert finite ordered stations to the segment secants. */
function stationSecants(widths: readonly number[], values: readonly number[]): number[] {
  return widths.map(
    (width: number, i: number): number => (values[i + 1]! - values[i]!) / width,
  );
}
