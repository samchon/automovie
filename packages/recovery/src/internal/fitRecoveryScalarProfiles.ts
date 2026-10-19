/**
 * Fit co-charted scalar profiles in one clamped uniform cubic B-spline space.
 * Unpivoted Householder QR acts on the original design and all right-hand sides;
 * the diagonal ratio is an operational rank test, not a certified condition.
 * Endpoint values and derivatives convert each polynomial interval exactly to
 * Bernstein controls before binary64 rounding. Input coordinates/values use
 * millimetres; returned physical intervals and controls use metres.
 *
 * @evidence contracts/common.md#principled-implementation Cox-de Boor basis evaluation, one Householder factorization and triangular solves fit the original scalar observations. Endpoint jets determine the exact cubic Bernstein representation of each knot interval without a dense sampled recipe.
 * @evidence contracts/common.md#clear-and-simple-design This shared recovery algebra owner serves different image-section hypotheses; callers retain family admission, positivity, physical meaning and residual checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normal-equation inverse, expected coefficient, ridge term, endpoint clamp or dropped scalar field supplies a fit; unresolved rank and nonfinite coefficients refuse.
 * @evidence contracts/common.md#meaningful-documentation States physical units, cubic knot space, shared factorization, exact polynomial conversion, operational rank limits and caller-owned field semantics.
 * @evidence contracts/performance.md#efficient-algorithms For N rows, K=spans+3 coefficients and F fields, dense QR costs O(N K squared + N K F), retaining O(N K + N F). Bernstein conversion costs O(spans K F) for fixed degree three.
 * @evidence contracts/performance.md#reuse-equivalent-work The original design and all F right-hand sides use contiguous binary64 columns, so each Householder target scans one vector without per-row layout branches. Arithmetic order is unchanged; all F fields share basis values and reflectors; each previous interval supplies the exact shared endpoint coefficient of its successor.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Design/right-hand-side scratch expires synchronously; only O(spans F) controls and the scalar rank diagnostic transfer, without a global cache, image or file handle.
 */
export function fitRecoveryScalarProfiles(
  samples: readonly { yMm: number; values: readonly number[] }[],
  spans: number,
  minimumRankRatio: number,
): {
  spans: {
    interval: [number, number];
    profiles: [number, number, number, number][];
  }[];
  rankRatio: number;
} {
  const fields: number = samples[0]?.values.length ?? 0;
  if (
    !fields ||
    samples.some(
      (sample: (typeof samples)[number]): boolean =>
        sample.values.length !== fields ||
        !sample.values.every(Number.isFinite),
    )
  )
    throw new Error("Complete finite scalar profile rows required");
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
  const matrix: Float64Array[] = Array.from(
    { length: count },
    (): Float64Array => new Float64Array(samples.length),
  );
  const right: Float64Array[] = Array.from(
    { length: fields },
    (): Float64Array => new Float64Array(samples.length),
  );
  for (let row: number = 0; row < samples.length; row++) {
    const weights: number[] = basis(
      knots,
      3,
      (samples[row].yMm - lower) / length,
    );
    for (let column: number = 0; column < count; column++)
      matrix[column][row] = weights[column];
    for (let field: number = 0; field < fields; field++)
      right[field][row] = samples[row].values[field];
  }
  let maximum: number = 0,
    minimum: number = Infinity;
  for (let column: number = 0; column < count; column++) {
    let norm: number = 0;
    const current: Float64Array = matrix[column];
    for (let row: number = column; row < samples.length; row++)
      norm = Math.hypot(norm, current[row]);
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
    const alpha: number = current[column] >= 0 ? -norm : norm;
    const reflector: Float64Array = new Float64Array(samples.length - column);
    let squared: number = 0;
    for (let row: number = column; row < samples.length; row++) {
      const value: number = current[row] - (row === column ? alpha : 0);
      reflector[row - column] = value;
      squared += value * value;
    }
    if (!(squared > 0) || !Number.isFinite(squared))
      throw new Error("nonfinite-fit: unresolved Householder reflector");
    for (let target: number = column + 1; target < count + fields; target++) {
      const values: Float64Array =
        target < count ? matrix[target] : right[target - count];
      let dot: number = 0;
      for (let row: number = column; row < samples.length; row++)
        dot += reflector[row - column] * values[row];
      const factor: number = (2 * dot) / squared;
      for (let row: number = column; row < samples.length; row++)
        values[row] -= factor * reflector[row - column];
    }
    current[column] = alpha;
    for (let row: number = column + 1; row < samples.length; row++)
      current[row] = 0;
  }
  const profiles: number[][] = [];
  for (let field: number = 0; field < fields; field++) {
    const coefficients: number[] = new Array<number>(count).fill(0);
    for (let row: number = count - 1; row >= 0; row--) {
      let value: number = right[field][row];
      for (let column: number = row + 1; column < count; column++)
        value -= matrix[column][row] * coefficients[column];
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
  const result: {
    interval: [number, number];
    profiles: [number, number, number, number][];
  }[] = [];
  for (let index: number = 0; index < spans; index++) {
    const start: number = index / spans,
      end: number = (index + 1) / spans;
    const controls: [number, number, number, number][] = profiles.map(
      (profile: number[], field: number): [number, number, number, number] => {
        const previous: (typeof result)[number] | undefined = result.at(-1);
        const a: number = previous
          ? previous.profiles[field][3]
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
        (profile: number[]): boolean => !profile.every(Number.isFinite),
      )
    )
      throw new Error(
        "nonfinite-fit: Bernstein conversion exceeded finite coefficients",
      );
    result.push({
      interval: [
        index === 0 ? lower * 0.001 : result.at(-1)!.interval[1],
        (lower + length * end) * 0.001,
      ],
      profiles: controls,
    });
  }
  return { spans: result, rankRatio: minimum / maximum };
}
