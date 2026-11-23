import type {
  IAutoMovieQuadraticRow,
  IAutoMovieSolveQuadraticProgram,
} from "@automovie/interface";

import { solveAutoMovieQuadraticProgram } from "../math/solveAutoMovieQuadraticProgram";
import { AutoMovieXpbdSupportRows as Rows } from "./AutoMovieXpbdSupportRows";
import type { solveXpbdArticulationContacts as Contacts } from "./solveXpbdArticulationContacts";
import { solveXpbdDualActiveSet as ActiveSet } from "./solveXpbdDualActiveSet";

/**
 * The strict cascade of hierarchical inverse dynamics (Herzog, Rotella, Mason,
 * Grimminger, Schaal and Righetti 2016, eq. 5) over one tree's support rows and
 * actuated axes, each level one quadratic program over the same feasible set:
 * the support rows bring their contacts to rest, the row's velocity after the
 * step zero as in sticking contact (Mirtich 1996), through the independent
 * ones, a normal row's impulse stays at or above its Signorini bound, each
 * patch's whole friction, the contact passes' plus the rows', stays inside the
 * inscribed pyramid `|t1| + |t2| <= mu (N + sum lambda_n)` the wrench
 * allocation uses, a patch's torsional moment within its points' friction on
 * their levers, every joint impulse within its motor's cap on its own
 * direction (Herzog et al. 2016, Section 2.1), and each bounded group's summed
 * normal impulse within its bound, the ramp a leaving contact's force follows
 * to zero (Section 5.3).
 *
 * - Level one minimizes the task's residual `e = G x - g`, regularized by
 *   `sqrt(eps)` as the allocation is.
 * - Level two fixes that residual at its optimum and minimizes the motion rows'
 *   residual `m = W x - w`: the posture's joint rates and the root's spin after
 *   the step against what their servos ask, a task in motion, as whole-body
 *   controllers rank posture (Herzog et al. 2016; TSID's `TaskJointPosture`),
 *   the joint impulses left free within their caps so the torques the support
 *   needs come out of the solve. A torque-space posture, the motors' own
 *   impulses as targets, lets every wrench change bend the stance unopposed.
 * - When level one has no feasible point, the holds that cannot be met within the
 *   caps and cones are kept as nearly as they can: a level zero minimizes their
 *   velocity residual, fixed below the wrench and the motion, so every level
 *   stays feasible (hierarchical least squares; Escande, Mansard and Wieber
 *   2014) and the support never falls back to a solve without its task.
 *
 * Every objective is diagonal and positive, a fixed residual's weight changing
 * nothing. Each level is solved by the dual active-set method (Goldfarb and
 * Idnani 1983, `solveXpbdDualActiveSet`), warm-started from the active set the
 * same level ended with on the previous substep, as whole-body controllers
 * solve their per-cycle programs; the engine's interior-point solver is the
 * cold fallback when the active-set solve reports no solution.
 *
 * @param input The rows, the task, the actuators, the motion rows, the bounds
 *   and the warm start.
 * @returns The rows' and joint impulses, or null when even the relaxed holds
 *   leave no feasible point.
 * @evidence contracts/development/common.md#meaningful-documentation States the levels, the feasible set, the objectives, the relaxed holds, the solver, its warm start and the fallback.
 * @evidence contracts/development/implementation.md#principled-implementation Herzog et al. 2016, eq. 5, with the posture as a motion task; hierarchical least squares for infeasible holds; each level by Goldfarb and Idnani 1983 warm-started from the previous active set; the interior-point solve only when it reports no solution.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the rows once, solve level one, fix its residual, solve level two; on an infeasible level one, the same with a hold level first.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failed level is solved again cold, never accepted; bounds and coefficients are the rows'.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two dense active-set solves of O(n^2) per added or dropped row, three when the holds are relaxed; a warm solve whose active set did not change adds its rows once each.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The rows are built once for every level; the active sets carry over in the caller's warm store.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes only the warm store's two key lists; returns a fresh array.
 */
export function solveXpbdSupportCascade(
  input: solveXpbdSupportCascade.IInput,
): number[] | null {
  return cascade(input, false) ?? cascade(input, true);
}

/** The cascade with the holds strict, or relaxed behind a level of their own. */
function cascade(
  input: solveXpbdSupportCascade.IInput,
  relaxed: boolean,
): number[] | null {
  const {
    k,
    u,
    columns,
    target,
    set,
    actuators,
    motion,
    warm,
  }: solveXpbdSupportCascade.IInput = input;
  const bounds: readonly solveXpbdSupportCascade.IBound[] = input.bounds ?? [];
  const rows: number = set.rows.length;
  const size: number = k[0]!.length;
  const holds: number[] = [...independent(set)].sort(
    (a: number, b: number): number => a - b,
  );

  // The variables: the unknowns, the wrench residual, the motion residual
  // and, relaxed, the holds' residual.
  const wrench: number = size;
  const moved: number = wrench + 6;
  const held: number = moved + motion.length;
  const count: number = held + (relaxed ? holds.length : 0);
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
  holds.forEach((r: number, h: number): void => {
    equalities.push({
      indices: [
        ...k[r]!.map((_: number, s: number): number => s),
        ...(relaxed ? [held + h] : []),
      ],
      weights: [...k[r]!, ...(relaxed ? [-1] : [])],
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
    // The torsional row's moment is bounded by each pressed point's friction
    // pyramid on its lever from the centroid, |tau| <= mu sum_i (|r_i . t1| +
    // |r_i . t2|) N_i with N_i the point's whole normal impulse, the contact
    // passes' plus the row's: the most moment four corner points in their own
    // linearized cones give about the normal (TSID `contact-6d.cpp`,
    // `updateForceInequalityConstraints` and `updateForceGeneratorMatrix`).
    // It is an inequality on the impulse, not a hold: friction bounds the
    // force variables as TSID's cones do, and the patch's turning about its
    // normal stays the contact passes', as for the patch friction. A hold
    // would repeat across the patches of a tree whose joints cannot turn its
    // supports about the vertical against its root, a four-legged body's
    // two-axis legs or a Human's foot and toes, and its equalities would lose
    // full rank; the row carries the moment the task asks of the ground.
    if (patch.torsion !== undefined) {
      const pivot: Contacts.IRow = set.rows[patch.torsion]!;
      const first: Contacts.IRow = set.rows[patch.tangents[0]!]!;
      const second: Contacts.IRow = set.rows[patch.tangents[1]!]!;
      const levers: number[] = patch.normals.map((r: number): number => {
        const point: Contacts.IRow = set.rows[r]!;
        const dx: number = point.point.x - pivot.point.x;
        const dy: number = point.point.y - pivot.point.y;
        const dz: number = point.point.z - pivot.point.z;
        return (
          Math.abs(
            dx * first.direction.x +
              dy * first.direction.y +
              dz * first.direction.z,
          ) +
          Math.abs(
            dx * second.direction.x +
              dy * second.direction.y +
              dz * second.direction.z,
          )
        );
      });
      const given: number = patch.normals.reduce(
        (sum: number, r: number, i: number): number =>
          sum - patch.friction * levers[i]! * set.rows[r]!.lower!,
        0,
      );
      for (const s of [-1, 1])
        inequality(
          `t${name}:${s}`,
          [patch.torsion, ...patch.normals],
          [-s, ...levers.map((lever: number): number => patch.friction * lever)],
          -given,
        );
    }
  }
  // Each direction of an actuated axis is bounded by its own cap.
  actuators.forEach((actuator: Contacts.IActuator, j: number): void => {
    inequality(
      `c${actuator.edge}:${actuator.axis}-`,
      [rows + j],
      [1],
      -actuator.reverse,
    );
    inequality(
      `c${actuator.edge}:${actuator.axis}+`,
      [rows + j],
      [-1],
      -actuator.cap,
    );
  });
  // A bounded group's normal rows add at most its impulse.
  bounds.forEach((bound: solveXpbdSupportCascade.IBound, b: number): void =>
    inequality(
      `b${b}`,
      [...bound.rows],
      bound.rows.map((): number => -1),
      -bound.impulse,
    ),
  );
  // The task's residual e = G x - g, one variable per wrench row.
  for (let m: number = 0; m < 6; ++m)
    equalities.push({
      indices: [
        ...columns.map((_: number[], s: number): number => s),
        wrench + m,
      ],
      weights: [...columns.map((column: number[]): number => column[m]!), -1],
      value: target[m]!,
    });
  // The motion's residual m = W x - w, one variable per motion row.
  const rates: ActiveSet.IRow[] = motion.map(
    (row: solveXpbdSupportCascade.IMotion, i: number): ActiveSet.IRow => ({
      indices: [
        ...row.weights.map((_: number, s: number): number => s),
        moved + i,
      ],
      weights: [...row.weights, -1],
      value: row.value,
    }),
  );
  const weigh = (from: number, to: number): number[] =>
    new Array<number>(count)
      .fill(REGULARIZATION)
      .map((value: number, i: number): number =>
        i >= from && i < to ? 1 : value,
      );
  const fix = (
    solution: number[],
    from: number,
    to: number,
  ): ActiveSet.IRow[] =>
    solution.slice(from, to).map(
      (value: number, i: number): ActiveSet.IRow => ({
        indices: [from + i],
        weights: [1],
        value,
      }),
    );
  const zero: number[] = new Array<number>(count).fill(0);
  let fixed: ActiveSet.IRow[] = [];
  if (relaxed) {
    const hold: number[] | null = level(
      weigh(held, count),
      zero,
      equalities,
      inequalities,
      keys,
      [],
    );
    if (hold === null) return null;
    fixed = fix(hold, held, count);
  }
  const first: number[] | null = level(
    weigh(wrench, moved),
    zero,
    [...equalities, ...fixed],
    inequalities,
    keys,
    warm.first,
  );
  if (first === null) return null;
  const second: number[] | null = level(
    weigh(moved, held),
    zero,
    [...equalities, ...fixed, ...fix(first, wrench, moved), ...rates],
    inequalities,
    keys,
    warm.second,
  );
  return (second ?? first).slice(0, size);
}

/**
 * The input and the warm store of solveXpbdSupportCascade.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the input's members and the warm store's.
 * @evidence contracts/development/design.md#principled-representation Dense rows of velocity changes per unit impulse, newton-second targets, motion rows of velocity changes per unit impulse with their asked change per second, and the active sets as row keys.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Built by solveXpbdArticulationContacts; the warm store is kept by the world per tree.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is required but `bounds`, whose absence is no bounded group.
 */
export namespace solveXpbdSupportCascade {
  /** One tree's program. */
  export interface IInput {
    /**
     * Each support row's velocity change per unit impulse of every unknown,
     * rows then actuators.
     */
    k: readonly number[][];

    /** Each support row's velocity change under the motors without the unknowns. */
    u: readonly number[];

    /**
     * Each unknown's ground-reaction wrench per unit impulse, force then moment
     * over the lever.
     */
    columns: readonly number[][];

    /** The ground-reaction wrench the rows should add, over the substep. */
    target: readonly number[];

    /** The support rows and patches. */
    set: Contacts.ISet;

    /** The actuated axes, in the unknowns' order after the rows. */
    actuators: readonly Contacts.IActuator[];

    /**
     * Level two's motion rows: what the posture's rates and the root's spin
     * should be after the step.
     */
    motion: readonly IMotion[];

    /** Groups of normal rows whose summed impulse is bounded; none when absent. */
    bounds?: readonly IBound[];

    /**
     * The tree's active sets from the previous substep, rewritten with this
     * one's.
     */
    warm: IWarm;
  }

  /**
   * One motion row: a velocity after the step, linear in the unknowns, and the
   * change in it the row asks of them.
   */
  export interface IMotion {
    /**
     * The velocity's change per unit impulse of every unknown, rows then
     * actuators.
     */
    weights: readonly number[];

    /**
     * The change asked: the servo's velocity less the velocity without the
     * unknowns, per second.
     */
    value: number;
  }

  /** A group of normal rows whose summed added impulse is bounded. */
  export interface IBound {
    /** The rows' indices. */
    rows: readonly number[];

    /**
     * The largest summed impulse they may add, newton seconds; negative takes
     * back part of the contact passes'.
     */
    impulse: number;
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
 * One level: the warm active-set solve, else the interior-point solve; the warm
 * keys become the level's active set, or none after the fallback.
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
 * The rows whose holds are independent. A row reads its body's velocity change
 * through its own unit impulse, `(r x d, d)`, so the rows of one patch on one
 * rigid body are dependent exactly when those functionals are: four coplanar
 * points span three. Gram-Schmidt over each patch's functionals, normals first,
 * keeps a row whose functional leaves more than `sqrt(eps)` of itself outside
 * the ones kept; the others hold with them, and leaving them out keeps the
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

/**
 * The rows' violation an interior-point solve may leave and still count as
 * solved: the wrench allocation's own acceptance
 * (`distributePhysicalSupportWrench`).
 */
const ACCEPTANCE: number = 1e-6;
