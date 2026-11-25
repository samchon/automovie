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
 * A trajectory's interpolant between its waypoints and subdivision of the
 * intervals whose played geometry fails admission.
 *
 * The arms are played back, and read between waypoints, on one minimum-jerk
 * path through the waypoints (`hermite`). `HumanArmTrajectoryStretch` reads
 * the actual sites and clearances on the frame grid, then splits intervals
 * where the course fails. An interval that holds no inner frame is already
 * at frame resolution.
 */
export namespace HumanArmRefine {
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

