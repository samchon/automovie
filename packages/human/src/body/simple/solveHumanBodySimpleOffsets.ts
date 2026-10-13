import type { IHumanBodySimpleOffsetsProblem } from "./IHumanBodySimpleOffsetsProblem";
import { updateHumanBodySimpleJacobian } from "./updateHumanBodySimpleJacobian";

/** Finite-difference step as a share of an admitted scalar interval. */
const STEP: number = 1e-3;
/** Bounded work before the caller's strict sequential fallback. */
const ITERATIONS: number = 8;
/** Try norm reduction rather than minimizing it along the whole ray. */
const DAMPING: readonly number[] = [1, 0.5, 0.25, 0.125];

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
 * giving up. Broyden 1965, Mathematics of Computation 19(92):577–593,
 * derives the secant constraint in equation 3.9; finite
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
 * @evidence contracts/common.md#principled-implementation Finite-difference initialization and damped Broyden updates solve a dimensionless bounded system; rectangular steps minimize departure through primary row-space equations and secondary null-space projection, with matching finite dimensions and positive departure scales required.
 * @evidence contracts/common.md#clear-and-simple-design The owner coordinates numerical iteration and small linear systems; evaluate and met supply physical meaning, so no geometry or anatomical budget is hidden in elimination.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bounds are projected explicitly, unresolved pivots return null, and secondary progress never trades away satisfied primary budgets; one stale-Jacobian refresh and the fixed iteration budget remain declared numerical policies rather than a global-convergence guarantee.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies callback premises, dimensionless pivot ceiling, bounded work, primary versus secondary success, fresh offset ownership and null without modifying caller inputs.
 * @evidence contracts/performance.md#efficient-algorithms For C offsets and R residuals, finite differences need C readings and O(R*C) storage; at most eight iterations try four dampings, while rectangular active-set passes are bounded by C+1 and use cubic dense solves on the small reached systems.
 * @evidence contracts/performance.md#reuse-equivalent-work The initial reading is reused, accepted secants update the existing Jacobian, and finite differences refresh only after failed progress; each different projected trial still calls the deterministic evaluator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Offsets, residuals, matrices and active-bound maps are call-local and bounded by C and R; synchronous completion or null releases them, and no handles, workers or cross-request state are owned.
 */
export function solveHumanBodySimpleOffsets(
  input: IHumanBodySimpleOffsetsProblem,
): number[] | null {
  if (input.initial === null) return null;
  const size: number = input.ranges.length;
  const trailing: number = input.secondary ?? 0;
  const count: number = input.initial.length - trailing;
  const primary: (values: readonly number[]) => number[] = (values: readonly number[]): number[] =>
    values.slice(0, count);
  const secondary: (values: readonly number[]) => number[] = (values: readonly number[]): number[] =>
    values.slice(count);
  const met: (values: readonly number[]) => boolean = (values: readonly number[]): boolean =>
    input.met(primary(values));
  let t: number[] = input.ranges.map((): number => 0);
  let residual: number[] = [...input.initial];
  if (trailing === 0 && met(residual)) return t;
  const merit: (values: readonly number[]) => number = (values: readonly number[]): number =>
    values.reduce((sum: number, value: number): number => sum + value * value, 0);
  // the primary residuals first; once they are met, the secondary ones while the primary stay met
  const better: (next: readonly number[], current: readonly number[]) => boolean = (
    next: readonly number[],
    current: readonly number[],
  ): boolean =>
    met(current)
      ? met(next) && merit(secondary(next)) < merit(secondary(current))
      : merit(primary(next)) < merit(primary(current));
  const differences: (from: readonly number[], at: readonly number[]) => number[][] | null = (
    from: readonly number[],
    at: readonly number[],
  ): number[][] | null => {
    const columns: number[][] = [];
    for (let j: number = 0; j < size; j++) {
      const [low, high]: readonly [number, number] = input.ranges[j];
      const amount: number = STEP * (high - low);
      const step: number = from[j] + amount > high ? -amount : amount;
      const stepped: number[] = from.map((value: number, k: number): number => (k === j ? value + step : value));
      const moved: number[] | null = input.evaluate(stepped);
      if (moved === null) return null;
      // Divide by the scalar actually representable after floating addition,
      // not the requested amount; preserve the original finite-difference map.
      columns.push(
        moved.map((value: number, i: number): number => (value - at[i]) / (stepped[j] - from[j])),
      );
    }
    return columns;
  };
  let jacobian: number[][] | null = differences(t, residual);
  if (jacobian === null) return null;
  let fresh: boolean = true;
  for (let iteration: number = 0; ; iteration++) {
    const done: boolean = met(residual);
    if (done && trailing === 0) return t;
    if (iteration === ITERATIONS) return done ? t : null;
    const step: number[] | null =
      size === residual.length && trailing === 0
        ? solveLinear(
            jacobian,
            residual.map((value: number): number => -value),
          )
        : leastDepartureStep(jacobian, t, residual, input, count, done);
    if (step === null) return done ? t : null;
    let accepted: boolean = false;
    for (const damping of DAMPING) {
      const next: number[] = t.map((value: number, j: number): number => {
        const [low, high]: readonly [number, number] = input.ranges[j];
        return Math.min(high, Math.max(low, value + damping * step[j]));
      });
      const reading: number[] | null = input.evaluate(next);
      if (reading === null || !better(reading, residual)) continue;
      const change: number[] = next.map((value: number, j: number): number => value - t[j]);
      const previous: number[] = residual;
      // Strict reduction of deterministic readings implies a nonzero step.
      jacobian = updateHumanBodySimpleJacobian(
        jacobian,
        change,
        reading.map((value: number, index: number): number => value - previous[index]),
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
  const goal: number[] = residual.map(
    (value: number, i: number): number =>
      columns.reduce((sum: number, column: readonly number[], j: number): number => sum + column[i] * t[j], 0) - value,
  );
  const dot: (a: readonly number[], b: readonly number[]) => number = (a: readonly number[], b: readonly number[]): number =>
    a.reduce((sum: number, value: number, k: number): number => sum + value * b[k], 0);
  const fixed: Map<number, number> = new Map<number, number>();
  let x: number[] = [...t];
  for (let pass: number = 0; pass <= columns.length; pass++) {
    // a common factor leaves the least-departure solution unchanged, so the scales are divided by their largest
    const raw: readonly number[] = input.departure?.(x) ?? columns.map((): number => 1);
    const largest: number = Math.max(...raw);
    const scale: number[] = raw.map((value: number): number => value / largest);
    const free: number[] = columns.map((_: readonly number[], j: number): number => j).filter((j: number): boolean => !fixed.has(j));
    const right: number[] = goal.map((value: number, i: number): number =>
      [...fixed].reduce(
        (sum: number, [j, bound]: [number, number]): number => sum - columns[j][i] * bound,
        value,
      ),
    );
    // the free columns in scaled offsets u_j = scale_j x_j; row(i) is residual i's row over them
    const scaled: number[][] = free.map((j: number): number[] => columns[j].map((value: number): number => value / scale[j]));
    const row: (i: number) => number[] = (i: number): number[] => scaled.map((column: number[]): number => column[i]);
    // a primary residual no free offset reads is left where the fixed offsets put it
    const reached: number[] = right
      .map((_: number, i: number): number => i)
      .filter((i: number): boolean => i < count && scaled.some((column: number[]): boolean => column[i] !== 0));
    const later: number[] = pursue
      ? right.map((_: number, i: number): number => i).filter((i: number): boolean => i >= count)
      : [];
    let u: number[] | null;
    if (free.length > reached.length) {
      // minimum norm over the reached primary rows: u = A1^T y with (A1 A1^T) y = right1
      const first: number[][] = reached.map(row);
      const gram: number[][] = first.map((a: number[]): number[] => first.map((b: number[]): number => dot(a, b)));
      const y: number[] | null = solveLinear(
        gram,
        reached.map((i: number): number => right[i]),
      );
      if (y === null) return null;
      const particular: number[] = free.map((_: number, k: number): number =>
        first.reduce((sum: number, a: number[], r: number): number => sum + a[k] * y[r], 0),
      );
      u = particular;
      if (later.length > 0) {
        // the secondary rows within the null space of the primary ones: P v = v - A1^T (A1 A1^T)^-1 A1 v
        const project: (v: readonly number[]) => number[] | null = (v: readonly number[]): number[] | null => {
          const weights: number[] | null = solveLinear(
            gram,
            first.map((a: number[]): number => dot(a, v)),
          );
          return weights === null
            ? null
            : v.map(
                (value: number, k: number): number =>
                  value -
                  first.reduce((sum: number, a: number[], r: number): number => sum + a[k] * weights[r], 0),
              );
        };
        const projected: (number[] | null)[] = later.map((i: number): number[] | null => project(row(i)));
        if (projected.every((v: number[] | null): boolean => v !== null)) {
          const rows: number[][] = projected as number[][];
          const miss: number[] = later.map((i: number): number => right[i] - dot(row(i), particular));
          const z: number[] | null = solveLinear(
            rows.map((a: number[]): number[] => rows.map((b: number[]): number => dot(a, b))),
            miss,
          );
          // a secondary row the primary rows leave no room for is not pursued
          if (z !== null)
            u = particular.map(
              (value: number, k: number): number =>
                value + rows.reduce((sum: number, a: number[], r: number): number => sum + a[k] * z[r], 0),
            );
        }
      }
    } else {
      // least squares over the primary rows: (A1^T A1) u = A1^T right1
      const rows: number[] = right.map((_: number, i: number): number => i).filter((i: number): boolean => i < count);
      const gram: number[][] = scaled.map((a: number[]): number[] =>
        scaled.map((b: number[]): number => rows.reduce((sum: number, i: number): number => sum + a[i] * b[i], 0)),
      );
      u =
        free.length === 0
          ? []
          : solveLinear(
              gram,
              scaled.map((column: number[]): number =>
                rows.reduce((sum: number, i: number): number => sum + column[i] * right[i], 0),
              ),
            );
    }
    if (u === null) return null;
    const solved: number[] = u;
    x = columns.map(
      (_: readonly number[], j: number): number => fixed.get(j) ?? solved[free.indexOf(j)] / scale[j],
    );
    let crossed: boolean = false;
    for (const j of free) {
      const [low, high]: readonly [number, number] = input.ranges[j];
      if (x[j] < low || x[j] > high) {
        fixed.set(j, x[j] < low ? low : high);
        crossed = true;
      }
    }
    if (!crossed) break;
  }
  return x.map((value: number, j: number): number => {
    const [low, high]: readonly [number, number] = input.ranges[j];
    return Math.min(high, Math.max(low, value)) - t[j];
  });
}

/** Partial-pivot elimination of a column-major system; unresolved pivots return null. */
function solveLinear(
  columns: readonly (readonly number[])[],
  right: readonly number[],
): number[] | null {
  const size: number = right.length;
  const rows: number[][] = right.map((value: number, i: number): number[] => [
    ...columns.map((column: readonly number[]): number => column[i]),
    value,
  ]);
  for (let pivot: number = 0; pivot < size; pivot++) {
    let best: number = pivot;
    for (let row: number = pivot + 1; row < size; row++)
      if (Math.abs(rows[row][pivot]) > Math.abs(rows[best][pivot])) best = row;
    if (!(Math.abs(rows[best][pivot]) > 1e-12)) return null;
    [rows[pivot], rows[best]] = [rows[best], rows[pivot]];
    for (let row: number = pivot + 1; row < size; row++) {
      const factor: number = rows[row][pivot] / rows[pivot][pivot];
      for (let column: number = pivot; column <= size; column++)
        rows[row][column] -= factor * rows[pivot][column];
    }
  }
  const solution: number[] = new Array<number>(size).fill(0);
  for (let row: number = size - 1; row >= 0; row--) {
    let sum: number = rows[row][size];
    for (let column: number = row + 1; column < size; column++)
      sum -= rows[row][column] * solution[column];
    solution[row] = sum / rows[row][row];
  }
  return solution;
}
