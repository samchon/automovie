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
 * value and leaves the system with its index; one whose index stops reading
 * on the way (a landmark the model loses as it changes) leaves it where it
 * stands.
 *
 * Newton's method on the measured Jacobian (central differences of
 * `evaluate`, step `step`), because a control moves its neighbours' indices
 * too (widening the head changes every width ratio). A step that would take
 * controls out of their envelope is followed only as far as the first bound
 * it meets, where that control is held and the others are solved again
 * without it (an active set); moving the whole face along the step keeps
 * every intermediate state on the path Newton chose, where moving the one
 * control alone would build a face no step asked for. The row says which
 * were held, because a proportion the basis cannot reach is a finding about
 * the basis, not a value to hide. A held control is released when its index
 * asks to come back inside, but one held again after a release stays held:
 * its index cannot settle inside, and releasing it again would only repeat
 * the cycle. Iteration stops when every free index is within `tolerance`
 * (relative) of its target, or within its control's `resolution` (absolute:
 * the least difference its measurement resolves, for an index whose target
 * may lie at zero), or after `iterations` steps. The active set holds
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
  /** Index difference below which its measurement cannot tell; default 0. */
  resolution?: number;
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
  // Controls once released, and those held again after it.
  const released = new Set<number>();
  const pinned = new Set<number>();
  let count = 0;
  const converged = () =>
    [...new Array(n).keys()].every(
      (i) =>
        unmeasured.includes(i) ||
        held.has(i) ||
        Math.abs(current[i]! - props.targets[i]!) <=
          Math.max(
            tolerance * Math.abs(props.targets[i]!),
            props.controls[i]!.resolution ?? 0,
          ),
    );
  while (count < iterations && !converged()) {
    ++count;
    const free = [...new Array(n).keys()].filter(
      (i) => !unmeasured.includes(i) && !held.has(i),
    );
    // Jacobian of the free indices with respect to the free controls.
    const J = free.map(() => free.map(() => 0));
    const lost = new Set<number>();
    free.forEach((control, column) => {
      const up = [...values];
      const down = [...values];
      const { lower, upper } = props.controls[control]!;
      up[control] = Math.min(upper, values[control]! + step);
      down[control] = Math.max(lower, values[control]! - step);
      const a = props.evaluate(up);
      const b = props.evaluate(down);
      free.forEach((index, row) => {
        if (a[index] === null || b[index] === null) lost.add(index);
        else
          J[row]![column] =
            (a[index]! - b[index]!) / (up[control]! - down[control]!);
      });
    });
    if (lost.size !== 0) {
      unmeasured.push(...lost);
      continue;
    }
    const residual = free.map((i) => props.targets[i]! - current[i]!);
    const delta = solveLinear(J, residual);
    // A step that leaves an envelope was solved with that control free, so
    // its components beyond the first bound it meets are not the answer:
    // follow it to that bound, hold the control there and solve the rest
    // again from where they are.
    let worst = -1;
    let reach = 1;
    free.forEach((control, column) => {
      const { lower, upper } = props.controls[control]!;
      const next = values[control]! + delta[column]!;
      if (next >= lower && next <= upper) return;
      const bound = next > upper ? upper : lower;
      const fraction = (bound - values[control]!) / delta[column]!;
      if (fraction < reach) [reach, worst] = [fraction, column];
    });
    const changed = worst >= 0;
    free.forEach((control, column) => {
      values[control] = values[control]! + reach * delta[column]!;
    });
    if (changed) {
      const control = free[worst]!;
      const { lower, upper } = props.controls[control]!;
      values[control] = delta[worst]! > 0 ? upper : lower;
      if (released.has(control)) pinned.add(control);
      held.add(control);
    }
    current = props.evaluate(values);
    unmeasured.push(...free.filter((i) => !held.has(i) && current[i] === null));
    // A held control whose index now asks to come back inside is released.
    if (!changed)
      for (const control of [...held]) {
        if (pinned.has(control)) continue;
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
        if (inward) {
          held.delete(control);
          released.add(control);
        }
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

/**
 * The most probable controls under population norms: the values, within
 * their envelopes, that minimise the sum of squared standard scores of the
 * indices (each index less its norm, over the population's standard
 * deviation `spreads`). A face whose norms the controls can meet together
 * meets them; one whose norms pull against each other or past an envelope
 * settles where the population makes it most probable, each miss weighed
 * by how much the population itself varies.
 *
 * `derive-face-documents.ts` solves what a frontal photograph cannot show
 * this way, after the photograph's own indices (`solveFaceAnthropometry`):
 * measurements are met exactly, norms as the prior they are. Their readings
 * follow landmarks that can step from one sample of a profile to the next,
 * so the method takes only steps that lower the score (Levenberg-Marquardt:
 * the Gauss-Newton step on a central-difference Jacobian, damped toward
 * steepest descent by Marquardt's diagonal until it helps, clipped to the
 * envelopes). It stops when every index is within its control's
 * `resolution` of its norm, when no damping finds a lower score, or after
 * `iterations` Gauss-Newton steps (default three per control). An
 * index without a norm or a reading at the start, or whose reading a probe
 * loses, is left out, its control where it stands; a control ending at a
 * bound the score presses against is reported held.
 *
 * Pure apart from calling `evaluate`.
 */
export function solveFaceNorms(props: {
  controls: readonly IFaceAnthropometryControl[];
  targets: readonly (number | null)[];
  spreads: readonly number[];
  evaluate: (values: readonly number[]) => readonly (number | null)[];
  step?: number;
  iterations?: number;
}): IFaceAnthropometrySolution {
  const n = props.controls.length;
  if (props.targets.length !== n || props.spreads.length !== n)
    throw new Error("A norm solve needs one target and spread per control.");
  const step = props.step ?? 0.05;
  const iterations = props.iterations ?? 3 * n;
  const values = props.controls.map((c) => c.start);
  let current = props.evaluate(values);
  const unmeasured = [...new Array(n).keys()].filter(
    (i) => props.targets[i] === null || current[i] === null,
  );
  const scored = () =>
    [...new Array(n).keys()].filter((i) => !unmeasured.includes(i));
  // Sum of squared standard scores; a reading lost makes a state unusable.
  const score = (read: readonly (number | null)[]) =>
    scored().reduce((sum, i) => {
      const r = read[i];
      if (r === null || r === undefined) return Infinity;
      const z = (r - props.targets[i]!) / props.spreads[i]!;
      return sum + z * z;
    }, 0);
  let best = score(current);
  let damping = 1e-3;
  let count = 0;
  const clip = (i: number, v: number) =>
    Math.min(props.controls[i]!.upper, Math.max(props.controls[i]!.lower, v));
  const settled = () =>
    scored().every(
      (i) =>
        Math.abs(current[i]! - props.targets[i]!) <=
        (props.controls[i]!.resolution ?? 0),
    );
  while (count < iterations && !settled()) {
    const rows = scored();
    // Jacobian of the scored indices, in standard scores per unit control.
    const J = rows.map(() => new Array<number>(n).fill(0));
    for (let c = 0; c < n; ++c) {
      const up = values.map((v, k) => (k === c ? clip(c, v + step) : v));
      const down = values.map((v, k) => (k === c ? clip(c, v - step) : v));
      const a = props.evaluate(up);
      const b = props.evaluate(down);
      rows.forEach((i, row) => {
        if (a[i] === null || b[i] === null) {
          if (!unmeasured.includes(i)) unmeasured.push(i);
        } else
          J[row]![c] =
            (a[i]! - b[i]!) / (up[c]! - down[c]!) / props.spreads[i]!;
      });
    }
    if (rows.some((i) => unmeasured.includes(i))) {
      best = score(current);
      continue;
    }
    const z = rows.map(
      (i) => (current[i]! - props.targets[i]!) / props.spreads[i]!,
    );
    const A = [...new Array(n).keys()].map((p) =>
      [...new Array(n).keys()].map((q) =>
        rows.reduce((sum, _, r) => sum + J[r]![p]! * J[r]![q]!, 0),
      ),
    );
    const g = [...new Array(n).keys()].map((p) =>
      rows.reduce((sum, _, r) => sum + J[r]![p]! * z[r]!, 0),
    );
    // Damp until a clipped step lowers the score.
    ++count;
    let improved = false;
    while (damping < 1e12) {
      // Marquardt's diagonal; a control no index feels is damped by one.
      const M = A.map((row, p) =>
        row.map((v, q) => (p === q ? v + damping * (v > 0 ? v : 1) : v)),
      );
      let delta: number[];
      try {
        delta = solveLinear(
          M,
          g.map((v) => -v),
        );
      } catch {
        damping *= 4;
        continue;
      }
      const trial = values.map((v, k) => clip(k, v + delta[k]!));
      const read = props.evaluate(trial);
      const next = score(read);
      if (next < best) {
        trial.forEach((v, k) => (values[k] = v));
        current = read;
        best = next;
        damping = Math.max(damping / 3, 1e-9);
        improved = true;
        break;
      }
      damping *= 4;
    }
    if (!improved) break;
  }
  // A control at a bound whose score still falls outward is held there.
  const held = [...new Array(n).keys()].filter((c) => {
    const { lower, upper } = props.controls[c]!;
    if (values[c] !== lower && values[c] !== upper) return false;
    const inward = values[c] === upper ? -step : step;
    const probe = values.map((v, k) => (k === c ? v + inward : v));
    return score(props.evaluate(probe)) >= best;
  });
  return {
    values,
    achieved: current.map((v, i) => (unmeasured.includes(i) ? null : v)),
    held,
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
