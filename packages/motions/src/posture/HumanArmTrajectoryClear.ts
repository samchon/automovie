import { Vector3, physicalShapeNormal } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryJacobians as J } from "./HumanArmTrajectoryJacobians";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * The detour that lays a transport of an arms' course clear of the body
 * (`HumanArmTrajectoryLaid`): where the course's reading finds an arm's
 * probe inside a shape past what the admission allows, or a corner of the
 * body inside an arm's collider, the least change of that arm's
 * coordinates that brings every pair of that waypoint to its bound, by the
 * pairs' own linearisation (the convex subproblem's rows,
 * `HumanArmTrajectoryConvex`: a pair's distance along its normal on the
 * point Jacobian), and the change laid over the transport as a smooth bump
 * of its path's share, whole at the waypoint's share and nothing at either
 * end, so the transport's ends and its hold stay as they were. A via
 * configuration on a blended path is how a planner lays a path round an
 * obstacle without optimising it (the approach and retreat of a reach);
 * its place and its size here are the reading's own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is corrected, by which linearisation, how the change is laid over the transport and what stays.
 * @evidence contracts/development/design.md#principled-representation A detour is the share of the path it is centred on and each arm's change of coordinates there.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record, its producer and the bump the course lays it by, read by the laid course alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pairs, their bounds and their normals are the model's; no clearance of the detour's own is defined.
 */
export namespace HumanArmTrajectoryClear {
  /**
   * A change of a transport's path laid as a bump.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both members and their units.
   * @evidence contracts/development/design.md#principled-representation The path's share the bump is whole at, and each arm's coordinate change there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by `detour`, read by the laid course through `bump`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Coordinates in the model's own units, one entry per arm of the problem.
   */
  export interface IDetour {
    /** The share of the transport's path the change is whole at, in (0, 1). */
    share: number;

    /** Each arm's change of coordinates there, the model's units; zeros for an arm left as it is. */
    delta: number[][];

    /** How deep the pair the detour answers was, millimetres past its bound, before it. */
    depth: number;
  }

  /** The largest change of any coordinate a transport's first detour makes, coordinate units: the arm optimiser's first trust region (`HumanArmOptimiser`'s schedule), inside which the pairs' linearisation is trusted. */
  export const REGION: number = 8;

  /** The widest region a detour may grow to, coordinate units: the arm optimiser's widest (`HumanArmOptimiser`'s schedule). */
  export const WIDEST: number = 32;

  /** The factor a transport's region grows by after a detour that made it shallower: TrajOpt's trust_expand_ratio, the arm optimiser's own. */
  export const EXPAND: number = 1.5;

  /**
   * The detour of a transport's deepest waypoint, none where every pair of
   * every waypoint inside the transport is within what the admission allows.
   *
   * @param c The course's context.
   * @param x The course's coordinates, each arm at each waypoint.
   * @param at Their reading (`M.evaluate`).
   * @param from The transport's first waypoint.
   * @param to Its last waypoint.
   * @param shares The share of its path each waypoint of the transport stands at, by waypoint.
   * @param region The largest change of any coordinate the detour may make, coordinate units.
   * @returns The detour, or none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, what is returned and when nothing is.
   * @evidence contracts/development/implementation.md#principled-implementation The waypoint with the deepest pair past the admission's slack (`T.SKIN`); at it every pair within the tolerance of its bound linearised along its normal on the arm's point Jacobian (a probe's own, a body corner carried by the arm's segment the other way), and the least-norm change meeting each at its bound by an active set on the normal equations.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The deepest waypoint, its rows, the least-norm change.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the model's pairs and normals are read; a change that cannot be found (no row moves) is no detour.
   * @evidence contracts/development/implementation.md#efficient-algorithms One scan of the reading's pairs over the transport, one Jacobian reading, and a normal-equation solve of at most the waypoint's pairs in the arm's free coordinates.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The reading is the caller's, read here once.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record and retains nothing.
   */
  export function detour(
    c: M.IContext,
    x: readonly (readonly number[])[][],
    at: M.IEvaluation,
    from: number,
    to: number,
    shares: readonly number[],
    region: number,
  ): IDetour | undefined {
    // The deepest pair inside the transport, past the admission's slack.
    let arm: number = -1;
    let waypoint: number = -1;
    let deepest: number = T.SKIN + M.TOLERANCE;
    x.forEach((_: readonly (readonly number[])[], a: number): void => {
      for (let k: number = from + 1; k < to; ++k) {
        const pairs: M.IEvaluation["pairs"][number][number] | undefined = at.pairs[a]?.[k];
        if (pairs === undefined) continue;
        for (const pair of [...pairs.deepest.values(), ...pairs.embedded.values()])
          if (!pair.rested && pair.short > deepest) {
            deepest = pair.short;
            arm = a;
            waypoint = k;
          }
      }
    });
    if (arm < 0) return undefined;

    // Each pair near its bound there, a row: the change of its distance by
    // a change of the arm's coordinates, millimetres per unit, and what the
    // distance must gain to reach its bound less the tolerance.
    const all: J.IJacobian[][] = J.of(c, x, at);
    const jac: J.IJacobian = all[arm]![waypoint]!;
    const frame: G.IFrame = c.frames[arm]![waypoint]!;
    const placed: G.IPlaced = at.placed[arm]![waypoint]!;
    const pairs: NonNullable<M.IEvaluation["pairs"][number][number]> = at.pairs[arm]![waypoint]!;
    const rows: { coef: number[]; gain: number }[] = [];
    // A declared rest is drawn to its contact, not cleared of it.
    for (const pair of pairs.deepest.values()) {
      if (pair.rested || pair.short < -M.TOLERANCE) continue;
      const g: IAutoMovieVector3 = S.normal(frame, pair.shape, placed.probes[pair.probe]![0]);
      rows.push({
        coef: jac.probes[pair.probe]!.map((v: IAutoMovieVector3): number => Vector3.dot(v, g)),
        gain: pair.short + M.TOLERANCE,
      });
    }
    for (const pair of pairs.embedded.values()) {
      if (pair.rested || pair.short < -M.TOLERANCE) continue;
      const p: IAutoMovieVector3 = frame.body[pair.corner]!.point;
      const g: IAutoMovieVector3 = physicalShapeNormal(
        pair.shape.pose,
        pair.shape.shape,
        p,
        Vector3.normalize(Vector3.subtract(p, pair.shape.centre)),
      );
      rows.push({
        coef: J.carried(at, all, arm, waypoint, pair.owner, p).map(
          (v: IAutoMovieVector3): number => -Vector3.dot(v, g),
        ),
        gain: pair.short + M.TOLERANCE,
      });
    }
    const step: number[] | undefined = least(rows, region);
    if (step === undefined) return undefined;
    const delta: number[][] = x.map((own: readonly (readonly number[])[]): number[] =>
      new Array<number>(own[0]!.length).fill(0));
    c.free[arm]!.forEach((d: number, f: number): void => {
      delta[arm]![d] = step[f]!;
    });
    return { share: shares[waypoint]!, delta, depth: deepest };
  }

  /**
   * A detour's weight at a share of the path: 1 at its own share, 0 at both
   * ends, a cubic ease (`3u^2 - 2u^3`) on each side, so the path leaves and
   * meets its ends and the detour's peak with no step in its slope.
   *
   * @param share The path's share.
   * @param at The detour's share.
   * @returns The weight in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the weight's values at the ends and the peak and its shape.
   * @evidence contracts/development/implementation.md#principled-implementation The cubic ease of each side's share has zero slope at both of its ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One side's share, one cubic.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A share outside [0, 1] weighs nothing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bump(share: number, at: number): number {
    if (!(share > 0 && share < 1)) return 0;
    const u: number = share <= at ? share / at : (1 - share) / (1 - at);
    return u * u * (3 - 2 * u);
  }
}

/**
 * The change meeting the rows that need a gain, by damped least squares
 * (Wampler 1986, IEEE Trans SMC 16:93; Nakamura and Hanafusa 1986, J Dyn
 * Syst Meas Control 108:163): `A' (A A' + lambda^2 I)^-1 gain`, the damping
 * a share of the strongest row's own (`DAMPING`), so a row nearly
 * insensitive to every coordinate cannot ask an unbounded change; and the
 * change held inside a region, where the rows' linearisation is trusted,
 * the next round meeting what is left.
 */
function least(rows: readonly { coef: number[]; gain: number }[], region: number): number[] | undefined {
  const chosen: { coef: number[]; gain: number }[] = rows.filter(
    (row: { coef: number[]; gain: number }): boolean => row.gain > 0,
  );
  if (chosen.length === 0) return undefined;
  const size: number = chosen[0]!.coef.length;
  const gram: number[][] = chosen.map((p: { coef: number[] }): number[] =>
    chosen.map((q: { coef: number[] }): number =>
      p.coef.reduce((s: number, v: number, d: number): number => s + v * q.coef[d]!, 0)));
  const strongest: number = Math.max(...gram.map((row: number[], i: number): number => row[i]!));
  if (!(strongest > 0)) return undefined;
  gram.forEach((row: number[], i: number): void => {
    row[i]! += DAMPING * strongest;
  });
  const y: number[] | undefined = solve(gram, chosen.map((row: { gain: number }): number => row.gain));
  if (y === undefined) return undefined;
  const step: number[] = new Array<number>(size).fill(0);
  chosen.forEach((row: { coef: number[] }, r: number): void => {
    row.coef.forEach((v: number, d: number): void => {
      step[d]! += v * y[r]!;
    });
  });
  const largest: number = Math.max(...step.map(Math.abs));
  if (!Number.isFinite(largest) || largest === 0) return undefined;
  return largest > region ? step.map((v: number): number => (v * region) / largest) : step;
}

/** The damping of the detour's least squares, a share of the strongest row's squared norm (provisional: a row a tenth as sensitive as the strongest is met about halfway). */
const DAMPING: number = 0.01;

/** A small dense system by Gaussian elimination with partial pivoting; none when singular. */
function solve(a: number[][], b: number[]): number[] | undefined {
  const n: number = b.length;
  const m: number[][] = a.map((row: number[], i: number): number[] => [...row, b[i]!]);
  for (let col: number = 0; col < n; ++col) {
    let pivot: number = col;
    for (let r: number = col + 1; r < n; ++r)
      if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
    if (!(Math.abs(m[pivot]![col]!) > 0)) return undefined;
    [m[col], m[pivot]] = [m[pivot]!, m[col]!];
    for (let r: number = col + 1; r < n; ++r) {
      const f: number = m[r]![col]! / m[col]![col]!;
      for (let k: number = col; k <= n; ++k) m[r]![k]! -= f * m[col]![k]!;
    }
  }
  const out: number[] = new Array<number>(n).fill(0);
  for (let r: number = n - 1; r >= 0; --r) {
    let s: number = m[r]![n]!;
    for (let k: number = r + 1; k < n; ++k) s -= m[r]![k]! * out[k]!;
    out[r] = s / m[r]![r]!;
  }
  return out;
}
