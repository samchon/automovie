import type { IAutoMovieFitDigitDescent } from "@automovie/interface";

import { AutoMovieSolidVector } from "../geometry/construction/AutoMovieSolidVector";
import { prepareLinearSystem } from "../math/prepareLinearSystem";

/**
 * Execute the digit task-priority descent and retain the actual primary
 * linearization at its final accepted point. Every nonempty-variable stop
 * follows a Jacobian of that same point; empty variables have the exact
 * empty-column Jacobian. Rejected damping trials never replace its variables,
 * residual or Jacobian. The public descent returns only the variables, while
 * digit continuation uses this completed data for its original restart test.
 *
 * @param props The original pure fixed-dimension tasks, projection, resolution
 *   and tolerance.
 * @returns Final projected variables, their actual primary residual and their
 *   current feasible-probe primary Jacobian.
 * @evidence contracts/development/common.md#meaningful-documentation States the returned point/linearization relationship, pure callback scope, original stop and the public/continuation consumers.
 * @evidence contracts/development/implementation.md#principled-implementation Task-priority damped least squares keeps its projected active set. Separable clipped probes use actual coordinate span; interior/coupled probes retain central differences. Damped N is not exact, so primary-met trials use binary projected backtracking under original lexicographic acceptance (Bertsekas 1982). With a secondary task, once the primary is met and squared secondary is zero, strict secondary improvement is impossible, so no trial can change the point; with none, the primary has nothing to yield to and is descended to the variables' resolution. Empty variables have the exact empty-column Jacobian. Acceptance replaces variables/residuals/Jacobians together. A rejection multiplies the damping by a doubling factor, restarting a damping that underflowed to zero from the least positive double, so consecutive rejections overflow it within about sqrt(2 * 2098) = 65 and the primary factor then refuses. Each acceptance strictly lowers the residual its phase serves; a phase change follows the caller's tolerance at the new point, whose exclusion of revisited points is not proven here.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner separates feasible differencing, fixed-point linearization, damped direction, projected backtracking and original acceptance/damping. fitDigitDescent selects variables; fitDigitToTarget consumes actual final primary data for its unchanged restart test.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Targets, constraints, task order, primary tolerance and variable resolution remain unchanged. A bound-shortened probe is not divided by an untravelled distance, and a full-step primary rejection does not discard its feasible shorter prefixes. No rank cutoff, added physical epsilon, fixed retry cap, forced-zero residual or convergence certificate is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each nonempty Jacobian uses two residual probes and projections per variable. An admitted primary beside a secondary task whose squared residual is zero returns before guaranteed-rejected trials; a lone primary pays the damped steps down to the resolution; empty variables need only actual projected residuals. Otherwise one point shares linearization across damping retries and primary factors across RHS columns. A primary-met secondary direction tries O(1+log2(maxAbsStep/resolution)) dyadic scales before damping retry. Final data remove duplicate restart FK probes; runtime cost/speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure fixed-dimension callbacks make x/residuals/Jacobians/free sets equivalent across damping rejection and scale trials. Every retained projected iterate/probe and task residual is copied before later callbacks can reuse output storage. Acceptance replaces the fixed point; rejected scales never replace it. Final primary data use the same feasible differencing owner and resolution as the solve, without replacing demands or retaining answers across descents.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One descent owns its copied point, two projected probe arrays per live column, task/Jacobian arrays and one damping linearization. Backtracking retains only the current trial/residuals and halves finite step magnitude until existing resolution; no trial history grows. Final values/residual/primary Jacobian transfer to the synchronous caller; other state releases on return/throw.
 */
export function descendDigitTasks(
  props: IAutoMovieFitDigitDescent.IProps,
): descendDigitTasks.IResult {
  const {
    primary,
    secondary,
    project,
    step,
  }: IAutoMovieFitDigitDescent.IProps = props;
  const n: number = props.start.length;
  const jacobian: (
    f: (x: readonly number[]) => number[],
    x: readonly number[],
  ) => number[][] = (
    f: (x: readonly number[]) => number[],
    x: readonly number[],
  ): number[][] => {
    const columns: number[][] = x.map((_v: number, i: number): number[] => {
      const up: number[] = [...x];
      const down: number[] = [...x];
      up[i] = up[i]! + step;
      down[i] = down[i]! - step;
      const projectedUp: number[] = [...project(up)];
      const projectedDown: number[] = [...project(down)];

      // A separable bound can shorten just this coordinate's probe. Its
      // residual difference must use that actual feasible displacement;
      // dividing by 2*step would halve a derivative at either active end.
      const clipped: boolean =
        projectedUp.length === n &&
        projectedDown.length === n &&
        x.every(
          (value: number, index: number): boolean =>
            index === i ||
            (Object.is(projectedUp[index], value) &&
              Object.is(projectedDown[index], value)),
        ) &&
        (!Object.is(projectedUp[i], up[i]) ||
          !Object.is(projectedDown[i], down[i]));
      const span: number = clipped
        ? projectedUp[i]! - projectedDown[i]!
        : 2 * step;
      const divisor: number = span === 0 ? 2 * step : span;
      const a: number[] = f(clipped ? projectedUp : up);
      const b: number[] = f(clipped ? projectedDown : down);
      return a.map((v: number, k: number): number => (v - b[k]!) / divisor);
    });
    return columns[0]!.map((_r: number, k: number): number[] =>
      columns.map((c: number[]): number => c[k]!),
    );
  };
  const squared: (r: readonly number[]) => number = (
    r: readonly number[],
  ): number => r.reduce((sum: number, v: number): number => sum + v * v, 0);
  const gram: (
    J: readonly (readonly number[])[],
    at: readonly number[],
  ) => number[][] = (
    J: readonly (readonly number[])[],
    at: readonly number[],
  ): number[][] =>
    at.map((i: number): number[] =>
      at.map((j: number): number =>
        J.reduce(
          (s: number, row: readonly number[]): number => s + row[i]! * row[j]!,
          0,
        ),
      ),
    );
  const times: (
    J: readonly (readonly number[])[],
    at: readonly number[],
    r: readonly number[],
  ) => number[] = (
    J: readonly (readonly number[])[],
    at: readonly number[],
    r: readonly number[],
  ): number[] =>
    at.map((i: number): number =>
      J.reduce(
        (s: number, row: readonly number[], k: number): number =>
          s + row[i]! * r[k]!,
        0,
      ),
    );
  const damped: (A: number[][], mu: number) => number[][] = (
    A: number[][],
    mu: number,
  ): number[][] =>
    A.map((row: number[], i: number): number[] =>
      row.map((v: number, j: number): number => (i === j ? v + mu : v)),
    );

  let x: number[] = [...project(props.start)];
  let r1: number[] = [...primary(x)];
  let r2: number[] = [...secondary(x)];
  if (n === 0)
    return {
      values: x,
      primary: r1,
      primaryJacobian: r1.map((): number[] => []),
    };
  const together: (at: readonly number[]) => number[] = (
    at: readonly number[],
  ): number[] =>
    r2.length === 0 ? [...primary(at)] : [...primary(at), ...secondary(at)];
  let J: number[][] = jacobian(together, x);
  let J1: number[][] = J.slice(0, r1.length);
  let J2: number[][] = J.slice(r1.length);
  const all: number[] = Array.from(
    { length: n },
    (_: unknown, i: number): number => i,
  );
  let mu: number =
    TAU *
    Math.max(
      ...all.map(
        (i: number): number =>
          gram(J1, [i])[0]![0]! + (J2.length === 0 ? 0 : gram(J2, [i])[0]![0]!),
      ),
    );
  let nu: number = 2;
  let linearization: ILinearization | undefined;
  for (;;) {
    // The active set, by the gradient of the task being served: the
    // primary's while it is unmet, so a bound the secondary pushes against
    // never holds a joint the primary needs; the whole residual's once met.
    if (linearization === undefined) {
      const met: number = props.tolerance(x, J1);

      // The tolerance is where the primary yields to the secondary. With no
      // secondary task there is nothing to yield to, so the primary is
      // descended to the variables' resolution: stopping at the first
      // iterate inside the tolerance left a lone point task up to that
      // tolerance short (1.05 mm on three unit links, where the same target
      // with a normal beside it was met within 0.5 mm).
      const served: boolean = J2.length !== 0 && Math.sqrt(squared(r1)) <= met;

      // Once the primary is admitted, strict secondary improvement is the
      // only accepted move. A zero squared secondary is its exact lower
      // bound, so every damped/backtracked trial would be rejected without
      // changing x.
      if (served && squared(r2) === 0) break;
      const primaryGradient: number[] = times(J1, all, r1);
      const secondaryGradient: number[] | undefined =
        J2.length === 0 || !served ? undefined : times(J2, all, r2);
      const free: number[] = all.filter((i: number): boolean => {
        const gradient: number =
          primaryGradient[i]! + (secondaryGradient?.[i] ?? 0);
        if (gradient === 0) return true;
        const probe: number[] = [...x];
        probe[i] = x[i]! - Math.sign(gradient) * step;
        return Math.abs(project(probe)[i]! - x[i]!) >= step / 2;
      });
      if (free.length === 0) break;
      linearization = {
        met,
        served,
        free,
        gram: gram(J1, free),
        right: free.map((i: number): number => -primaryGradient[i]!),
        secondary: J2.map((row: number[]): number[] =>
          free.map((i: number): number => row[i]!),
        ),
      };
    }
    const {
      met,
      served,
      free,
      gram: G,
      right,
      secondary: J2f,
    }: ILinearization = linearization;

    // The damped complement can move the point. Use it for the secondary
    // direction only after the existing primary admission has been met.
    const A1: number[][] = damped(G, mu);
    const solvePrimary: ((right: readonly number[]) => number[]) | null =
      prepareLinearSystem(A1);
    if (solvePrimary === null) break;
    const h1: number[] = solvePrimary(right);
    let h: number[] = h1;
    if (served) {
      const P: number[][] = free.map((_c: number, c: number): number[] =>
        solvePrimary(G.map((row: number[]): number => row[c]!)),
      );
      // N = I - P, P's columns solved above.
      const N: number[][] = free.map((_r: number, a: number): number[] =>
        free.map(
          (_c: number, c: number): number => (a === c ? 1 : 0) - P[c]![a]!,
        ),
      );
      const M: number[][] = J2f.map((row: number[]): number[] =>
        free.map((_c: number, c: number): number =>
          row.reduce(
            (s: number, v: number, a: number): number => s + v * N[a]![c]!,
            0,
          ),
        ),
      );
      const b: number[] = J2f.map(
        (row: number[], k: number): number =>
          r2[k]! +
          row.reduce(
            (s: number, v: number, a: number): number => s + v * h1[a]!,
            0,
          ),
      );
      const local: number[] = free.map((_v: number, a: number): number => a);
      const z: number[] | null = AutoMovieSolidVector.solve(
        damped(gram(M, local), mu),
        times(M, local, b).map((v: number): number => -v),
      );
      if (z !== null)
        h = h1.map(
          (v: number, a: number): number =>
            v +
            N[a]!.reduce(
              (s: number, w: number, c: number): number => s + w * z[c]!,
              0,
            ),
        );
    }
    let maximum: number = Math.max(
      ...h.map((v: number): number => Math.abs(v)),
    );
    if (maximum <= step) break;

    // Damped N is an approximate null complement. Once the primary is met,
    // its leakage can reject the full secondary step even when a shorter
    // step meets both tasks. Backtrack that same projected direction before
    // increasing damping, stopping at the original variable resolution.
    let scale: number = 1;
    let trial: number[] = x;
    let t1: number[] = r1;
    let t2: number[] = r2;
    let accepted: boolean = false;
    for (;;) {
      trial = [
        ...project(
          x.map((v: number, i: number): number => {
            const a: number = free.indexOf(i);
            return a < 0 ? v : v + scale * h[a]!;
          }),
        ),
      ];
      t1 = [...primary(trial)];
      t2 = [...secondary(trial)];
      accepted = !served
        ? squared(t1) < squared(r1)
        : Math.sqrt(squared(t1)) <= met && squared(t2) < squared(r2);
      if (
        accepted ||
        !served ||
        J2.length === 0 ||
        !Number.isFinite(maximum) ||
        !(maximum / 2 > step)
      )
        break;
      scale /= 2;
      maximum /= 2;
    }
    if (accepted) {
      x = trial;
      r1 = t1;
      r2 = t2;
      J = jacobian(together, x);
      J1 = J.slice(0, r1.length);
      J2 = J.slice(r1.length);
      linearization = undefined;
      mu /= 3;
      nu = 2;
    } else {
      // A rejection must raise the damping (Madsen, Nielsen and Tingleff's
      // mu > 0 update), or the next trial repeats this one forever. A damping
      // that underflowed to zero (a Gram diagonal below 2^-1065 at the start,
      // or log3(mu / 2^-1075) acceptances later, about 680 from a unit
      // damping) has no multiple above zero, so it restarts from the least
      // positive double, below any damping an ordinary descent reaches.
      mu = Math.max(mu * nu, Number.MIN_VALUE);
      nu *= 2;
    }
  }
  return { values: x, primary: r1, primaryJacobian: J1 };
}

/** Quantities fixed by one accepted iterate, independent of damping retries. */
interface ILinearization {
  /** Existing primary reach tolerance, metres, at this exact x/Jacobian. */
  met: number;

  /** Whether the primary is served under that unchanged tolerance. */
  served: boolean;

  /** Active-set complement, in the original variable order. */
  free: number[];

  /** Primary normal matrix before adding the changing damping. */
  gram: number[][];

  /** Negative primary gradient restricted to those free variables. */
  right: number[];

  /** Secondary Jacobian restricted to the same free variables. */
  secondary: number[][];
}

/**
 * Completed task data of one descent, with no caller admission flag.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines final projected values, metre residual and feasible-probe primary derivatives at exactly those values.
 * @evidence contracts/development/design.md#principled-representation Actual final arrays carry the primary task and feasible-probe linearization that the descent computed, rather than a success flag or guessed bound.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the public variable-only wrapper and digit continuation consume this internal result; no package barrel exposes it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps original tasks and units, with no alternate goal, stop or solver certificate represented.
 */
export namespace descendDigitTasks {
  /**
   * Actual final accepted point and primary data, retained until its caller
   * releases them.
   */
  export interface IResult {
    /** Final projected variables, in the original variable units and order. */
    values: number[];

    /** Primary residual at values, metres, with its original dimension. */
    primary: readonly number[];

    /**
     * Primary feasible differences at values, metres per variable unit, in
     * task-row/variable-column order.
     */
    primaryJacobian: readonly (readonly number[])[];
  }
}
/**
 * The damping start of Levenberg-Marquardt relative to the largest diagonal
 * entry of the normal matrix (Madsen, Nielsen and Tingleff 2004, section 3.2,
 * tau = 1e-3 for a start believed close).
 */
const TAU: number = 1e-3;
