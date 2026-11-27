import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import type { HumanQuadraticPreparation as Preparation } from "./HumanQuadraticPreparation";
import type { HumanQuadraticWorkspace as Workspace } from "./HumanQuadraticWorkspace";

/*
 * What the interior-point solve (`HumanQuadraticInterior`) carries between the
 * solves of one caller's session (one optimisation's subproblems), and the warm
 * start it makes from the last one.
 */
export namespace HumanQuadraticInteriorSession {
  /*
   * One caller's session of solves.
   */
  export interface ISession extends Preparation.IOwner {
    /*
     * The variables' and cost's scales of the session's first solve, which
     * every later solve of the session is scaled by
     * (`HumanQuadraticPreparation.IScaling`).
     */
    scaling?: Preparation.IScaling;

    /*
     * The solver's scratch, kept for programs of the same sizes.
     */
    work?: ISessionWork;

    /*
     * The last converged solve's primal-dual point, for a next program of the
     * same rows; the caller clears it for programs of other rows.
     */
    point?: IPoint;
  }

  /*
   * A converged primal-dual point in the program's own units: the variables `x
   * = D x-bar`, and per row end (2r the upper, 2r + 1 the lower) its slack `t =
   * t-bar / E`, its excess `e = e-bar / E`, and its two multipliers `E
   * lambda-bar / c` and `E nu-bar / c`.
   */
  export interface IPoint {
    /*
     * The variables.
     */
    x: Float64Array;

    /*
     * Each end's slack.
     */
    t: Float64Array;

    /*
     * Each end's multiplier.
     */
    lambda: Float64Array;

    /*
     * Each soft end's excess.
     */
    e: Float64Array;

    /*
     * Each soft end's excess multiplier.
     */
    nu: Float64Array;
  }

  /*
   * Save a converged point in the program's own units.
   * Parameter s: The scaled program it was solved on.
   * Parameter x: The scaled variables.
   * Parameter t: The scaled slacks.
   * Parameter lambda: The scaled multipliers.
   * Parameter e: The scaled excesses.
   * Parameter nu: The scaled excess multipliers.
   * Returns: The point.
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

  /*
   * A warm start from a saved point on a program of the same rows: the point
   * read on this program's scaling, each slack taken where the new bounds put
   * it at the point's variables (`t = b - c.x + e`, so the rows' equations
   * hold), then Mehrotra's shift of the slacks and multipliers into the
   * interior (Mehrotra 1992, "On the implementation of a primal-dual interior
   * point method", SIAM J Optim 2:575, section 7; Nocedal and Wright 2006,
   * section 14.2): with the slacks `s` (every live end's `t` and every soft
   * end's `e`) and their multipliers `z`, `s += max(-1.5 min s, 0)`, `z +=
   * max(-1.5 min z, 0)`, then `s += s.z / (2 sum z)` and `z += s.z / (2 sum
   * s)`.
   * Parameter s: The scaled program.
   * Parameter point: The saved point.
   * Parameter live: Whether each end is read.
   * Parameter soft: Whether each end is soft.
   * Parameter free: Whether each end is an equation's.
   * Parameter bound: Each end's bound, scaled.
   * Parameter x: The solve's variables, written here.
   * Parameter t: Its slacks, written here.
   * Parameter lambda: Its multipliers, written here.
   * Parameter e: Its excesses, written here.
   * Parameter nu: Its excess multipliers, written here.
   * Parameter value: An m-sized scratch for the rows' values.
   * Returns: Whether a start was made; false where the point's sizes are not
   * the program's or the shift leaves a slack or a multiplier not positive,
   * the solve then starting cold.
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
    return interior;
  }

  /*
   * The converged iterate in the problem's own units: `x = D x`, each row's
   * value `E^-1 (a.x)`, a hard row's held within its interval, and its
   * multiplier `E (lambda_upper - lambda_lower) / c`, the sign the OSQP solve's
   * multipliers have.
   * Parameter s: The scaled program.
   * Parameter x: The scaled variables.
   * Parameter value: The rows' scaled values.
   * Parameter lambda: The scaled multipliers.
   * Returns: The state.
   */
  export function unscaled(
    s: B.IScaled,
    x: Float64Array,
    value: Float64Array,
    lambda: Float64Array,
  ): IAutoMovieMotionHumanQuadraticProgram.IState {
    const out: IAutoMovieMotionHumanQuadraticProgram.IState = {
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

/*
 * The record of `ISessionWork`'s site.
 */
type ISessionWork = { n: number; m: number; work: Workspace.IWork };
