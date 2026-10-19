/**
 * Minimize sum_axis(0.5*x' H x - rhs' x) on the supplied original control box.
 * H is an exactly symmetric sparse positive-semidefinite Gram matrix supplied
 * by the caller. This helper validates finite entries, distinct sparse addresses,
 * reciprocal symmetry and nonnegative diagonals; it does not certify PSD or rank.
 * An exactly zero diagonal requires an exactly zero row and three zero RHS entries.
 * Such an unseen coordinate uses scale one and retains its feasible initial value.
 *
 * Dii=1/sqrt(Hii), x=Dy, Hs=DHD and bs=Db give the same real-arithmetic objective
 * and box after scaling. FISTA projects in y, with objective-based momentum restarts.
 * Numeric scaling is binary64; failed finite/feasible transformations throw rather
 * than adding a regularizer or perturbing H. Active bounds retain original endpoints.
 * Termination uses the original infinity norm of G_L(x)=L*(x-proj(x-gradient/L)).
 * An equivalent component formula avoids cancellation of two nearly equal x values.
 * The best finite feasible original objective is returned, with its own gradient
 * metric; exhausting the attempt budget is not convergence. Iterations counts all
 * projected proposals, including rejected momentum attempts. Empty systems return empty.
 * The attempt budget is a positive safe integer and gradient tolerance is finite
 * and nonnegative. Reported gradients/objectives are binary64 evaluations, not
 * exact KKT, uniqueness, eigenvalue or geometric accuracy certificates.
 * Optional initialValues are copied original normalized coordinates, interleaved
 * by three axes per control. They must be finite and feasible without clipping;
 * omission starts at projected zero. initialObjective records their original Q,
 * and every invocation starts with fresh momentum and retains that feasible best.
 *
 * @evidence contracts/common.md#principled-implementation Positive diagonal congruence preserves the caller's PSD quadratic and coordinate box in real arithmetic. Exact symmetry/zero-row premises are admitted, scaled FISTA uses an absolute-row-sum estimate, objective restarts retain feasibility, and original projected-gradient termination remains independent of scaled progress or rank.
 * @evidence contracts/common.md#clear-and-simple-design One numerical helper owns sparse admission, diagonal scaling, projected iterations and original-coordinate qualification; observation assembly, rank diagnostics, geometric fitting and publication remain caller responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No symmetrization, epsilon diagonal, regularizer, objective substitution, post-solve clipping or geometric fixture changes the problem. Unrepresentable arithmetic throws and iteration exhaustion retains its actual original gradient metric.
 * @evidence contracts/common.md#meaningful-documentation States objective, input PSD premise, exact zero-diagonal semantics, transformed box, numeric limitations, original-coordinate termination and attempted-iteration meaning.
 * @evidence contracts/performance.md#efficient-algorithms For M controls, E sparse entries and K proposals, admission/scaling cost O(M+E); each proposal uses two three-axis sparse products and O(M) vector work. Original and scaled rows plus bounded vector workspaces require O(M+E) storage. No dense factorization or eigenvalue computation is performed.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted sparse registry and its scaled entries serve every iteration. Candidate original gradients supply both objective qualification and best-iterate selection; the final best metric is recomputed from the same original problem.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Invocation-local maps, sparse arrays and O(M) vectors expire on return or throw. Only one newly owned interleaved Float64Array and scalar diagnostics transfer to the caller; no input mutation, global cache, process or native handle is acquired.
 */
export function RecoveryChartBoxSolve(input: {
  hessian: readonly (readonly (readonly [number, number])[])[];
  rhs: readonly number[];
  lower: readonly [number, number, number];
  upper: readonly [number, number, number];
  maxIterations: number;
  gradientTolerance: number;
  initialValues?: readonly number[];
}): {
  values: Float64Array;
  iterations: number;
  projectedGradient: number;
  restarts: number;
  objective: number;
  initialObjective: number;
  minimumPositiveDiagonal: number | null;
  maximumDiagonal: number;
  originalLipschitz: number;
  scaledLipschitz: number;
} {
  const count: number = input.hessian.length,
    width: number = 3 * count;
  if (
    input.rhs.length !== width ||
    input.rhs.some((value: number): boolean => !Number.isFinite(value)) ||
    input.lower.length !== 3 ||
    input.upper.length !== 3 ||
    input.lower.some(
      (value: number, k: number): boolean =>
        !Number.isFinite(value) ||
        !Number.isFinite(input.upper[k]) ||
        value > input.upper[k]!,
    ) ||
    !Number.isSafeInteger(input.maxIterations) ||
    input.maxIterations < 1 ||
    !(input.gradientTolerance >= 0 && Number.isFinite(input.gradientTolerance))
  )
    throw new Error(
      "Box solve requires finite dimensions, bounds, RHS and explicit iteration/gradient budgets",
    );
  if (
    input.initialValues !== undefined &&
    (input.initialValues.length !== width ||
      Array.from(input.initialValues).some(
        (value: number, i: number): boolean =>
          !Number.isFinite(value) ||
          value < input.lower[i % 3]! ||
          value > input.upper[i % 3]!,
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
        if (
          entry.length !== 2 ||
          !Number.isSafeInteger(j) ||
          j < 0 ||
          j >= count ||
          !Number.isFinite(value) ||
          row.has(j)
        )
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
    if (!(scales[i]! > 0 && Number.isFinite(scales[i])))
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
    if (!Number.isFinite(sum))
      throw new Error("Original absolute Gram row sum is unrepresentable");
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
        if (!Number.isFinite(coefficient) || (value !== 0 && coefficient === 0))
          throw new Error("Scaled Gram entry is unrepresentable");
        return [j, coefficient];
      }),
  );
  let scaledLipschitz: number = 0;
  for (const row of scaled) {
    let sum: number = 0;
    for (const [, value] of row) sum += Math.abs(value);
    if (!Number.isFinite(sum))
      throw new Error("Scaled absolute Gram row sum is unrepresentable");
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
      vector.some((value: number): boolean => !Number.isFinite(value)),
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
    if (!Number.isFinite(result))
      throw new Error("Original projected-gradient metric is unrepresentable");
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
          !Number.isFinite(product) ||
          !Number.isFinite(gradient[at]) ||
          !Number.isFinite(objective)
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
        if (!Number.isFinite(scaledGradient[3 * i + k]))
          throw new Error("Scaled search gradient is unrepresentable");
      }
    const next: Float64Array = new Float64Array(width),
      nextY: Float64Array = new Float64Array(width);
    for (let i: number = 0; i < width; i++) {
      const raw: number = search[i]! - scaledGradient[i]! / scaledLipschitz;
      if (!Number.isFinite(raw))
        throw new Error("Scaled projected proposal is unrepresentable");
      // Projection onto an active scaled bound publishes the original endpoint.
      next[i] =
        raw <= lo[i]!
          ? input.lower[i % 3]!
          : raw >= hi[i]!
            ? input.upper[i % 3]!
            : raw * scales[Math.floor(i / 3)]!;
      if (
        !Number.isFinite(next[i]) ||
        next[i]! < input.lower[i % 3]! ||
        next[i]! > input.upper[i % 3]!
      )
        throw new Error(
          "Scaled proposal cannot represent a feasible original control",
        );
      nextY[i] = next[i]! / scales[Math.floor(i / 3)]!;
      if (!Number.isFinite(nextY[i]))
        throw new Error(
          "Feasible original proposal cannot be represented in scaled coordinates",
        );
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
    if (search.some((value: number): boolean => !Number.isFinite(value)))
      throw new Error("Accelerated scaled search is unrepresentable");
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
