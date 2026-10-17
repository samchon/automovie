import { AutoMoviePchipField64 } from "./AutoMoviePchipField64";

/**
 * Componentwise interpolation preserving the first PCHIP interval and constructing a C2 clamped cubic on the remaining stations. Tail endpoint derivatives come from the same PCHIP seed; with fewer than four stations all seed intervals remain unchanged. Coordinates and values use consistent caller-owned units.
 *
 * @evidence contracts/common.md#principled-implementation A tridiagonal second-derivative solve interpolates the tail values and clamps its endpoint derivatives to the original componentwise monotone field.
 * @evidence contracts/common.md#clear-and-simple-design The first support interval is copied and the same exposed power-coefficient layout serves both seed and C2 tail queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No anatomical station, fit, tangent normalization or extrema guarantee is embedded in the spline kernel.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the preserved first interval, C2 tail, seeded end derivatives, small-input behavior and extrapolation policy.
 * @evidence contracts/performance.md#efficient-algorithms For S stations and D components, a tridiagonal solve takes O(SD) work and stored coefficients.
 * @evidence contracts/performance.md#reuse-equivalent-work The initial PCHIP field supplies endpoint derivatives and unchanged coefficients once per construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Instances retain caller-owned coordinates and newly owned coefficients; all tridiagonal work arrays expire after construction.
 */
export class AutoMovieClampedTailField64 {
  /** Per-interval descending cubic coefficients in the supplied ordinate units. */
  public readonly coefficients: number[][][];

  /** Construct a seeded clamped tail per component on finite strictly increasing coordinates. */
  public constructor(
    /** Ordered coordinates including the first interval retained as derivative support. */
    public readonly x: readonly number[],

    /** Equal-length finite component vectors at those coordinates. */
    values: readonly (readonly number[])[],
  ) {
    const original: AutoMoviePchipField64 = new AutoMoviePchipField64(
      x,
      values,
    );
    this.coefficients = structuredClone(original.coefficients);
    const n: number = x.length - 1;
    if (n < 3) return;
    const h: number[] = x
      .slice(2)
      .map((v: number, i: number): number => v - x[i + 1]!);
    for (let k: number = 0; k < values[0]!.length; k++) {
      const slopes: number[] = h.map(
        (w: number, i: number): number =>
          (values[i + 2]![k]! - values[i + 1]![k]!) / w,
      );
      const lower: number[] = new Array<number>(n).fill(0);
      const diagonal: number[] = new Array<number>(n).fill(0);
      const upper: number[] = new Array<number>(n).fill(0);
      const rhs: number[] = new Array<number>(n).fill(0);
      const start: number = original.at(x[1]!, true)[k]!;
      const end: number = original.at(x.at(-1)!, true)[k]!;
      diagonal[0] = 2 * h[0]!;
      upper[0] = h[0]!;
      rhs[0] = 6 * (slopes[0]! - start);
      for (let i: number = 1; i < n - 1; i++) {
        lower[i] = h[i - 1]!;
        diagonal[i] = 2 * (h[i - 1]! + h[i]!);
        upper[i] = h[i]!;
        rhs[i] = 6 * (slopes[i]! - slopes[i - 1]!);
      }
      lower[n - 1] = h.at(-1)!;
      diagonal[n - 1] = 2 * h.at(-1)!;
      rhs[n - 1] = 6 * (end - slopes.at(-1)!);
      for (let i: number = 1; i < n; i++) {
        const q: number = lower[i]! / diagonal[i - 1]!;
        diagonal[i] = diagonal[i]! - q * upper[i - 1]!;
        rhs[i] = rhs[i]! - q * rhs[i - 1]!;
      }
      const second: number[] = new Array<number>(n).fill(0);
      second[n - 1] = rhs[n - 1]! / diagonal[n - 1]!;
      for (let i: number = n - 2; i >= 0; i--)
        second[i] = (rhs[i]! - upper[i]! * second[i + 1]!) / diagonal[i]!;
      for (let i: number = 0; i < n - 1; i++) {
        const slope: number =
          i === 0
            ? start
            : slopes[i]! - (h[i]! * (2 * second[i]! + second[i + 1]!)) / 6;
        this.coefficients[i + 1]![k] = [
          (second[i + 1]! - second[i]!) / (6 * h[i]!),
          second[i]! / 2,
          slope,
          values[i + 1]![k]!,
        ];
      }
    }
    if (!this.coefficients.flat(2).every(Number.isFinite))
      throw new Error("Finite clamped tail coefficients required");
  }

  /**
   * Evaluate the value or derivative per coordinate unit; outside queries extrapolate the first or last polynomial and interior knots select the right interval.
   *
   * @evidence contracts/common.md#principled-implementation Horner arithmetic evaluates the retained cubic or its analytic first derivative in the selected local interval.
   * @evidence contracts/common.md#clear-and-simple-design Query kinds share interval selection and the coefficient array.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no endpoint clamp, refit or coordinate normalization during evaluation.
   * @evidence contracts/common.md#meaningful-documentation States derivative units, extrapolation and interior-knot interval selection.
   * @evidence contracts/performance.md#efficient-algorithms A linear station search and O(D) Horner evaluation use existing coefficients.
   * @evidence contracts/performance.md#reuse-equivalent-work Every query uses the constructor's coefficients without another slope or tridiagonal solve.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned component array escapes; no query history is retained.
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
