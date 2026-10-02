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
 * Pivot magnitudes at or below 1e-12 are treated as unresolved on this
 * dimensionless Jacobian, a numerical ceiling rather than anatomical refusal.
 * Inputs have matching dimensions and are read only. The result is a fresh
 * offset vector, not a body document or user control.
 *
 * @evidence contracts/common.md#principled-implementation Finite-difference columns estimate the local reading map; partial-pivot elimination solves its Newton equation. Each accepted bounded step lowers the squared norm, and the old-matrix rank-one update satisfies its secant equation. A fresh Jacobian retry and fixed work budget do not guarantee convergence, so unresolved systems return null to the strict measurement inverse.
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
export function solveHumanBodySimpleOffsets(input: {
  ranges: readonly (readonly [number, number])[];
  initial: readonly number[] | null;
  evaluate: (offsets: readonly number[]) => number[] | null;
  met: (residuals: readonly number[]) => boolean;
}): number[] | null {
  if (input.initial === null) return null;
  const size = input.ranges.length;
  let t = input.ranges.map(() => 0);
  let residual = [...input.initial];
  if (input.met(residual)) return t;
  const merit = (values: readonly number[]): number =>
    values.reduce((sum, value) => sum + value * value, 0);
  const differences = (from: readonly number[], at: readonly number[]): number[][] | null => {
    const columns: number[][] = [];
    for (let j = 0; j < size; j++) {
      const [low, high] = input.ranges[j];
      const amount = STEP * (high - low);
      const step = from[j] + amount > high ? -amount : amount;
      const stepped = from.map((value, k) => k === j ? value + step : value);
      const moved = input.evaluate(stepped);
      if (moved === null) return null;
      // Divide by the scalar actually representable after floating addition,
      // not the requested amount; preserve the original finite-difference map.
      columns.push(moved.map((value, i) => (value - at[i]) / (stepped[j] - from[j])));
    }
    return columns;
  };
  let jacobian = differences(t, residual);
  if (jacobian === null) return null;
  let fresh = true;
  for (let iteration = 0; !input.met(residual); iteration++) {
    if (iteration === ITERATIONS) return null;
    const step = solveLinear(jacobian, residual.map((value) => -value));
    if (step === null) return null;
    let accepted = false;
    for (const damping of DAMPING) {
      const next = t.map((value, j) => {
        const [low, high] = input.ranges[j];
        return Math.min(high, Math.max(low, value + damping * step[j]));
      });
      const reading = input.evaluate(next);
      if (reading === null || !(merit(reading) < merit(residual))) continue;
      const change = next.map((value, j) => value - t[j]);
      const previous = residual;
      // Strict reduction of deterministic readings implies a nonzero step.
      jacobian = updateHumanBodySimpleJacobian(jacobian, change,
        reading.map((value, index) => value - previous[index]));
      t = next;
      residual = reading;
      accepted = true;
      fresh = false;
      break;
    }
    if (!accepted) {
      if (fresh) return null;
      jacobian = differences(t, residual);
      if (jacobian === null) return null;
      fresh = true;
    }
  }
  return t;
}

/** Partial-pivot elimination of a column-major system; unresolved pivots return null. */
function solveLinear(columns: readonly (readonly number[])[], right: readonly number[]): number[] | null {
  const size = right.length;
  const rows = right.map((value, i) => [...columns.map((column) => column[i]), value]);
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
    for (let column = row + 1; column < size; column++) sum -= rows[row][column] * solution[column];
    solution[row] = sum / rows[row][row];
  }
  return solution;
}
