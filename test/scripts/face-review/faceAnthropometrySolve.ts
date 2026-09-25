/**
 * Square solve of paired anthropometric indices: each control is set until
 * its own index on the model equals the photograph's.
 *
 * `derive-face-documents.ts` passes one control per index of
 * `FACE_ANTHROPOMETRY_INDICES` and an `evaluate` that builds the model at
 * given control values and measures every index under the photograph's
 * camera. The system has as many unknowns as observations, so it describes a
 * face by its measured proportions and nothing else: there is no residual to
 * minimise and no prior to weigh, and a control whose index is not measured
 * (its landmark absent in the photograph or on the model) keeps its starting
 * value and leaves the system with its index.
 *
 * Newton's method on the measured Jacobian (central differences of
 * `evaluate`, step `step`), because a control moves its neighbours' indices
 * too (widening the head changes every width ratio). A control that would
 * leave its envelope is held at the bound and the others are solved again
 * without it (an active set), and the row says which were held, because a
 * proportion the basis cannot reach is a finding about the basis, not a
 * value to hide. Iteration stops when every free index is within `tolerance`
 * (relative) of its target or after `iterations` steps. The active set holds
 * one control per step and may release it again, so the default budget is
 * three steps per control (one to hold it, one to release it, one Newton
 * step): a fixed twelve had run out on a face whose photograph pressed seven
 * of twenty controls to their bounds, leaving a released control where its
 * hold had put it and that index unsolved.
 *
 * Pure apart from calling `evaluate`.
 */

/** One control: the value it starts from and its envelope. */
export interface IFaceAnthropometryControl {
  id: string;
  start: number;
  lower: number;
  upper: number;
}

/** The solved controls and how each index ended. */
export interface IFaceAnthropometrySolution {
  values: number[];
  /** Index value on the model at the solution, null when unmeasured. */
  achieved: (number | null)[];
  /** Controls held at a bound. */
  held: number[];
  /** Indices left out because the photograph or the model lacks them. */
  unmeasured: number[];
  iterations: number;
}

export function solveFaceAnthropometry(props: {
  controls: readonly IFaceAnthropometryControl[];
  targets: readonly (number | null)[];
  evaluate: (values: readonly number[]) => readonly (number | null)[];
  step?: number;
  tolerance?: number;
  iterations?: number;
}): IFaceAnthropometrySolution {
  const n = props.controls.length;
  if (props.targets.length !== n)
    throw new Error(
      "A square anthropometric solve needs one target per control.",
    );
  const step = props.step ?? 0.05;
  const tolerance = props.tolerance ?? 1e-3;
  const iterations = props.iterations ?? 3 * n;
  const values = props.controls.map((c) => c.start);
  let current = props.evaluate(values);
  const unmeasured = [...new Array(n).keys()].filter(
    (i) => props.targets[i] === null || current[i] === null,
  );
  const held = new Set<number>();
  let count = 0;
  const converged = () =>
    [...new Array(n).keys()].every(
      (i) =>
        unmeasured.includes(i) ||
        held.has(i) ||
        Math.abs(current[i]! - props.targets[i]!) <=
          tolerance * Math.abs(props.targets[i]!),
    );
  while (count < iterations && !converged()) {
    ++count;
    const free = [...new Array(n).keys()].filter(
      (i) => !unmeasured.includes(i) && !held.has(i),
    );
    // Jacobian of the free indices with respect to the free controls.
    const J = free.map(() => free.map(() => 0));
    free.forEach((control, column) => {
      const up = [...values];
      const down = [...values];
      const { lower, upper } = props.controls[control]!;
      up[control] = Math.min(upper, values[control]! + step);
      down[control] = Math.max(lower, values[control]! - step);
      const a = props.evaluate(up);
      const b = props.evaluate(down);
      free.forEach((index, row) => {
        J[row]![column] =
          (a[index]! - b[index]!) / (up[control]! - down[control]!);
      });
    });
    const residual = free.map((i) => props.targets[i]! - current[i]!);
    const delta = solveLinear(J, residual);
    // A step that leaves an envelope was solved with that control free, so
    // its other components are not the answer either: hold the control that
    // overshoots furthest (relative to its step) at its bound and solve the
    // rest again from where they are.
    let worst = -1;
    let overshoot = 0;
    free.forEach((control, column) => {
      const { lower, upper } = props.controls[control]!;
      const next = values[control]! + delta[column]!;
      const beyond =
        Math.max(lower - next, next - upper, 0) / Math.abs(delta[column]!);
      if (beyond > overshoot) [overshoot, worst] = [beyond, column];
    });
    const changed = worst >= 0;
    if (changed) {
      const control = free[worst]!;
      const { lower, upper } = props.controls[control]!;
      values[control] = delta[worst]! > 0 ? upper : lower;
      held.add(control);
    } else
      free.forEach((control, column) => {
        values[control] = values[control]! + delta[column]!;
      });
    current = props.evaluate(values);
    // A held control whose index now asks to come back inside is released.
    if (!changed)
      for (const control of [...held]) {
        const { lower, upper } = props.controls[control]!;
        const error = props.targets[control]! - current[control]!;
        const probe = values[control] === upper ? -step : step;
        const slope =
          (props.evaluate(
            values.map((v, k) => (k === control ? v + probe : v)),
          )[control]! -
            current[control]!) /
          probe;
        const inward =
          (values[control] === upper && error * slope < 0) ||
          (values[control] === lower && error * slope > 0);
        if (inward) held.delete(control);
      }
  }
  return {
    values,
    achieved: current.map((v, i) => (unmeasured.includes(i) ? null : v)),
    held: [...held].sort((a, b) => a - b),
    unmeasured,
    iterations: count,
  };
}

/** Gaussian elimination with partial pivoting; refuses a singular system. */
export function solveLinear(
  matrix: readonly (readonly number[])[],
  rhs: readonly number[],
): number[] {
  const n = rhs.length;
  const A = matrix.map((row, i) => [...row, rhs[i]!]);
  for (let col = 0; col < n; ++col) {
    let pivot = col;
    for (let row = col + 1; row < n; ++row)
      if (Math.abs(A[row]![col]!) > Math.abs(A[pivot]![col]!)) pivot = row;
    if (!(Math.abs(A[pivot]![col]!) > 1e-12))
      throw new Error("The anthropometric Jacobian is singular.");
    [A[col], A[pivot]] = [A[pivot]!, A[col]!];
    for (let row = col + 1; row < n; ++row) {
      const f = A[row]![col]! / A[col]![col]!;
      for (let k = col; k <= n; ++k) A[row]![k]! -= f * A[col]![k]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; --row) {
    let sum = A[row]![n]!;
    for (let k = row + 1; k < n; ++k) sum -= A[row]![k]! * x[k]!;
    x[row] = sum / A[row]![row]!;
  }
  return x;
}
