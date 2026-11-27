import type { IAutoMovieRecoveryChartBoxSolve } from "@automovie/interface";

/*
 * Minimize sum_axis(0.5*x' H x - rhs' x) on the supplied original control box.
 * H is an exactly symmetric sparse positive-semidefinite Gram matrix supplied
 * by the caller. This helper validates finite entries, distinct sparse
 * addresses, reciprocal symmetry and nonnegative diagonals; it does not certify
 * PSD or rank. An exactly zero diagonal requires an exactly zero row and three
 * zero RHS entries. Such an unseen coordinate uses scale one and retains its
 * feasible initial value.
 *
 * Dii=1/sqrt(Hii), x=Dy, Hs=DHD and bs=Db give the same real-arithmetic
 * objective and box after scaling. FISTA projects in y, with objective-based
 * momentum restarts. Numeric scaling is binary64; failed finite/feasible
 * transformations throw rather than adding a regularizer or perturbing H.
 * Active bounds retain original endpoints. Termination uses the original
 * infinity norm of G_L(x)=L*(x-proj(x-gradient/L)). An equivalent component
 * formula avoids cancellation of two nearly equal x values. The best finite
 * feasible original objective is returned, with its own gradient metric;
 * exhausting the attempt budget is not convergence. Iterations counts all
 * projected proposals, including rejected momentum attempts. Empty systems
 * return empty. The attempt budget is a positive safe integer and gradient
 * tolerance is finite and nonnegative. Reported gradients/objectives are
 * binary64 evaluations, not exact KKT, uniqueness, eigenvalue or geometric
 * accuracy certificates. Optional initialValues are copied original normalized
 * coordinates, interleaved by three axes per control. They must be finite and
 * feasible without clipping; omission starts at projected zero.
 * initialObjective records their original Q, and every invocation starts with
 * fresh momentum and retains that feasible best.
 */
export function RecoveryChartBoxSolve(
  input: Parameters<IAutoMovieRecoveryChartBoxSolve.Operation>[0],
): ReturnType<IAutoMovieRecoveryChartBoxSolve.Operation> {
  const count: number = input.hessian.length,
    width: number = 3 * count;
  if (
    input.rhs.length !== width ||
    input.lower.length !== 3 ||
    input.upper.length !== 3 ||
    input.lower.some(
      (value: number, k: number): boolean => value > input.upper[k]!,
    ) ||
    input.maxIterations < 1 ||
    !(input.gradientTolerance >= 0)
  )
    throw new Error(
      "Box solve requires finite dimensions, bounds, RHS and explicit iteration/gradient budgets",
    );
  if (
    input.initialValues !== undefined &&
    (input.initialValues.length !== width ||
      Array.from(input.initialValues).some(
        (value: number, i: number): boolean =>
          value < input.lower[i % 3]! || value > input.upper[i % 3]!,
      ))
  )
    throw new Error(
      "Initial values require exactly three finite feasible original coordinates per control",
    );
  const rows: Map<number, number>[] = input.hessian.map(
    (entries: readonly (readonly [number, number])[]): Map<number, number> => {
      const row: Map<number, number> = new Map();
      for (const entry of entries) {
        const [j, value]: readonly [number, number] = entry;
        if (entry.length !== 2 || j < 0 || j >= count || row.has(j))
          throw new Error(
            "Sparse Gram entries need unique valid addresses and finite values",
          );
        row.set(j, value);
      }
      return row;
    },
  );
  const scales: Float64Array = new Float64Array(count);
  let minimumPositiveDiagonal: number | null = null,
    maximumDiagonal: number = 0,
    originalLipschitz: number = 0;
  for (let i: number = 0; i < count; i++) {
    const diagonal: number = rows[i]!.get(i) ?? 0;
    if (diagonal < 0)
      throw new Error("A PSD Gram premise requires nonnegative diagonals");
    if (
      diagonal === 0 &&
      ([...rows[i]!.values()].some((value: number): boolean => value !== 0) ||
        [0, 1, 2].some((k: number): boolean => input.rhs[3 * i + k] !== 0))
    )
      throw new Error(
        "A zero Gram diagonal must be an unseen exact zero row with zero RHS",
      );
    scales[i] = diagonal > 0 ? 1 / Math.sqrt(diagonal) : 1;
    if (!(scales[i]! > 0))
      throw new Error("Diagonal congruence scale is unrepresentable");
    if (diagonal > 0)
      minimumPositiveDiagonal =
        minimumPositiveDiagonal === null
          ? diagonal
          : Math.min(minimumPositiveDiagonal, diagonal);
    maximumDiagonal = Math.max(maximumDiagonal, diagonal);
    let sum: number = 0;
    for (const [j, value] of rows[i]!) {
      if ((rows[j]!.get(i) ?? 0) !== value)
        throw new Error(
          "Gram reciprocity must be exactly symmetric before scaling",
        );
      sum += Math.abs(value);
    }
    originalLipschitz = Math.max(originalLipschitz, sum);
  }
  const scaled: [number, number][][] = rows.map(
    (row: Map<number, number>, i: number): [number, number][] =>
      [...row].map(([j, value]: [number, number]): [number, number] => {
        // Reciprocal entries use one order; the larger scale first avoids premature
        // underflow when the two diagonal scales are very different.
        const coefficient: number =
          value *
          Math.max(scales[i]!, scales[j]!) *
          Math.min(scales[i]!, scales[j]!);
        if (
          (value !== 0 && coefficient === 0) ||
          coefficient === Infinity ||
          coefficient === -Infinity
        )
          throw new Error("Scaled Gram entry is unrepresentable");
        return [j, coefficient];
      }),
  );
  let scaledLipschitz: number = 0;
  for (const row of scaled) {
    let sum: number = 0;
    for (const [, value] of row) sum += Math.abs(value);
    scaledLipschitz = Math.max(scaledLipschitz, sum);
  }
  const scaledRhs: Float64Array = Float64Array.from(
    input.rhs,
    (value: number, i: number): number => value * scales[Math.floor(i / 3)]!,
  );
  const lo: Float64Array = Float64Array.from(
    { length: width },
    (_: unknown, i: number): number =>
      input.lower[i % 3]! / scales[Math.floor(i / 3)]!,
  );
  const hi: Float64Array = Float64Array.from(
    { length: width },
    (_: unknown, i: number): number =>
      input.upper[i % 3]! / scales[Math.floor(i / 3)]!,
  );
  if (
    [scaledRhs, lo, hi].some((vector: Float64Array): boolean =>
      vector.some(
        (value: number): boolean => value === Infinity || value === -Infinity,
      ),
    ) ||
    scaledRhs.some(
      (value: number, i: number): boolean => value === 0 && input.rhs[i] !== 0,
    ) ||
    lo.some(
      (value: number, i: number): boolean =>
        (value === 0 && input.lower[i % 3] !== 0) ||
        (hi[i] === 0 && input.upper[i % 3] !== 0) ||
        (value === hi[i] && input.lower[i % 3] !== input.upper[i % 3]),
    )
  )
    throw new Error("Scaled RHS or box is unrepresentable");

  // Original qualification never subtracts nearly equal projected coordinates.
  const metric: (values: Float64Array, gradient: Float64Array) => number = (
    values: Float64Array,
    gradient: Float64Array,
  ): number => {
    let result: number = 0;
    for (let i: number = 0; i < width; i++) {
      const g: number = gradient[i]!,
        available: number =
          g > 0
            ? values[i]! - input.lower[i % 3]!
            : input.upper[i % 3]! - values[i]!;
      result = Math.max(
        result,
        Math.min(Math.abs(g), originalLipschitz * available),
      );
    }
    return result;
  };
  const evaluate: (values: Float64Array, gradient: Float64Array) => number = (
    values: Float64Array,
    gradient: Float64Array,
  ): number => {
    let objective: number = 0;
    for (let i: number = 0; i < count; i++)
      for (let k: number = 0; k < 3; k++) {
        let product: number = 0;
        for (const [j, coefficient] of rows[i]!)
          product += coefficient * values[3 * j + k]!;
        const at: number = 3 * i + k;
        gradient[at] = product - input.rhs[at]!;
        objective += values[at]! * (product / 2 - input.rhs[at]!);
        if (
          [product, gradient[at]!, objective].some(
            (value: number): boolean =>
              value === Infinity || value === -Infinity,
          )
        )
          throw new Error("Original quadratic evaluation is unrepresentable");
      }
    return objective;
  };
  const current: Float64Array =
    input.initialValues === undefined
      ? Float64Array.from({ length: width }, (_: unknown, i: number): number =>
          Math.max(input.lower[i % 3]!, Math.min(input.upper[i % 3]!, 0)),
        )
      : Float64Array.from(input.initialValues);
  let y: Float64Array = Float64Array.from(
      current,
      (value: number, i: number): number => value / scales[Math.floor(i / 3)]!,
    ),
    search: Float64Array = y.slice(),
    momentum: number = 1;
  const originalGradient: Float64Array = new Float64Array(width),
    scaledGradient: Float64Array = new Float64Array(width);
  const initialObjective: number = evaluate(current, originalGradient);
  let objective: number = initialObjective,
    bestObjective: number = objective,
    best: Float64Array = current.slice(),
    bestMetric: number = metric(current, originalGradient);
  let iterations: number = 0,
    restarts: number = 0;
  while (
    iterations < input.maxIterations &&
    bestMetric > input.gradientTolerance &&
    scaledLipschitz > 0
  ) {
    for (let i: number = 0; i < count; i++)
      for (let k: number = 0; k < 3; k++) {
        let product: number = 0;
        for (const [j, coefficient] of scaled[i]!)
          product += coefficient * search[3 * j + k]!;
        scaledGradient[3 * i + k] = product - scaledRhs[3 * i + k]!;
      }
    const next: Float64Array = new Float64Array(width),
      nextY: Float64Array = new Float64Array(width);
    for (let i: number = 0; i < width; i++) {
      const raw: number = search[i]! - scaledGradient[i]! / scaledLipschitz;
      // Projection onto an active scaled bound publishes the original endpoint.
      next[i] =
        raw <= lo[i]!
          ? input.lower[i % 3]!
          : raw >= hi[i]!
            ? input.upper[i % 3]!
            : raw * scales[Math.floor(i / 3)]!;
      if (next[i]! < input.lower[i % 3]! || next[i]! > input.upper[i % 3]!)
        throw new Error(
          "Scaled proposal cannot represent a feasible original control",
        );
      nextY[i] = next[i]! / scales[Math.floor(i / 3)]!;
    }
    const nextObjective: number = evaluate(next, originalGradient),
      nextMetric: number = metric(next, originalGradient);
    iterations++;
    if (
      nextObjective < bestObjective ||
      (nextObjective === bestObjective && nextMetric < bestMetric)
    ) {
      best = next.slice();
      bestObjective = nextObjective;
      bestMetric = nextMetric;
    }
    if (nextObjective > objective && momentum !== 1) {
      search = y.slice();
      momentum = 1;
      restarts++;
      continue;
    }
    const nextMomentum: number =
        (1 + Math.sqrt(1 + 4 * momentum * momentum)) / 2,
      beta: number = (momentum - 1) / nextMomentum;
    search = Float64Array.from(
      nextY,
      (value: number, i: number): number => value + beta * (value - y[i]!),
    );
    y = nextY;
    objective = nextObjective;
    momentum = nextMomentum;
  }
  const returnedObjective: number = evaluate(best, originalGradient),
    projectedGradient: number = metric(best, originalGradient);
  return {
    values: best,
    iterations,
    projectedGradient,
    restarts,
    objective: returnedObjective,
    initialObjective,
    minimumPositiveDiagonal,
    maximumDiagonal,
    originalLipschitz,
    scaledLipschitz,
  };
}
