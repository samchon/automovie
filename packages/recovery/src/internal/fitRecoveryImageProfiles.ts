import type { IAutoMovieEllipticLoft } from "@automovie/interface";

/**
 * Fit four profiles in one clamped uniform cubic B-spline space and convert each
 * polynomial interval to Bernstein controls using its values and derivatives.
 * Unpivoted Householder QR is used on the actual design matrix, not normal
 * equations. A small diagonal relative to the largest rejects unresolved rank;
 * this operational test and its ratio are not a certified condition number.
 *
 * @evidence contracts/common.md#principled-implementation Cox-de Boor basis evaluation and Householder least squares fit all four fields in one full-rank spline space. Endpoint jets exactly determine the cubic Bernstein representation of each knot interval, preserving the selected spline rather than resampling a dense table.
 * @evidence contracts/common.md#clear-and-simple-design One inverse-fitting helper owns basis assembly, one QR for four right-hand sides and exact polynomial conversion; image classification and physical camera equations remain with their observation and fit owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No expected fixture coefficients, normal-equation regularizer, endpoint clamp, source mesh or dense recipe lookup supplies a result. Nonpositive radius controls and unresolved rank reject this candidate.
 * @evidence contracts/common.md#meaningful-documentation States cubic knot/basis choice, shared four-field factorization, operational rank limitation, metre conversion and coefficient rather than interpolation output.
 * @evidence contracts/performance.md#efficient-algorithms For N rows and K=spans+3 coefficients, dense Householder fitting costs O(N K squared) time and O(N K) storage; four right-hand sides reuse one factorization. Bernstein conversion costs O(spans K) with small fixed polynomial degree.
 * @evidence contracts/performance.md#reuse-equivalent-work All centre/radius fields share basis rows, reflectors and the same physical chart; only their transformed right-hand sides differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Design and reflector scratch die with this synchronous call; only O(spans) coefficient records and the diagonal ratio transfer, without global retention or file handles.
 */
export function fitRecoveryImageProfiles(
  samples: readonly { yMm: number; values: [number, number, number, number] }[],
  spans: number,
  minimumRankRatio: number,
): { loft: IAutoMovieEllipticLoft; rankRatio: number } {
  const count: number = spans + 3;
  if (samples.length < count || !Number.isSafeInteger(spans) || spans < 1)
    throw new Error(
      "insufficient-fit-support: more physical rows than spline coefficients required",
    );
  const lower: number = samples[0].yMm;
  const length: number = samples.at(-1)!.yMm - lower;
  if (!(length > 0) || !Number.isFinite(length))
    throw new Error(
      "invalid-fit-chart: a finite physical station interval is required",
    );
  const knots: number[] = [0, 0, 0, 0];
  for (let index: number = 1; index < spans; index++) knots.push(index / spans);
  knots.push(1, 1, 1, 1);
  const basis: (
    chart: readonly number[],
    degree: number,
    t: number,
  ) => number[] = (
    chart: readonly number[],
    degree: number,
    t: number,
  ): number[] => {
    const size: number = chart.length - degree - 1;
    if (t === 1) {
      const result: number[] = new Array<number>(size).fill(0);
      result[size - 1] = 1;
      return result;
    }
    let current: number[] = Array.from(
      { length: chart.length - 1 },
      (_: unknown, index: number): number =>
        chart[index] <= t && t < chart[index + 1] ? 1 : 0,
    );
    for (let order: number = 1; order <= degree; order++) {
      const next: number[] = new Array<number>(current.length - 1).fill(0);
      for (let index: number = 0; index < next.length; index++) {
        const a: number = chart[index + order] - chart[index];
        const b: number = chart[index + order + 1] - chart[index + 1];
        next[index] =
          (a > 0 ? ((t - chart[index]) / a) * current[index] : 0) +
          (b > 0
            ? ((chart[index + order + 1] - t) / b) * current[index + 1]
            : 0);
      }
      current = next;
    }
    return current;
  };
  const matrix: number[][] = samples.map(
    (sample: (typeof samples)[number]): number[] =>
      basis(knots, 3, (sample.yMm - lower) / length),
  );
  const right: number[][] = samples.map(
    (sample: (typeof samples)[number]): number[] => [...sample.values],
  );
  let maximum: number = 0,
    minimum: number = Infinity;
  for (let column: number = 0; column < count; column++) {
    let norm: number = 0;
    for (let row: number = column; row < matrix.length; row++)
      norm = Math.hypot(norm, matrix[row][column]);
    if (!(norm > 0) || !Number.isFinite(norm))
      throw new Error(
        "rank-deficient-fit: a spline column has no independent support",
      );
    maximum = Math.max(maximum, norm);
    minimum = Math.min(minimum, norm);
    if (minimum / maximum < minimumRankRatio)
      throw new Error(
        "ill-conditioned-fit: spline QR diagonal ratio is below the admitted threshold",
      );
    const alpha: number = matrix[column][column] >= 0 ? -norm : norm;
    const reflector: number[] = [];
    let squared: number = 0;
    for (let row: number = column; row < matrix.length; row++) {
      const value: number = matrix[row][column] - (row === column ? alpha : 0);
      reflector.push(value);
      squared += value * value;
    }
    if (!(squared > 0) || !Number.isFinite(squared))
      throw new Error("nonfinite-fit: unresolved Householder reflector");
    for (let target: number = column + 1; target < count + 4; target++) {
      let dot: number = 0;
      for (let row: number = column; row < matrix.length; row++)
        dot +=
          reflector[row - column] *
          (target < count ? matrix[row][target] : right[row][target - count]);
      const factor: number = (2 * dot) / squared;
      for (let row: number = column; row < matrix.length; row++)
        if (target < count)
          matrix[row][target] -= factor * reflector[row - column];
        else right[row][target - count] -= factor * reflector[row - column];
    }
    matrix[column][column] = alpha;
    for (let row: number = column + 1; row < matrix.length; row++)
      matrix[row][column] = 0;
  }
  const profiles: number[][] = [];
  for (let field: number = 0; field < 4; field++) {
    const coefficients: number[] = new Array<number>(count).fill(0);
    for (let row: number = count - 1; row >= 0; row--) {
      let value: number = right[row][field];
      for (let column: number = row + 1; column < count; column++)
        value -= matrix[row][column] * coefficients[column];
      coefficients[row] = value / matrix[row][row];
      if (!Number.isFinite(coefficients[row]))
        throw new Error("nonfinite-fit: spline coefficient overflow");
    }
    profiles.push(coefficients);
  }
  const value: (
    coefficients: readonly number[],
    t: number,
    derivative: boolean,
  ) => number = (
    coefficients: readonly number[],
    t: number,
    derivative: boolean,
  ): number => {
    const controls: readonly number[] = derivative
      ? coefficients
          .slice(1)
          .map(
            (next: number, index: number): number =>
              (3 * (next - coefficients[index])) /
              (knots[index + 4] - knots[index + 1]),
          )
      : coefficients;
    const weights: number[] = basis(
      derivative ? knots.slice(1, -1) : knots,
      derivative ? 2 : 3,
      t,
    );
    return controls.reduce(
      (sum: number, control: number, index: number): number =>
        sum + control * weights[index],
      0,
    );
  };
  const result: IAutoMovieEllipticLoft["spans"] = [];
  for (let index: number = 0; index < spans; index++) {
    const start: number = index / spans,
      end: number = (index + 1) / spans;
    const controls: [number, number, number, number][] = profiles.map(
      (profile: number[], field: number): [number, number, number, number] => {
        const previous: IAutoMovieEllipticLoft["spans"][number] | undefined =
          result.at(-1);
        const key: "radiusX" | "radiusZ" | "centreX" | "centreZ" = (
          ["radiusX", "radiusZ", "centreX", "centreZ"] as const
        )[field];
        const a: number = previous
          ? previous[key][3]
          : value(profile, start, false) * 0.001;
        const b: number = value(profile, end, false) * 0.001;
        return [
          a,
          a + (value(profile, start, true) * (end - start)) / 3000,
          b - (value(profile, end, true) * (end - start)) / 3000,
          b,
        ];
      },
    );
    if (
      controls.some(
        (profile: [number, number, number, number], field: number): boolean =>
          profile.some(
            (control: number): boolean =>
              !Number.isFinite(control) || (field < 2 && control <= 0),
          ),
      )
    )
      throw new Error(
        "unsupported-profile: fitted radius Bernstein controls must remain positive",
      );
    result.push({
      interval: [
        index === 0 ? lower * 0.001 : result.at(-1)!.interval[1],
        (lower + length * end) * 0.001,
      ],
      radiusX: controls[0],
      radiusZ: controls[1],
      centreX: controls[2],
      centreZ: controls[3],
    });
  }
  return { loft: { spans: result }, rankRatio: minimum / maximum };
}
