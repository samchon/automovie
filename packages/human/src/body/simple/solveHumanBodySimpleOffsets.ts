import type { IHumanBodySimpleOffsetsProblem } from "./IHumanBodySimpleOffsetsProblem";
import { updateHumanBodySimpleJacobian } from "./updateHumanBodySimpleJacobian";

/** Finite-difference step as a share of an admitted scalar interval. */
const STEP = 1e-3;
/** Bounded work before the caller's strict sequential fallback. */
const ITERATIONS = 8;
/** Try norm reduction rather than minimizing it along the whole ray. */
const DAMPING = [1, 0.5, 0.25, 0.125];

/**
 * Solve the simple body's bounded scalar offsets against shared measurements.
 *
 * The body adapter supplies its initial relative residual, one finite interval
 * containing zero per direction, deterministic finite residual readings (or
 * null for an unreadable body), and the predicate for its physical precision
 * budgets. This owner contains only numerical iteration; it never builds or
 * edits geometry or selects an anatomical tolerance.
 *
 * Finite differences initialize a column-major Jacobian. Accepted steps reduce
 * the squared residual norm and update the complete old matrix by Broyden's
 * rank-one secant equation. A failed updated matrix is refreshed once before
 * giving up. Broyden 1965, Mathematics of Computation 19(92):577–593, equations
 * 4.1–4.3 and section 5, motivates the secant and norm-reduction rules; finite
 * differences, box projection and an eight-iteration budget remain this
 * solver's numerical policy. Local convergence is not promised for every
 * piecewise-smooth surface reading. Null leaves the strict fallback in charge.
 *
 * With more offsets than residuals (the person head's six channels against
 * four measurements) the Newton equation has many solutions. Each iteration
 * then aims at the solution of the linearized system that departs least from
 * zero offsets in the caller's departure cost (`IHumanBodySimpleOffsetsProblem
 * .departure`): the minimum-norm solution in the scaled offsets, found from the
 * normal equations of the row space. An offset that would leave its interval
 * is fixed at the bound it crosses and the rest are solved again; a residual
 * that no free offset reads (its only offsets are fixed) is left where the
 * fixed offsets put it. When no more free offsets than reached residuals
 * remain, the free offsets take the least-squares step instead, so a target
 * beyond reach lowers the residual as far as the intervals allow and the
 * iteration ends unmet. The departure scales are divided by their largest,
 * which leaves the solution unchanged and keeps the scaled system
 * dimensionless for the pivot ceiling. The damping, acceptance and
 * Broyden update are the square solve's: the secant update holds for a
 * rectangular Jacobian unchanged. A square problem keeps its elimination path.
 *
 * A problem may name trailing secondary residuals
 * (`IHumanBodySimpleOffsetsProblem.secondary`). They are pursued only within
 * the primary rows' freedom. Until the primary rows are met, a step solves
 * them alone; once they are met, it also solves the secondary rows within the
 * primary rows' null space (projected minimum norm); either way it then takes
 * the least departure. Pursuing the secondary rows before the primary are met
 * would trade a primary reduction for a secondary one in the linearization. A step is accepted while the primary are
 * unmet if it lowers their squared norm; once they are met, only if they stay
 * met and the secondary squared norm falls. The solve returns the offsets once
 * no step improves the secondary rows or the budget is spent with the primary
 * met; the secondary rows are never a condition of success.
 *
 * Pivot magnitudes at or below 1e-12 are treated as unresolved on this
 * dimensionless Jacobian, a numerical ceiling rather than anatomical refusal.
 * Inputs have matching dimensions and are read only. The result is a fresh
 * offset vector, not a body document or user control.
 *
 * @evidence contracts/common.md#principled-implementation Finite-difference columns estimate the local reading map; partial-pivot elimination solves its Newton equation, and an underdetermined equation is solved for the least departure the caller defines, within the intervals. Each accepted bounded step lowers the squared norm, and the old-matrix rank-one update satisfies its secant equation. A fresh Jacobian retry and fixed work budget do not guarantee convergence, so unresolved systems return null to the strict measurement inverse.
 * @evidence contracts/common.md#clear-and-simple-design One owner holds the numerical state and iteration; the body adapter owns measurements and physical budgets, and the rank-one update has one pure owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Numerical steps depend only on the actual reading map and admitted intervals; no subject, photograph or test-specific branch is selected.
 * @evidence contracts/common.md#meaningful-documentation States dimensions, units, determinism, ownership, source equations, numerical policies and the lack of a universal convergence guarantee.
 * @evidence contracts/modeling.md#spatial-conventions Offsets and relative residuals are dimensionless numerical coordinates; no body position or frame is transformed.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It owns no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The body adapter supplies directions and their intervals; this owner defines no shape channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits an offset vector and no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The adapter owns anatomical readings; this solver carries no anatomical constant.
 * @evidenceExclude contracts/anatomy.md#permitted-range Numerical offset intervals come from already admitted channel bounds and establish no new physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority These are internal solve coordinates, not authored document fields.
 */
export function solveHumanBodySimpleOffsets(
  input: IHumanBodySimpleOffsetsProblem,
): number[] | null {
  if (input.initial === null) return null;
  const size = input.ranges.length;
  const trailing = input.secondary ?? 0;
  const count = input.initial.length - trailing;
  const primary = (values: readonly number[]): number[] =>
    values.slice(0, count);
  const secondary = (values: readonly number[]): number[] =>
    values.slice(count);
  const met = (values: readonly number[]): boolean =>
    input.met(primary(values));
  let t = input.ranges.map(() => 0);
  let residual = [...input.initial];
  if (trailing === 0 && met(residual)) return t;
  const merit = (values: readonly number[]): number =>
    values.reduce((sum, value) => sum + value * value, 0);
  // the primary residuals first; once they are met, the secondary ones while the primary stay met
  const better = (
    next: readonly number[],
    current: readonly number[],
  ): boolean =>
    met(current)
      ? met(next) && merit(secondary(next)) < merit(secondary(current))
      : merit(primary(next)) < merit(primary(current));
  const differences = (
    from: readonly number[],
    at: readonly number[],
  ): number[][] | null => {
    const columns: number[][] = [];
    for (let j = 0; j < size; j++) {
      const [low, high] = input.ranges[j];
      const amount = STEP * (high - low);
      const step = from[j] + amount > high ? -amount : amount;
      const stepped = from.map((value, k) => (k === j ? value + step : value));
      const moved = input.evaluate(stepped);
      if (moved === null) return null;
      // Divide by the scalar actually representable after floating addition,
      // not the requested amount; preserve the original finite-difference map.
      columns.push(
        moved.map((value, i) => (value - at[i]) / (stepped[j] - from[j])),
      );
    }
    return columns;
  };
  let jacobian = differences(t, residual);
  if (jacobian === null) return null;
  let fresh = true;
  for (let iteration = 0; ; iteration++) {
    const done = met(residual);
    if (done && trailing === 0) return t;
    if (iteration === ITERATIONS) return done ? t : null;
    const step =
      size === residual.length && trailing === 0
        ? solveLinear(
            jacobian,
            residual.map((value) => -value),
          )
        : leastDepartureStep(jacobian, t, residual, input, count, done);
    if (step === null) return done ? t : null;
    let accepted = false;
    for (const damping of DAMPING) {
      const next = t.map((value, j) => {
        const [low, high] = input.ranges[j];
        return Math.min(high, Math.max(low, value + damping * step[j]));
      });
      const reading = input.evaluate(next);
      if (reading === null || !better(reading, residual)) continue;
      const change = next.map((value, j) => value - t[j]);
      const previous = residual;
      // Strict reduction of deterministic readings implies a nonzero step.
      jacobian = updateHumanBodySimpleJacobian(
        jacobian,
        change,
        reading.map((value, index) => value - previous[index]),
      );
      t = next;
      residual = reading;
      accepted = true;
      fresh = false;
      break;
    }
    if (!accepted) {
      if (done) return t;
      if (fresh) return null;
      jacobian = differences(t, residual);
      if (jacobian === null) return null;
      fresh = true;
    }
  }
}

/**
 * The step to the least-departure solution of the linearized system within
 * the intervals, for a column-major J whose first `count` rows are primary:
 * J1 x = J1 t - r1 exactly where reachable, then, when `pursue` (the primary
 * rows are met), J2 x = J2 t - r2 as nearly as the primary rows allow, then
 * the least scaled norm.
 */
function leastDepartureStep(
  columns: readonly (readonly number[])[],
  t: readonly number[],
  residual: readonly number[],
  input: IHumanBodySimpleOffsetsProblem,
  count: number,
  pursue: boolean,
): number[] | null {
  const goal = residual.map(
    (value, i) =>
      columns.reduce((sum, column, j) => sum + column[i] * t[j], 0) - value,
  );
  const dot = (a: readonly number[], b: readonly number[]): number =>
    a.reduce((sum, value, k) => sum + value * b[k], 0);
  const fixed = new Map<number, number>();
  let x = [...t];
  for (let pass = 0; pass <= columns.length; pass++) {
    // a common factor leaves the least-departure solution unchanged, so the scales are divided by their largest
    const raw = input.departure?.(x) ?? columns.map(() => 1);
    const largest = Math.max(...raw);
    const scale = raw.map((value) => value / largest);
    const free = columns.map((_, j) => j).filter((j) => !fixed.has(j));
    const right = goal.map((value, i) =>
      [...fixed].reduce(
        (sum, [j, bound]) => sum - columns[j][i] * bound,
        value,
      ),
    );
    // the free columns in scaled offsets u_j = scale_j x_j; row(i) is residual i's row over them
    const scaled = free.map((j) => columns[j].map((value) => value / scale[j]));
    const row = (i: number): number[] => scaled.map((column) => column[i]);
    // a primary residual no free offset reads is left where the fixed offsets put it
    const reached = right
      .map((_, i) => i)
      .filter((i) => i < count && scaled.some((column) => column[i] !== 0));
    const later = pursue
      ? right.map((_, i) => i).filter((i) => i >= count)
      : [];
    let u: number[] | null;
    if (free.length > reached.length) {
      // minimum norm over the reached primary rows: u = A1^T y with (A1 A1^T) y = right1
      const first = reached.map(row);
      const gram = first.map((a) => first.map((b) => dot(a, b)));
      const y = solveLinear(
        gram,
        reached.map((i) => right[i]),
      );
      if (y === null) return null;
      const particular = free.map((_, k) =>
        first.reduce((sum, a, r) => sum + a[k] * y[r], 0),
      );
      u = particular;
      if (later.length > 0) {
        // the secondary rows within the null space of the primary ones: P v = v - A1^T (A1 A1^T)^-1 A1 v
        const project = (v: readonly number[]): number[] | null => {
          const weights = solveLinear(
            gram,
            first.map((a) => dot(a, v)),
          );
          return weights === null
            ? null
            : v.map(
                (value, k) =>
                  value -
                  first.reduce((sum, a, r) => sum + a[k] * weights[r], 0),
              );
        };
        const projected = later.map((i) => project(row(i)));
        if (projected.every((v) => v !== null)) {
          const rows = projected as number[][];
          const miss = later.map((i) => right[i] - dot(row(i), particular));
          const z = solveLinear(
            rows.map((a) => rows.map((b) => dot(a, b))),
            miss,
          );
          // a secondary row the primary rows leave no room for is not pursued
          if (z !== null)
            u = particular.map(
              (value, k) =>
                value + rows.reduce((sum, a, r) => sum + a[k] * z[r], 0),
            );
        }
      }
    } else {
      // least squares over the primary rows: (A1^T A1) u = A1^T right1
      const rows = right.map((_, i) => i).filter((i) => i < count);
      const gram = scaled.map((a) =>
        scaled.map((b) => rows.reduce((sum, i) => sum + a[i] * b[i], 0)),
      );
      u =
        free.length === 0
          ? []
          : solveLinear(
              gram,
              scaled.map((column) =>
                rows.reduce((sum, i) => sum + column[i] * right[i], 0),
              ),
            );
    }
    if (u === null) return null;
    const solved = u;
    x = columns.map(
      (_, j) => fixed.get(j) ?? solved[free.indexOf(j)] / scale[j],
    );
    let crossed = false;
    for (const j of free) {
      const [low, high] = input.ranges[j];
      if (x[j] < low || x[j] > high) {
        fixed.set(j, x[j] < low ? low : high);
        crossed = true;
      }
    }
    if (!crossed) break;
  }
  return x.map((value, j) => {
    const [low, high] = input.ranges[j];
    return Math.min(high, Math.max(low, value)) - t[j];
  });
}

/** Partial-pivot elimination of a column-major system; unresolved pivots return null. */
function solveLinear(
  columns: readonly (readonly number[])[],
  right: readonly number[],
): number[] | null {
  const size = right.length;
  const rows = right.map((value, i) => [
    ...columns.map((column) => column[i]),
    value,
  ]);
  for (let pivot = 0; pivot < size; pivot++) {
    let best = pivot;
    for (let row = pivot + 1; row < size; row++)
      if (Math.abs(rows[row][pivot]) > Math.abs(rows[best][pivot])) best = row;
    if (!(Math.abs(rows[best][pivot]) > 1e-12)) return null;
    [rows[pivot], rows[best]] = [rows[best], rows[pivot]];
    for (let row = pivot + 1; row < size; row++) {
      const factor = rows[row][pivot] / rows[pivot][pivot];
      for (let column = pivot; column <= size; column++)
        rows[row][column] -= factor * rows[pivot][column];
    }
  }
  const solution = new Array<number>(size).fill(0);
  for (let row = size - 1; row >= 0; row--) {
    let sum = rows[row][size];
    for (let column = row + 1; column < size; column++)
      sum -= rows[row][column] * solution[column];
    solution[row] = sum / rows[row][row];
  }
  return solution;
}
