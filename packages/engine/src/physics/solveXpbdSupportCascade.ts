import type {
  IAutoMovieQuadraticRow,
  IAutoMovieSolveQuadraticProgram,
} from "@automovie/interface";

import { solveAutoMovieQuadraticProgram } from "../math/solveAutoMovieQuadraticProgram";
import { AutoMovieXpbdSupportRows as Rows } from "./AutoMovieXpbdSupportRows";
import type { solveXpbdArticulationContacts as Contacts } from "./solveXpbdArticulationContacts";
import { solveXpbdDualActiveSet as ActiveSet } from "./solveXpbdDualActiveSet";

/**
 * The strict two-level cascade of hierarchical inverse dynamics (Herzog,
 * Rotella, Mason, Grimminger, Schaal and Righetti 2016, eq. 5) over one
 * tree's support rows and actuated axes, each level one quadratic program
 * over the same feasible set: the support rows bring their contacts to rest,
 * the row's velocity after the step zero as in sticking contact (Mirtich
 * 1996), through the independent ones, a normal row's impulse stays at or
 * above its
 * Signorini bound, each patch's whole friction, the contact passes' plus
 * the rows', stays inside the inscribed pyramid `|t1| + |t2| <= mu (N + sum
 * lambda_n)` the wrench allocation uses, and every joint impulse within its
 * motor's cap. Level one minimizes the task's residual `e = G x - g`,
 * regularized by `sqrt(eps)` as the allocation is; level two fixes that
 * residual at its optimum and tracks the motors' own impulses, `min |tau -
 * b|^2 + sqrt(eps) |lambda|^2`. Both objectives are diagonal and positive,
 * the fixed residual's weight changing nothing.
 *
 * Each level is solved by the dual active-set method (Goldfarb and Idnani
 * 1983, `solveXpbdDualActiveSet`), warm-started from the active set the
 * same level ended with on the previous substep, as whole-body controllers
 * solve their per-cycle programs; the engine's interior-point solver is the
 * cold fallback when the active-set solve reports no solution.
 *
 * @param input The rows, the task, the actuators, the posture and the warm start.
 * @returns The rows' and joint impulses, or null when level one has no feasible point.
 */
export function solveXpbdSupportCascade(
  input: solveXpbdSupportCascade.IInput,
): number[] | null {
  const {
    k,
    u,
    columns,
    target,
    set,
    actuators,
    posture,
    warm,
  }: solveXpbdSupportCascade.IInput = input;
  const rows: number = set.rows.length;
  const size: number = k[0]!.length;
  const equalities: ActiveSet.IRow[] = [];
  const inequalities: ActiveSet.IRow[] = [];
  const keys: string[] = [];
  const inequality = (
    key: string,
    indices: number[],
    weights: number[],
    value: number,
  ): void => {
    keys.push(key);
    inequalities.push({ indices, weights, value });
  };
  const holds: ReadonlySet<number> = independent(set);
  set.rows.forEach((_: Contacts.IRow, r: number): void => {
    if (holds.has(r))
      equalities.push({
        indices: k[r]!.map((_: number, s: number): number => s),
        weights: [...k[r]!],
        value: -u[r]! - set.rows[r]!.velocity,
      });
  });
  // A patch is named by its body's state and its order among that body's
  // patches, so the warm start finds its rows again on the next substep.
  const seen: Map<number, number> = new Map();
  for (const patch of set.patches) {
    const state: number = set.rows[patch.normals[0]!]!.state;
    const order: number = seen.get(state) ?? 0;
    seen.set(state, order + 1);
    const name: string = `${state}.${order}`;
    patch.normals.forEach((r: number, i: number): void =>
      inequality(`n${name}:${i}`, [r], [1], set.rows[r]!.lower!),
    );
    for (const x of [-1, 1])
      for (const z of [-1, 1])
        inequality(
          `p${name}:${x}${z}`,
          [patch.tangents[0]!, patch.tangents[1]!, ...patch.normals],
          [-x, -z, ...patch.normals.map((): number => patch.friction)],
          -(
            patch.friction * patch.normal -
            x * patch.prior.first -
            z * patch.prior.second
          ),
        );
  }
  actuators.forEach((actuator: Contacts.IActuator, j: number): void => {
    inequality(
      `c${actuator.edge}:${actuator.axis}-`,
      [rows + j],
      [1],
      -actuator.cap,
    );
    inequality(
      `c${actuator.edge}:${actuator.axis}+`,
      [rows + j],
      [-1],
      -actuator.cap,
    );
  });
  // The task's residual e = G x - g, one variable per wrench row.
  for (let m: number = 0; m < 6; ++m)
    equalities.push({
      indices: [...columns.map((_: number[], s: number): number => s), size + m],
      weights: [...columns.map((column: number[]): number => column[m]!), -1],
      value: target[m]!,
    });
  const first: number[] | null = level(
    [
      ...new Array<number>(size).fill(REGULARIZATION),
      ...new Array<number>(6).fill(1),
    ],
    new Array<number>(size + 6).fill(0),
    equalities,
    inequalities,
    keys,
    warm.first,
  );
  if (first === null) return null;
  const second: number[] | null = level(
    [
      ...new Array<number>(rows).fill(REGULARIZATION),
      ...new Array<number>(size - rows + 6).fill(1),
    ],
    [
      ...new Array<number>(rows).fill(0),
      ...posture.map((value: number): number => -value),
      ...new Array<number>(6).fill(0),
    ],
    [
      ...equalities,
      ...first.slice(size, size + 6).map(
        (value: number, m: number): ActiveSet.IRow => ({
          indices: [size + m],
          weights: [1],
          value,
        }),
      ),
    ],
    inequalities,
    keys,
    warm.second,
  );
  return (second ?? first).slice(0, size);
}

/**
 * The input and the warm store of solveXpbdSupportCascade.
 */
export namespace solveXpbdSupportCascade {
  /** One tree's program. */
  export interface IInput {
    /** Each support row's velocity change per unit impulse of every unknown, rows then actuators. */
    k: readonly number[][];

    /** Each support row's velocity change under the motors without the unknowns. */
    u: readonly number[];

    /** Each unknown's ground-reaction wrench per unit impulse, force then moment over the lever. */
    columns: readonly number[][];

    /** The ground-reaction wrench the rows should add, over the substep. */
    target: readonly number[];

    /** The support rows and patches. */
    set: Contacts.ISet;

    /** The actuated axes, in the unknowns' order after the rows. */
    actuators: readonly Contacts.IActuator[];

    /** The motors' own impulses on those axes, level two's targets. */
    posture: readonly number[];

    /** The tree's active sets from the previous substep, rewritten with this one's. */
    warm: IWarm;
  }

  /** The keys of the inequalities each level ended active on. */
  export interface IWarm {
    /** Level one's. */
    first: string[];

    /** Level two's. */
    second: string[];
  }
}

/**
 * One level: the warm active-set solve, else the interior-point solve; the
 * warm keys become the level's active set, or none after the fallback.
 */
function level(
  diagonal: number[],
  linear: number[],
  equalities: ActiveSet.IRow[],
  inequalities: ActiveSet.IRow[],
  keys: readonly string[],
  warm: string[],
): number[] | null {
  const known: ReadonlySet<string> = new Set(warm);
  const solved: ActiveSet.IResult | null = ActiveSet({
    diagonal,
    linear,
    equalities,
    inequalities,
    prefer: keys.flatMap((key: string, i: number): number[] =>
      known.has(key) ? [i] : [],
    ),
  });
  warm.length = 0;
  if (solved !== null) {
    for (const i of solved.active) warm.push(keys[i]!);
    return solved.primal;
  }
  const result: IAutoMovieSolveQuadraticProgram.IResult =
    solveAutoMovieQuadraticProgram({
      diagonal,
      linear,
      rows: [
        ...equalities.map(
          (row: ActiveSet.IRow): IAutoMovieQuadraticRow => ({
            indices: row.indices,
            weights: row.weights,
            lower: row.value,
            upper: row.value,
          }),
        ),
        ...inequalities.map(
          (row: ActiveSet.IRow): IAutoMovieQuadraticRow => ({
            indices: row.indices,
            weights: row.weights,
            lower: row.value,
            upper: null,
          }),
        ),
      ],
    });
  return result.status === 1 &&
    result.maximumViolation <= ACCEPTANCE &&
    result.primal.every(Number.isFinite)
    ? result.primal
    : null;
}

/**
 * The rows whose holds are independent. A row reads its body's velocity
 * change through its own unit impulse, `(r x d, d)`, so the rows of one
 * patch on one rigid body are
 * dependent exactly when those functionals are: four coplanar points span
 * three. Gram-Schmidt over each patch's functionals, normals first, keeps a
 * row whose functional leaves more than `sqrt(eps)` of itself outside the
 * ones kept; the others hold with them, and leaving them out keeps the
 * program's equality rows of full rank.
 */
function independent(set: Contacts.ISet): Set<number> {
  const result: Set<number> = new Set();
  for (const patch of set.patches) {
    const basis: number[][] = [];
    for (const r of [...patch.normals, ...patch.tangents]) {
      const row: Contacts.IRow = set.rows[r]!;
      const functional: number[] = Rows.impulse(row);
      let rest: number[] = functional;
      for (const unit of basis) {
        const share: number = product(rest, unit);
        rest = rest.map(
          (value: number, m: number): number => value - share * unit[m]!,
        );
      }
      const left: number = Math.sqrt(product(rest, rest));
      if (left > REGULARIZATION * Math.sqrt(product(functional, functional))) {
        basis.push(rest.map((value: number): number => value / left));
        result.add(r);
      }
    }
  }
  return result;
}

/** The dot product of two equal-length arrays. */
function product(a: readonly number[], b: readonly number[]): number {
  let sum: number = 0;
  for (let m: number = 0; m < a.length; ++m) sum += a[m]! * b[m]!;
  return sum;
}

/** The Tikhonov weight: the square root of float64's machine epsilon. */
const REGULARIZATION: number = Math.sqrt(Number.EPSILON);

/** The rows' violation an interior-point solve may leave and still count as solved: the wrench allocation's own acceptance (`distributePhysicalSupportWrench`). */
const ACCEPTANCE: number = 1e-6;
