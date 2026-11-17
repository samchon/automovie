import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import type { HumanQuadraticPreparation as Preparation } from "./HumanQuadraticPreparation";
import type { HumanQuadraticProgram as Q } from "./HumanQuadraticProgram";
import type { HumanQuadraticWorkspace as Workspace } from "./HumanQuadraticWorkspace";

/**
 * What the interior-point solve (`HumanQuadraticInterior`) carries between
 * the solves of one caller's session (one optimisation's subproblems), and
 * the warm start it makes from the last one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a session holds, who owns it and what a warm start is made from.
 * @evidence contracts/development/design.md#principled-representation The session's scales, scratch and last primal-dual point, the point in the program's own units so a solve on other row scales reads it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The session record, the point, its saving and the warm start, read by `HumanQuadraticInterior` alone and held by `HumanArmOptimiser`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No answer is reused: a warm start is only a starting point, and a warm solve that misses its accuracy is solved again cold.
 */
export namespace HumanQuadraticInteriorSession {
  /**
   * One caller's session of solves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, who sets it and when the caller clears the point.
   * @evidence contracts/development/design.md#principled-representation The first solve's variable and cost scales, the solver's n- and m-sized scratch, and the last converged point of a program of the same rows.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Set by the solve; the caller clears `point` when its next programs have other rows (a new linearisation).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A point whose sizes are not the next program's is not used.
   */
  export interface ISession {
    /** The variables' and cost's scales of the session's first solve, which every later solve of the session is scaled by (`HumanQuadraticPreparation.IScaling`). */
    scaling?: Preparation.IScaling;

    /** The solver's scratch, kept for programs of the same sizes. */
    work?: { n: number; m: number; work: Workspace.IWork };

    /** The last converged solve's primal-dual point, for a next program of the same rows; the caller clears it for programs of other rows. */
    point?: IPoint;
  }

  /**
   * A converged primal-dual point in the program's own units: the variables
   * `x = D x-bar`, and per row end (2r the upper, 2r + 1 the lower) its
   * slack `t = t-bar / E`, its excess `e = e-bar / E`, and its two
   * multipliers `E lambda-bar / c` and `E nu-bar / c`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's units and indexing.
   * @evidence contracts/development/design.md#principled-representation The equilibration's inverse applied to every component, so the point reads alike on any scaling.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Saved and read by `save` and `warm` alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Sizes are carried so a point of another program is refused.
   */
  export interface IPoint {
    /** The variables. */
    x: Float64Array;

    /** Each end's slack. */
    t: Float64Array;

    /** Each end's multiplier. */
    lambda: Float64Array;

    /** Each soft end's excess. */
    e: Float64Array;

    /** Each soft end's excess multiplier. */
    nu: Float64Array;
  }

  /**
   * Save a converged point in the program's own units.
   *
   * @param s The scaled program it was solved on.
   * @param x The scaled variables.
   * @param t The scaled slacks.
   * @param lambda The scaled multipliers.
   * @param e The scaled excesses.
   * @param nu The scaled excess multipliers.
   * @returns The point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' scaling and the result's units.
   * @evidence contracts/development/implementation.md#principled-implementation The equilibration's inverse: `x = D x-bar`, a row's slack and excess over its scale, its multipliers times its scale over the cost's, the relations the scaled conditions hold under.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the variables and one over the ends.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every component is converted; none is rounded or dropped.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n + m).
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A conversion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fresh arrays the session holds until the next save or its caller drops it.
   */
  export function save(
    s: B.IScaled,
    x: Float64Array,
    t: Float64Array,
    lambda: Float64Array,
    e: Float64Array,
    nu: Float64Array,
  ): IPoint {
    const out: IPoint = {
      x: new Float64Array(s.n),
      t: new Float64Array(t.length),
      lambda: new Float64Array(t.length),
      e: new Float64Array(t.length),
      nu: new Float64Array(t.length),
    };
    for (let i: number = 0; i < s.n; ++i) out.x[i] = s.d[i]! * x[i]!;
    for (let j: number = 0; j < t.length; ++j) {
      const scale: number = s.e[j >> 1]!;
      out.t[j] = t[j]! / scale;
      out.e[j] = e[j]! / scale;
      out.lambda[j] = (scale * lambda[j]!) / s.c;
      out.nu[j] = (scale * nu[j]!) / s.c;
    }
    return out;
  }

  /**
   * A warm start from a saved point on a program of the same rows: the
   * point read on this program's scaling, each slack taken where the new
   * bounds put it at the point's variables (`t = b - c.x + e`, so the rows'
   * equations hold), then Mehrotra's shift of the slacks and multipliers into
   * the interior (Mehrotra 1992, "On the implementation of a primal-dual
   * interior point method", SIAM J Optim 2:575, section 7; Nocedal and
   * Wright 2006, section 14.2): with the slacks `s` (every live end's `t`
   * and every soft end's `e`) and their multipliers `z`, `s += max(-1.5 min
   * s, 0)`, `z += max(-1.5 min z, 0)`, then `s += s.z / (2 sum z)` and `z +=
   * s.z / (2 sum s)`.
   *
   * @param s The scaled program.
   * @param point The saved point.
   * @param live Whether each end is read.
   * @param soft Whether each end is soft.
   * @param free Whether each end is an equation's.
   * @param bound Each end's bound, scaled.
   * @param x The solve's variables, written here.
   * @param t Its slacks, written here.
   * @param lambda Its multipliers, written here.
   * @param e Its excesses, written here.
   * @param nu Its excess multipliers, written here.
   * @param value An m-sized scratch for the rows' values.
   * @returns Whether a start was made; false where the point's sizes are not the program's or the shift leaves a slack or a multiplier not positive, the solve then starting cold.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the conversion, the slack's reading, the shift with its source and when no start is made.
   * @evidence contracts/development/implementation.md#principled-implementation Mehrotra's starting-point shift, which keeps the iterate at least the products' mean away from every bound, applied to a point of the same program's earlier bounds; the rows' equations hold at the start by the slacks' reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The conversion, the slacks, the shift, the positivity test.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shift's constants are the source's (1.5 and one half); a start that is not interior is refused, never repaired otherwise.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n + Z + m) for Z stored row coefficients.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A starting point only; the solve decides everything from it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes only the solve's own arrays.
   */
  export function warm(
    s: B.IScaled,
    point: IPoint,
    live: Uint8Array,
    soft: Uint8Array,
    free: Uint8Array,
    bound: Float64Array,
    x: Float64Array,
    t: Float64Array,
    lambda: Float64Array,
    e: Float64Array,
    nu: Float64Array,
    value: Float64Array,
  ): boolean {
    if (point.x.length !== s.n || point.t.length !== t.length) return false;
    for (let i: number = 0; i < s.n; ++i) x[i] = point.x[i]! / s.d[i]!;
    for (let r: number = 0; r < s.m; ++r) {
      let sum: number = 0;
      const end: number = s.start[r + 1]!;
      for (let a: number = s.start[r]!; a < end; ++a)
        sum += s.vals[a]! * x[s.cols[a]!]!;
      value[r] = sum;
    }

    // The slacks at the new bounds and the multipliers on this scaling.
    let least: number = Infinity;
    let fewest: number = Infinity;
    for (let j: number = 0; j < t.length; ++j) {
      t[j] = 0;
      e[j] = 0;
      lambda[j] = 0;
      nu[j] = 0;
      if (live[j] === 0) continue;
      const scale: number = s.e[j >> 1]!;
      lambda[j] = (s.c * point.lambda[j]!) / scale;
      if (free[j] === 1) continue;
      if (soft[j] === 1) {
        e[j] = scale * point.e[j]!;
        nu[j] = (s.c * point.nu[j]!) / scale;
        least = Math.min(least, e[j]!);
        fewest = Math.min(fewest, nu[j]!);
      }
      const c: number = (j & 1) === 0 ? value[j >> 1]! : -value[j >> 1]!;
      t[j] = bound[j]! - c + e[j]!;
      least = Math.min(least, t[j]!);
      fewest = Math.min(fewest, lambda[j]!);
    }
    if (least === Infinity) return false;

    // Mehrotra's shift into the interior.
    const primal: number = Math.max(-1.5 * least, 0);
    const dual: number = Math.max(-1.5 * fewest, 0);
    let product: number = 0;
    let slacks: number = 0;
    let multipliers: number = 0;
    const each = (apply: (slack: number, multiplier: number) => void): void => {
      for (let j: number = 0; j < t.length; ++j) {
        if (live[j] === 0 || free[j] === 1) continue;
        apply(t[j]! + primal, lambda[j]! + dual);
        if (soft[j] === 1) apply(e[j]! + primal, nu[j]! + dual);
      }
    };
    each((slack: number, multiplier: number): void => {
      product += slack * multiplier;
      slacks += slack;
      multipliers += multiplier;
    });
    if (!(slacks > 0) || !(multipliers > 0)) return false;
    const towardSlack: number = primal + (0.5 * product) / multipliers;
    const towardMultiplier: number = dual + (0.5 * product) / slacks;
    let interior: boolean = true;
    for (let j: number = 0; j < t.length; ++j) {
      if (live[j] === 0 || free[j] === 1) continue;
      t[j] = t[j]! + towardSlack;
      lambda[j] = lambda[j]! + towardMultiplier;
      if (!(t[j]! > 0) || !(lambda[j]! > 0)) interior = false;
      if (soft[j] === 0) continue;
      e[j] = e[j]! + towardSlack;
      nu[j] = nu[j]! + towardMultiplier;
      if (!(e[j]! > 0) || !(nu[j]! > 0)) interior = false;
    }
    return interior && x.every(Number.isFinite);
  }

  /**
   * The converged iterate in the problem's own units: `x = D x`, each row's
   * value `E^-1 (a.x)`, a hard row's held within its interval, and its
   * multiplier `E (lambda_upper - lambda_lower) / c`, the sign the OSQP
   * solve's multipliers have.
   *
   * @param s The scaled program.
   * @param x The scaled variables.
   * @param value The rows' scaled values.
   * @param lambda The scaled multipliers.
   * @returns The state.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unscaling.
   * @evidence contracts/development/implementation.md#principled-implementation The equilibration's inverse, a hard row's value held within its interval as the OSQP solve holds it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the variables and one over the rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a hard row's value is held, by its own interval.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(n + m).
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A conversion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fresh arrays, the caller's.
   */
  export function unscaled(
    s: B.IScaled,
    x: Float64Array,
    value: Float64Array,
    lambda: Float64Array,
  ): Q.IState {
    const out: Q.IState = {
      x: new Float64Array(s.n),
      z: new Float64Array(s.m),
      y: new Float64Array(s.m),
      status: "solved",
    };
    for (let i: number = 0; i < s.n; ++i) out.x[i] = s.d[i]! * x[i]!;
    for (let r: number = 0; r < s.m; ++r) {
      const held: number =
        s.weight[r]! < 0
          ? Math.min(s.hi[r]!, Math.max(s.lo[r]!, value[r]!))
          : value[r]!;
      out.z[r] = held / s.e[r]!;
      out.y[r] = (s.e[r]! * (lambda[2 * r]! - lambda[2 * r + 1]!)) / s.c;
    }
    return out;
  }
}
