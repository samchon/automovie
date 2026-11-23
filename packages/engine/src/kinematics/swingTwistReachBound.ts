import type {
  IAutoMovieAngleRange,
  IAutoMovieAxisFrame,
  IAutoMovieJointConstraint,
  IAutoMovieRestFrame,
  IAutoMovieSwingTwistBasis,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * A certified upper bound of the farthest swing along one great circle that a
 * joint's flexion and abduction intervals reach with no twist, in closed form,
 * so `swingTwistRegion`'s scan from the far end starts at the bound instead of
 * at half a turn.
 *
 * On an orthonormal clinical basis the untwisted rotation is the abduction
 * after the flexion, a latitude and longitude chart about the abduction axis
 * `a`: the flexion alone sets the direction's part along `a` (`sin f = (d . a)
 * / across`), and the abduction then turns the rest about `a`. Along a great
 * circle `d(s) = cos s u + sin s w` through the rest direction `u` that part is
 * `k sin s` with `k = (w . a) / across`, and the abduction is `atan2(c sin s,
 * cos s)` with `c = a . (u x w)` on the reading whose flexion lies within a
 * quarter turn of rest, half a turn from it on the other reading (`180 - f`).
 * Both are monotone in pieces, so the swings each interval admits are intervals
 * with closed-form ends, and the farthest swing either reading admits bounds
 * the reach. The swing cone only removes directions, so the bound stands with
 * it.
 */
export namespace swingTwistReachBound {
  /**
   * How far past its closed-form end an admitted interval is taken, degrees:
   * past the rounding of the scan's own reading of a direction, far under the
   * scan's half-degree step.
   */
  export const MARGIN: number = 1e-6;

  /**
   * What the scan's grid can read of a ray's reached swings, written beside the
   * bound for a caller that gives the grid's step.
   */
  export interface ISpan {
    /** The scan grid's step, degrees; given by the caller. */
    grid: number;

    /**
     * The farthest grid step, at most half a turn less one step, that lies
     * inside an interval of reached swings, to the margins; 0 when none does.
     * No grid step past it is reached.
     */
    cell: number;

    /**
     * The least swing of the interval of reached swings that holds `cell`,
     * joined with those overlapping it; NaN when no interval is reported.
     */
    low: number;

    /**
     * That interval's greatest swing; NaN when none is reported: the circle
     * passes the abduction axis, where the longitude's closed form does not
     * hold, or another interval reaches into the cell past it.
     */
    high: number;
  }
  /**
   * Prepare a joint's bound.
   *
   * @param constraint The constraint, with flexion and abduction intervals in
   *   clinical degrees.
   * @param frame The rest frame its clinical angles are lifted by.
   * @param basis The joint's swing frame.
   * @param across `(f x u) . a` of that frame.
   * @returns For a great circle's azimuth cosine and sine, an upper bound in
   *   degrees within [0, 180] of every swing the intervals reach on it, 0 when
   *   none is reached, and, when a span is given, what the scan's grid can read
   *   of them ({@link ISpan}); null when an interval is absent or the basis is
   *   not orthonormal to rounding, so the chart's closed forms do not hold.
   */
  export function prepare(
    constraint: IAutoMovieJointConstraint,
    frame: IAutoMovieRestFrame | undefined,
    basis: IAutoMovieSwingTwistBasis.IBasis,
    across: number,
  ):
    | ((
        cosine: number,
        sine: number,
        span?: swingTwistReachBound.ISpan,
      ) => number)
    | null {
    const flexion: IAutoMovieAngleRange | null = constraint.flexion;
    const abduction: IAutoMovieAngleRange | null = constraint.abduction;
    if (flexion === null || abduction === null) return null;

    // The chart's premises: unit, mutually orthogonal axes.
    if (
      !unit(basis.u) ||
      !unit(basis.f) ||
      !unit(basis.a) ||
      Math.abs(Vector3.dot(basis.u, basis.f)) > 1e-9 ||
      Math.abs(Vector3.dot(basis.u, basis.a)) > 1e-9 ||
      Math.abs(Vector3.dot(basis.f, basis.a)) > 1e-9 ||
      Math.abs(Math.abs(across) - 1) > 1e-9
    )
      return null;

    // The rig angles each interval admits on each reading's own span.
    const near: IInterval[] = admitted(flexion, frame?.flexion, -90, 90);
    const far: IInterval[] = admitted(flexion, frame?.flexion, 90, 270);
    const sides: IInterval[] = admitted(abduction, frame?.abduction, -180, 180);
    const firstAcross: number = Vector3.dot(basis.e1, basis.a);
    const secondAcross: number = Vector3.dot(basis.e2, basis.a);
    return (
      cosine: number,
      sine: number,
      span?: swingTwistReachBound.ISpan,
    ): number => {
      // w = cosine e1 + sine e2, on the scan's own circle axes.
      const k: number = (cosine * firstAcross + sine * secondAcross) / across;
      const c: number = Vector3.dot(
        basis.a,
        Vector3.cross(basis.u, {
          x: cosine * basis.e1.x + sine * basis.e2.x,
          y: cosine * basis.e1.y + sine * basis.e2.y,
          z: cosine * basis.e1.z + sine * basis.e2.z,
        }),
      );
      let most: number = 0;
      let exact: boolean = true;
      const reached: IInterval[] = [];
      for (const reading of [0, 1]) {
        // The near reading's flexion is asin(k sin s); the far one's is half
        // a turn less it, so its admitted flexions map back by 180 - f.
        const latitudes: IInterval[] = [];
        for (const f of reading === 0 ? near : far)
          latitudes.push(
            ...swingsOfLatitude(
              reading === 0 ? f : { low: 180 - f.high, high: 180 - f.low },
              k,
            ),
          );
        if (latitudes.length === 0) continue;
        if (Math.abs(c) < 1e-4) {
          exact = false;
          for (const latitude of latitudes) {
            reached.push(latitude);
            most = Math.max(most, latitude.high);
          }
          continue;
        }
        for (const a of sides) {
          const longitude: IInterval | null = swingsOfLongitude(
            a,
            c,
            reading === 1,
          );
          if (longitude === null) continue;
          for (const latitude of latitudes) {
            const high: number = Math.min(latitude.high, longitude.high);
            const low: number = Math.max(latitude.low, longitude.low);
            if (!(high >= low)) continue;
            reached.push({ low, high });
            most = Math.max(most, high);
          }
        }
      }
      if (span !== undefined) {
        // The farthest step of the scan's grid inside any interval: a step
        // the scan finds inside lies in one of them, so none lies past it.
        let cell: number = 0;
        let held: IInterval | null = null;
        for (const interval of reached) {
          const step: number = Math.min(
            180 - span.grid,
            Math.floor(interval.high / span.grid) * span.grid,
          );
          if (step >= interval.low && step > cell) {
            cell = step;
            held = interval;
          }
        }
        span.cell = cell;
        span.low = NaN;
        span.high = NaN;
        if (held !== null && exact) {
          // The interval that holds that step, joined with every other one
          // that overlaps it by more than the margins: each is reached
          // throughout, so their union is. It places the scan's answer only
          // when no other interval reaches into the step's cell past it.
          let low: number = held.low;
          let high: number = held.high;
          const joined: Set<IInterval> = new Set([held]);
          for (let grown: boolean = true; grown; ) {
            grown = false;
            for (const other of reached)
              if (
                !joined.has(other) &&
                other.high >= low + OVERLAP &&
                other.low <= high - OVERLAP
              ) {
                joined.add(other);
                low = Math.min(low, other.low);
                high = Math.max(high, other.high);
                grown = true;
              }
          }
          let alone: boolean = true;
          for (const other of reached)
            if (
              !joined.has(other) &&
              other.high > high &&
              other.low < cell + span.grid
            )
              alone = false;
          if (alone) {
            span.low = low;
            span.high = high;
          }
        }
      }
      return Math.min(180, most);
    };
  }
}

/** A closed interval of degrees. */
interface IInterval {
  /** Its least. */
  low: number;

  /** Its greatest. */
  high: number;
}

/**
 * How far two intervals of reached swings must overlap to be joined as one,
 * degrees: far above their margins, so the join never bridges a gap the margins
 * hide.
 */
const OVERLAP: number = 0.01;

/** Degrees per radian. */
const DEG: number = 180 / Math.PI;

/** Whether a vector is unit to rounding. */
function unit(v: IAutoMovieVector3): boolean {
  return Math.abs(Vector3.dot(v, v) - 1) < 1e-9;
}

/**
 * The rig angles within `[from, to]` whose clinical reading (`sign * rig +
 * neutral`) has a full-turn alias inside the interval: one rig interval and its
 * full-turn aliases, each widened by the margin.
 */
function admitted(
  range: IAutoMovieAngleRange,
  frame: IAutoMovieAxisFrame | undefined,
  from: number,
  to: number,
): IInterval[] {
  const sign: number = frame?.sign ?? 1;
  const neutral: number = frame?.neutral ?? 0;
  const first: number = (range.min - neutral) / sign;
  const second: number = (range.max - neutral) / sign;
  const low: number = Math.min(first, second) - swingTwistReachBound.MARGIN;
  const high: number = Math.max(first, second) + swingTwistReachBound.MARGIN;
  if (!(high - low < 360)) return [{ low: from, high: to }];
  const out: IInterval[] = [];
  for (
    let turn: number = Math.ceil((from - high) / 360);
    low + 360 * turn <= to;
    ++turn
  ) {
    const a: number = Math.max(from, low + 360 * turn);
    const b: number = Math.min(to, high + 360 * turn);
    if (a <= b) out.push({ low: a, high: b });
  }
  return out;
}

/**
 * The swings in [0, 180] at which `asin(k sin s)`, degrees, lies in an interval
 * within [-90, 90]: `sin s` between the interval's sines over `k`, which is a
 * swing interval and its mirror about a quarter turn.
 */
function swingsOfLatitude(f: IInterval, k: number): IInterval[] {
  const margin: number = swingTwistReachBound.MARGIN;
  const low: number = Math.sin(f.low / DEG) - 1e-9;
  const high: number = Math.sin(f.high / DEG) + 1e-9;
  if (Math.abs(k) < 1e-12)
    return low <= 0 && high >= 0 ? [{ low: 0, high: 180 }] : [];
  const least: number = Math.max(0, Math.min(low / k, high / k));
  const most: number = Math.min(1, Math.max(low / k, high / k));
  if (least > most) return [];
  const first: number = Math.asin(least) * DEG;
  const last: number = Math.asin(most) * DEG;
  return [
    { low: Math.max(0, first - margin), high: Math.min(180, last + margin) },
    {
      low: Math.max(0, 180 - last - margin),
      high: Math.min(180, 180 - first + margin),
    },
  ];
}

/**
 * The swings in [0, 180] at which the abduction lies in a rig interval within
 * [-180, 180]. On the near reading the abduction is `atan2(c sin s, cos s)`,
 * whose size on `c`'s side runs monotonically from 0 to half a turn as the
 * swing does; the far reading's is that less half a turn on the same side. A
 * size `t` is reached at `s = atan2(sin t, |c| cos t)`.
 */
function swingsOfLongitude(
  a: IInterval,
  c: number,
  far: boolean,
): IInterval | null {
  const margin: number = swingTwistReachBound.MARGIN;
  const side: number = c > 0 ? 1 : -1;
  const first: number = a.low * side + (far ? 180 : 0);
  const second: number = a.high * side + (far ? 180 : 0);
  const least: number = Math.max(0, Math.min(first, second));
  const most: number = Math.min(180, Math.max(first, second));
  if (least > most) return null;
  const at = (t: number): number =>
    Math.atan2(Math.sin(t / DEG), Math.abs(c) * Math.cos(t / DEG)) * DEG;
  return {
    low: Math.max(0, at(least) - margin),
    high: Math.min(180, at(most) + margin),
  };
}
