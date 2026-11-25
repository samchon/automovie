import type { IAutoMoviePchipField64 } from "@automovie/interface";

import { AutoMoviePchip64 } from "./AutoMoviePchip64";

/**
 * Componentwise Fritsch–Butland interpolation with exposed local power
 * coefficients and station derivatives. Coordinates and component values use
 * caller-defined consistent units; queries outside the station range
 * extrapolate the first or last polynomial. Optional station or endpoint
 * derivatives replace the corresponding slope seeds without normalization or
 * unit conversion; those authored slopes can overshoot and do not retain the
 * default shape-preserving rule.
 */
export class AutoMoviePchipField64 {
  /**
   * Per-interval and per-component power coefficients [cubic, quadratic,
   * derivative, value] relative to the interval start.
   */
  public readonly coefficients: number[][][];

  /** Station derivatives in component units per coordinate unit. */
  public readonly derivatives: number[][];

  /**
   * Build finite coefficients on increasing coordinates with corresponding
   * equal-length component rows. Coordinate/value arrays must remain stable for
   * the field's lifetime; supplied derivatives are copied. Invalid supports,
   * slope shapes or nonfinite coefficients throw before an instance is
   * returned.
   */
  public constructor(
    /** Increasing coordinates in one caller-owned chart. */
    public readonly x: readonly number[],
    /** Finite component rows in fixed corresponding order. */
    public readonly y: readonly (readonly number[])[],
    /**
     * Component values per coordinate unit, either all station rows or selected
     * endpoint rows; omitted entries keep their original Fritsch–Butland seeds.
     * No spatial normalization or unit conversion occurs.
     */
    derivatives?: IAutoMoviePchipField64.Derivatives,
  ) {
    if (x.length < 2 || x.length !== y.length)
      throw new Error("PCHIP supports required");
    const dimension: number = y[0]!.length;
    for (let i: number = 0; i < x.length; ++i) {
      if (y[i]!.length !== dimension)
        throw new Error("Dense matching finite PCHIP supports required");
    }
    const h: number[] = x
      .slice(1)
      .map((v: number, i: number): number => v - x[i]!);
    if (h.some((v: number): boolean => v <= 0))
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
      if (row.length !== dimension)
        throw new Error("PCHIP derivative rows must match component count");
      this.derivatives[index] = Array.from(row);
    };
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
        throw new Error(
          "PCHIP endpoint derivatives need start/end component rows",
        );
      const ends: IAutoMoviePchipField64.IEndpointDerivatives =
        derivatives as IAutoMoviePchipField64.IEndpointDerivatives;
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
  }

  /**
   * Evaluate every component or its first/second derivative, selecting the
   * right interval at an interior knot. False/0 reads values, true/1 reads
   * first derivatives, and 2 reads second derivatives, in component units per
   * coordinate unit squared. Values outside the coordinate range extrapolate
   * the nearest interval; the caller owns a narrower supported domain when
   * needed. Nonfinite queries or generated results throw. Endpoint derivative
   * queries keep the existing Horner arithmetic and may differ from an authored
   * slope by rounding.
   */
  public at(value: number, derivative: boolean | 0 | 1 | 2 = false): number[] {
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
    return result;
  }
}
