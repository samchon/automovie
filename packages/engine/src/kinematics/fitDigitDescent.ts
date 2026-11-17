import type { IAutoMovieFitDigitDescent } from "@automovie/interface";
import { AutoMovieSolidVector } from "../geometry/construction/AutoMovieSolidVector";

/**
 * One prioritized descent of a digit's fit: a primary residual (where the
 * point goes) met first, and a secondary one (how it is turned, how its
 * joints couple) bettered only in what the primary leaves free, inside the
 * range the projection keeps.
 *
 * Each step is the damped least-squares step of the primary task, h1 =
 * -(J1'J1 + mu I)^-1 J1'r1, plus the secondary task's damped step taken in
 * the primary's damped null space, N = I - (J1'J1 + mu I)^-1 J1'J1, so the
 * secondary moves only what leaves the primary where it is to first order:
 * the task-priority inverse kinematics of Nakamura, Hanafusa and Yoshikawa
 * 1987 ("Task-priority based redundancy control of robot manipulators",
 * IJRR 6(2):3-15) in the damped form of Chiaverini 1997 ("Singularity-robust
 * task-priority redundancy resolution", IEEE TRA 13(3):398-410). A variable
 * standing on a bound its descent pushes against (the projection undoes a
 * resolution's move along the negative gradient) is held for the step, the
 * active set of a projected Newton method (Bertsekas 1982); the gradient is
 * the primary's while the primary is unmet, so the secondary never holds a
 * joint the primary needs.
 *
 * A trial is accepted lexicographically: while the primary is unmet, only
 * when it lowers the primary; once met (within the effector's motion for one
 * resolution step of every joint, `tolerance`), when it keeps the primary met
 * and lowers the secondary. The damping follows Levenberg-Marquardt with
 * Nielsen's update at its bounds (Madsen, Nielsen and Tingleff 2004,
 * Algorithm 3.16, tau = 1e-3): a third on an accepted step, a doubling growth
 * on a rejected one, so the steps shrink until the descent stops, when the
 * step it would take moves no variable by more than `step`.
 *
 * @param props The start, the residuals, the projection, the resolution and the primary's tolerance.
 * @returns The variables where the descent stops, projected.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two tasks, the step's form and its sources, the active set, the lexicographic acceptance, the damping and the stop.
 * @evidence contracts/development/implementation.md#principled-implementation Damped task-priority least squares (Nakamura et al. 1987, Chiaverini 1997) with a projected Newton active set (Bertsekas 1982) and Levenberg-Marquardt damping (Madsen, Nielsen and Tingleff 2004).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop: Jacobians, active set, primary step, null-space secondary step, acceptance.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No iteration count and no weight between the tasks: the primary is never traded for the secondary, and the descent stops at the resolution.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two residual evaluations per variable per Jacobian and two small dense solves per step, the variables at most a digit's nine.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input; the caller keeps the result.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function fitDigitDescent(props: IAutoMovieFitDigitDescent.IProps): number[] {
  const { primary, secondary, project, step }: IAutoMovieFitDigitDescent.IProps = props;
  const n: number = props.start.length;
  const jacobian = (
    f: (x: readonly number[]) => number[],
    x: readonly number[],
  ): number[][] => {
    const columns: number[][] = x.map((_v: number, i: number): number[] => {
      const up: number[] = [...x];
      const down: number[] = [...x];
      up[i] = up[i]! + step;
      down[i] = down[i]! - step;
      const a: number[] = f(up);
      const b: number[] = f(down);
      return a.map((v: number, k: number): number => (v - b[k]!) / (2 * step));
    });
    return columns[0]!.map((_r: number, k: number): number[] =>
      columns.map((c: number[]): number => c[k]!),
    );
  };
  const squared = (r: readonly number[]): number =>
    r.reduce((sum: number, v: number): number => sum + v * v, 0);
  const gram = (
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
  const times = (
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
  const damped = (A: number[][], mu: number): number[][] =>
    A.map((row: number[], i: number): number[] =>
      row.map((v: number, j: number): number => (i === j ? v + mu : v)),
    );

  let x: number[] = project(props.start);
  let r1: number[] = primary(x);
  let r2: number[] = secondary(x);
  let J1: number[][] = jacobian(primary, x);
  let J2: number[][] = r2.length === 0 ? [] : jacobian(secondary, x);
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
  for (;;) {
    // The active set, by the gradient of the task being served: the
    // primary's while it is unmet, so a bound the secondary pushes against
    // never holds a joint the primary needs; the whole residual's once met.
    const met: number = props.tolerance(x, J1);
    const served: boolean = Math.sqrt(squared(r1)) <= met;
    const g: number[] = all.map(
      (i: number): number =>
        times(J1, [i], r1)[0]! +
        (J2.length === 0 || !served ? 0 : times(J2, [i], r2)[0]!),
    );
    const free: number[] = all.filter((i: number): boolean => {
      if (g[i] === 0) return true;
      const probe: number[] = [...x];
      probe[i] = x[i]! - Math.sign(g[i]!) * step;
      return Math.abs(project(probe)[i]! - x[i]!) >= step / 2;
    });
    if (free.length === 0) break;

    // The primary's damped step and its damped null space.
    const A1: number[][] = damped(gram(J1, free), mu);
    const h1: number[] | null = AutoMovieSolidVector.solve(
      A1,
      times(J1, free, r1).map((v: number): number => -v),
    );
    if (h1 === null) break;
    let h: number[] = h1;
    if (J2.length !== 0) {
      const G: number[][] = gram(J1, free);
      const P: (number[] | null)[] = free.map(
        (_c: number, c: number): number[] | null =>
          AutoMovieSolidVector.solve(
            A1,
            G.map((row: number[]): number => row[c]!),
          ),
      );
      if (P.some((col: number[] | null): boolean => col === null)) break;
      // N = I - P, P's columns solved above.
      const N: number[][] = free.map((_r: number, a: number): number[] =>
        free.map(
          (_c: number, c: number): number => (a === c ? 1 : 0) - P[c]![a]!,
        ),
      );
      const J2f: number[][] = J2.map((row: number[]): number[] =>
        free.map((i: number): number => row[i]!),
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
    if (Math.max(...h.map((v: number): number => Math.abs(v))) <= step) break;

    const trial: number[] = project(
      x.map((v: number, i: number): number => {
        const a: number = free.indexOf(i);
        return a < 0 ? v : v + h[a]!;
      }),
    );
    const t1: number[] = primary(trial);
    const t2: number[] = secondary(trial);
    const accepted: boolean = !served
      ? squared(t1) < squared(r1)
      : Math.sqrt(squared(t1)) <= met && squared(t2) < squared(r2);
    if (accepted) {
      x = trial;
      r1 = t1;
      r2 = t2;
      J1 = jacobian(primary, x);
      J2 = r2.length === 0 ? [] : jacobian(secondary, x);
      mu /= 3;
      nu = 2;
    } else {
      mu *= nu;
      nu *= 2;
    }
  }
  return x;
}

/** The damping start of Levenberg-Marquardt relative to the largest diagonal entry of the normal matrix (Madsen, Nielsen and Tingleff 2004, section 3.2, tau = 1e-3 for a start believed close). */
const TAU: number = 1e-3;
