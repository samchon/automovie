import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * A trajectory's interpolant between its waypoints, and where the waypoints
 * are too far apart for the path their sites must follow.
 *
 * The arms are played back, and read between waypoints, on one cubic
 * Hermite through the waypoints (`hermite`). On the hold, the site's path
 * interpolated through the waypoints' sites by that same Hermite must stay
 * within `TOLERANCE` of the act's own site at every instant of the frame
 * grid, so no stroke is cut short between samples: the waypoints' sites are
 * all the optimiser knows of the act between them. An interval whose site
 * strays is split at the grid instant in its middle (`split`), and an
 * interval that holds no grid instant is never split, so the waypoints are
 * never finer than the frame grid.
 * What the arms themselves must meet between waypoints, their clearance,
 * their speed and their contact, is read on the played trajectory by
 * `HumanArmTrajectoryAdmission`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the interpolant, the one condition read here, how it is read, the cap and the owner of the arms' own reading.
 * @evidence contracts/development/design.md#principled-representation The waypoints' spacing on the hold is derived from the site's own path, read against the act's site at the grid's instants, not from a declared period.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The interpolant, the site reading and the split, read by `HumanArmTrajectory.solve` and `HumanArmTrajectoryAdmission`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One rule for every hold, still or stroked.
 */
export namespace HumanArmRefine {
  /**
   * The intervals whose waypoints do not bound their site's path: each `k`
   * whose interval from waypoint `k` to `k + 1` holds an instant of the
   * frame grid at which its interpolated site leaves the act's own.
   *
   * @param c The waypoints' context.
   * @param fine The context at the frame grid's instants over the same span, the first and the last the waypoints'.
   * @returns The intervals to split, ascending.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what an interval must bound and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The site's interpolant is read against the site itself at every grid instant inside the interval, the check-and-refine loop of a continuous check on the one quantity the waypoints sample from the act.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over intervals; per interval the site reading. A lazy arm-local workspace reuses only the held-site arrays, refreshing their original scalar inputs before each interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every arm and every instant of the frame grid inside an interval is read; an interval below two frames is left as it is, never forced.
   * @evidence contracts/development/implementation.md#efficient-algorithms One Hermite read of three numbers per arm and inner grid instant; no arm is placed. Held-site index, time and point arrays are reused across intervals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only private array storage is shared across held intervals; every site's presence, time and current point components are read again in their original order, so no target or interpolation result is replayed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Lazily holds one workspace per actually read arm, each bounded by that call's largest hold, and releases all workspaces on return or throw. Only interval indices escape.
   */
  export function unbounded(c: M.IContext, fine: M.IContext): number[] {
    const out: number[] = [];
    const ft: readonly number[] = fine.times;
    let paths: (ISitePath | undefined)[] | undefined;
    for (let k: number = 0; k + 1 < c.n; ++k) {
      const from: number = c.times[k]!;
      const to: number = c.times[k + 1]!;
      const inner: number[] = [];
      ft.forEach((t: number, g: number): void => {
        if (t > from + 1e-9 && t < to - 1e-9) inner.push(g);
      });
      if (inner.length === 0) continue;
      if (strayed(c, fine, k, inner, (paths ??= []))) out.push(k);
    }
    return out;
  }

  /**
   * The waypoints, as instants of the frame grid, with each given interval
   * split at the grid instant in its middle. Waypoints that are grid
   * instants stay grid instants however often they are split, so where
   * every grid instant of a stretch is a waypoint, what the waypoints are
   * bounded by is what the grid reads.
   *
   * @param knots The waypoints' indices in the frame grid, ascending.
   * @param split The intervals, by their first waypoint; an interval that holds no grid instant is left as it is.
   * @returns The indices, ascending.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the indices, which intervals are split, where, and what is left.
   * @evidence contracts/development/implementation.md#principled-implementation The dyadic refinement of a continuous check on the grid the check itself reads, so the refinement ends exactly on that grid.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered traversal appends each waypoint and its interval's optional middle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No instant off the grid is made and no interval is forced below one grid cell.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N S) for N waypoints and S intervals by the membership lookup; output O(N + S).
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two lists.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh array and retains nothing.
   */
  export function split(
    knots: readonly number[],
    split: readonly number[],
  ): number[] {
    const out: number[] = [];
    knots.forEach((g: number, k: number): void => {
      out.push(g);
      if (split.includes(k) && knots[k + 1]! - g >= 2)
        out.push(Math.floor((g + knots[k + 1]!) / 2));
    });
    return out;
  }

  /**
   * A cubic Hermite through waypoints at their seconds, tangents by central
   * differences in time, still at both ends: the trajectory's interpolant.
   *
   * @param times Ordered waypoint seconds paired with the coordinate rows.
   * @param x Coordinates at every waypoint, with a consistent dimension.
   * @param seconds The instant to read, seconds.
   * @returns Fresh interpolated coordinates, clamped to the endpoint rows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the ordered time/coordinate pairing, endpoint behavior, central-difference tangents and fresh numeric result.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing cubic Hermite basis, zero endpoint tangents and central differences divided by their actual neighboring time spans.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Endpoint copies precede an interval search, two tangents and the original componentwise four-term polynomial.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps interval ties, exponent and addition grouping, endpoint copies and each actual coordinate calculation; no resampling, angle rounding or interpolation cache is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Searches at most N waypoint times and computes two D-component tangents and D results, costing O(N+D) work and O(D) temporary/output space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the selected interval's time span and four scalar basis values across coordinates; all callers use this same interpolant.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh coordinates, with call-local tangent arrays and no retained input or result history.
   */
  export function hermite(
    times: readonly number[],
    x: readonly (readonly number[])[],
    seconds: number,
  ): number[] {
    const n: number = times.length;
    if (seconds <= times[0]!) return [...x[0]!];
    if (seconds >= times[n - 1]!) return [...x[n - 1]!];
    let k: number = 0;
    while (k + 2 < n && times[k + 1]! <= seconds) ++k;
    const h: number = times[k + 1]! - times[k]!;
    const u: number = (seconds - times[k]!) / h;
    const tangent: (j: number) => number[] = (j: number): number[] =>
      j === 0 || j === n - 1
        ? new Array(x[0]!.length).fill(0)
        : x[j + 1]!.map(
            (v: number, d: number): number =>
              (v - x[j - 1]![d]!) / (times[j + 1]! - times[j - 1]!),
          );
    const m0: number[] = tangent(k);
    const m1: number[] = tangent(k + 1);
    const h00: number = 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10: number = u ** 3 - 2 * u ** 2 + u;
    const h01: number = -2 * u ** 3 + 3 * u ** 2;
    const h11: number = u ** 3 - u ** 2;
    return x[k]!.map(
      (v: number, d: number): number =>
        h00 * v + h10 * h * m0[d]! + h01 * x[k + 1]![d]! + h11 * h * m1[d]!,
    );
  }
}

/** Private storage reused only while one unbounded call reads held intervals. */
interface ISitePath {
  /** Current held-site indices, rebuilt in source order. */
  held: number[];

  /** Current held-site times, read again before every interval. */
  times: number[];

  /** Current point rows in held-site order. */
  points: number[][];

  /** Reusable rows up to this arm's largest actually read hold. */
  rows: number[][];
}

/** Whether a hold interval's interpolated site leaves the act's own site by more than `TOLERANCE` at an inner instant. */
function strayed(
  c: M.IContext,
  fine: M.IContext,
  k: number,
  inner: readonly number[],
  paths: (ISitePath | undefined)[],
): boolean {
  return c.sites.some(
    (sites: readonly (M.ISite | undefined)[], a: number): boolean => {
      if (sites[k] === undefined || sites[k + 1] === undefined) return false;
      const path: ISitePath = (paths[a] ??= {
        held: [],
        times: [],
        points: [],
        rows: [],
      });
      const held: number[] = path.held;
      held.length = 0;
      sites.forEach((s: M.ISite | undefined, j: number): void => {
        if (s !== undefined) held.push(j);
      });
      const times: number[] = path.times;
      times.length = held.length;
      held.forEach((j: number, i: number): void => {
        times[i] = c.times[j]!;
      });
      const points: number[][] = path.points;
      points.length = held.length;
      held.forEach((j: number, i: number): void => {
        const p: IAutoMovieVector3 = sites[j]!.point;
        const row: number[] = (path.rows[i] ??= []);
        row[0] = p.x;
        row[1] = p.y;
        row[2] = p.z;
        points[i] = row;
      });
      return inner.some((g: number): boolean => {
        const actual: M.ISite | undefined = fine.sites[a]![g];
        if (actual === undefined) return false;
        const [px, py, pz]: [number, number, number] = HumanArmRefine.hermite(
          times,
          points,
          fine.times[g]!,
        ) as [number, number, number];
        return (
          Math.hypot(
            px - actual.point.x,
            py - actual.point.y,
            pz - actual.point.z,
          ) > TOLERANCE
        );
      });
    },
  );
}

/** How far an interpolated site may leave the act's own between waypoints, metres: the millimetre the solve lets a hand miss its site at a waypoint (`HumanArmTrajectoryModel.TOLERANCE`). */
const TOLERANCE: number = M.TOLERANCE / 1000;
