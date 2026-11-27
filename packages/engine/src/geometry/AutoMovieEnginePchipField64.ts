import { AutoMovieEnginePchip64 } from "./AutoMovieEnginePchip64";
import { evaluatePchipPowers } from "./curve/internal/evaluatePchipPowers";
import { isDenseFinite } from "./curve/internal/isDenseFinite";
import { readPchipWidths } from "./curve/internal/readPchipWidths";
import { resolvePchipPowers } from "./curve/internal/resolvePchipPowers";

/**
 * Componentwise Fritsch–Butland interpolation in one caller-defined coordinate
 * chart. Supports are cloned and frozen; supplied slopes can overshoot.
 */
export class AutoMovieEnginePchipField64 {
  /** Local [cubic, quadratic, derivative, value] powers by interval and component. */
  public readonly coefficients: number[][][];

  /** Station derivatives in component units per coordinate unit. */
  public readonly derivatives: number[][];

  /** Owned support snapshots, independent of caller mutation. */
  public readonly x: readonly number[];

  /** Deeply copied component rows used to resolve the owned field. */
  public readonly y: readonly (readonly number[])[];

  /**
   * Build a field from finite increasing supports with equal nonempty component
   * rows. Coordinate and value arrays are cloned and frozen. Supplied slopes
   * are copied. Invalid supports, slopes and powers throw.
   */
  public constructor(
    /** Increasing coordinates in one caller-owned chart. */
    x: readonly number[],
    /** Finite component rows in corresponding order. */
    y: readonly (readonly number[])[],
    derivatives?: AutoMovieEnginePchipField64.Derivatives,
  ) {
    this.x = Object.freeze(Array.from(x));
    this.y = Object.freeze(
      y.map((row: readonly number[]): readonly number[] =>
        Object.freeze(Array.from(row)),
      ),
    );
    const widths: number[] = readPchipWidths(x);
    const dimension: number | undefined = y[0]?.length;
    if (x.length !== y.length || dimension === undefined || dimension === 0)
      throw new Error("PCHIP supports required");
    for (const row of y)
      if (row?.length !== dimension || !isDenseFinite(row))
        throw new Error("Dense matching finite PCHIP supports required");
    const m: number[][] = widths.map((width: number, i: number): number[] =>
      y[i]!.map((v: number, k: number): number => (y[i + 1]![k]! - v) / width),
    );
    const columns: number[][] = y[0]!.map((_: number, k: number): number[] =>
      AutoMovieEnginePchip64.fromSecants(
        widths,
        m.map((row: number[]): number => row[k]!),
      ),
    );
    const resolved: number[][] = x.map((_: number, i: number): number[] =>
      columns.map((column: number[]): number => column[i]!),
    );
    function replace(index: number, row: readonly number[]): void {
      if (row?.length !== dimension || !isDenseFinite(row))
        throw new Error("PCHIP derivative rows must match finite components");
      resolved[index] = Array.from(row);
    }
    if (Array.isArray(derivatives)) {
      if (derivatives.length !== x.length)
        throw new Error("PCHIP derivatives need one row per station");
      for (let i: number = 0; i < x.length; ++i) replace(i, derivatives[i]!);
    } else if (derivatives !== undefined) {
      if (
        Object.keys(derivatives).some(
          (key: string): boolean => key !== "start" && key !== "end",
        )
      )
        throw new Error("PCHIP endpoint derivatives need start/end component rows");
      const ends: AutoMovieEnginePchipField64.IEndpointDerivatives =
        derivatives as AutoMovieEnginePchipField64.IEndpointDerivatives;
      if (ends.start !== undefined) replace(0, ends.start);
      if (ends.end !== undefined) replace(x.length - 1, ends.end);
    }
    this.derivatives = resolved;
    this.coefficients = widths.map((width: number, i: number): number[][] =>
      y[0]!.map((_: number, k: number): number[] =>
        resolvePchipPowers(width, m[i]![k]!, y[i]![k]!, resolved[i]![k]!, resolved[i + 1]![k]!),
      ),
    );
  }

  /**
   * Evaluate values (false/0), first derivatives (true/1) or second derivatives
   * (2). Interior knots choose the right interval. Queries beyond the support
   * extrapolate the closest polynomial. Nonfinite queries and results throw.
   */
  public at(value: number, derivative: boolean | 0 | 1 | 2 = false): number[] {
    if (!Number.isFinite(value))
      throw new Error("PCHIP query must be finite");
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
    const offset: number = value - this.x[i]!;
    const order: 0 | 1 | 2 = derivative === 2 ? 2 : derivative ? 1 : 0;
    return this.coefficients[i]!.map(
      (c: readonly number[]): number => evaluatePchipPowers(c, offset, order),
    );
  }
}

/** Construction-time slope overrides for the componentwise field. */
export namespace AutoMovieEnginePchipField64 {
  /** Endpoint slopes in component units per coordinate unit. */
  export interface IEndpointDerivatives {
    /** Optional slope row for the first station. */
    start?: readonly number[];

    /** Optional slope row for the last station. */
    end?: readonly number[];
  }

  /**
   * One slope row per station or selected endpoint rows. Each row follows
   * component order. An omitted endpoint keeps its Fritsch–Butland seed.
   */
  export type Derivatives =
    | readonly (readonly number[])[]
    | IEndpointDerivatives;
}
