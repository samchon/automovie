import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanMinimumJerkSpline } from "./HumanMinimumJerkSpline";

/** The record of `IPrepareHermiteResult2`'s site. */
type IPrepareHermiteResult2 = {
  readonly knot: number;
  readonly coordinates: number[];
};

/** The record of `IPrepareHermiteResult`'s site. */
type IPrepareHermiteResult = {
  readonly knot: number;
  readonly coordinates: number[];
};

/**
 * A trajectory's interpolant between its waypoints, and where the waypoints are
 * too far apart for the path their sites must follow.
 *
 * The arms are played back, and read between waypoints, on one minimum-jerk
 * path through the waypoints (`hermite`). On the hold, the site's path
 * interpolated through the waypoints' sites by that same path must stay within
 * `TOLERANCE` of the act's own site at every instant of the frame grid, so no
 * stroke is cut short between samples: the waypoints' sites are all the
 * optimiser knows of the act between them. An interval whose site strays is
 * split at the grid instant in its middle (`split`), and an interval that holds
 * no grid instant is never split, so the waypoints are never finer than the
 * frame grid. What the arms themselves must meet between waypoints, their
 * clearance, their speed and their contact, is read on the played trajectory by
 * `HumanArmTrajectoryAdmission`.
 */
export namespace HumanArmRefine {
  /**
   * The intervals whose waypoints do not bound their site's path: each `k`
   * whose interval from waypoint `k` to `k + 1` holds an instant of the frame
   * grid at which its interpolated site leaves the act's own.
   *
   * @param c The waypoints' context.
   * @param fine The context at the frame grid's instants over the same span,
   *   the first and the last the waypoints'.
   * @returns The intervals to split, ascending.
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
   * split at the grid instant in its middle. Waypoints that are grid instants
   * stay grid instants however often they are split, so where every grid
   * instant of a stretch is a waypoint, what the waypoints are bounded by is
   * what the grid reads.
   *
   * @param knots The waypoints' indices in the frame grid, ascending.
   * @param split The intervals, by their first waypoint; an interval that holds
   *   no grid instant is left as it is.
   * @returns The indices, ascending.
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
   * The trajectory's interpolant: Flash and Hogan's minimum-jerk path through
   * the waypoints at their seconds (`HumanMinimumJerkSpline`, Flash and Hogan
   * 1985), a quintic on each interval, continuous through its snap at every
   * interior waypoint and at rest in velocity and acceleration at the first and
   * the last.
   *
   * @param times Ordered waypoint seconds paired with the coordinate rows.
   * @param x Coordinates at every waypoint, with a consistent dimension.
   * @param seconds The instant to read, seconds.
   * @returns Fresh interpolated coordinates, clamped to the endpoint rows.
   */
  export function hermite(
    times: readonly number[],
    x: readonly (readonly number[])[],
    seconds: number,
  ): number[] {
    return prepareHermite(times, x)(seconds).coordinates;
  }

  /**
   * Bind a solved course's waypoint seconds and coordinate rows: the waypoints'
   * velocities and accelerations on the minimum-jerk path are solved once. A
   * sample receives fresh coordinates and the preceding knot index, which also
   * identifies the shoulder chart used by playback. Endpoint rows stay held
   * outside the span. Read-only inputs remain unchanged until the prepared
   * reader is released.
   */
  export function prepareHermite(
    times: readonly number[],
    x: readonly (readonly number[])[],
  ): (seconds: number) => IPrepareHermiteResult {
    const n: number = times.length;
    const solved: HumanMinimumJerkSpline.IDerivatives =
      HumanMinimumJerkSpline.derivatives(times, x);
    return (seconds: number): IPrepareHermiteResult2 => {
      if (seconds <= times[0]!) return { knot: 0, coordinates: [...x[0]!] };
      if (seconds >= times[n - 1]!)
        return { knot: n - 1, coordinates: [...x[n - 1]!] };
      const i: number = knot(times, seconds);
      const h: number = times[i + 1]! - times[i]!;
      return {
        knot: i,
        coordinates: HumanMinimumJerkSpline.quintic(
          x[i]!,
          x[i + 1]!,
          solved.velocities[i]!,
          solved.velocities[i + 1]!,
          solved.accelerations[i]!,
          solved.accelerations[i + 1]!,
          h,
          (seconds - times[i]!) / h,
        ),
      };
    };
  }
}
/** The last knot at or before this second, starting at zero before the span. */
function knot(times: readonly number[], seconds: number): number {
  let low: number = 0;
  let high: number = times.length - 1;
  while (low < high) {
    const middle: number = (low + high + 1) >> 1;
    if (times[middle]! <= seconds) low = middle;
    else high = middle - 1;
  }
  return low;
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

/**
 * Whether a hold interval's interpolated site leaves the act's own site by more
 * than `TOLERANCE` at an inner instant.
 */
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

/**
 * How far an interpolated site may leave the act's own between waypoints,
 * metres: the millimetre the solve lets a hand miss its site at a waypoint
 * (`HumanArmTrajectoryModel.TOLERANCE`).
 */
const TOLERANCE: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;
