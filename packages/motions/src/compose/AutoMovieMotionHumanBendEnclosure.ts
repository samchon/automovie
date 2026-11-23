import type { IAutoMovieSwivelArcs } from "@automovie/interface";

/**
 * Closed-form enclosures of angles read from sinusoids of a swivel, the pieces
 * the elbow search's certified bounds are built from
 * (`AutoMovieMotionHumanBendBound`, `AutoMovieMotionHumanBendUnmadeBound`).
 *
 * A sinusoid `a + b cos θ + c sin θ` of a parameter `θ` (degrees) is `a + R
 * cos(θ − φ)` with `R = hypot(b, c)` and `φ = atan2(c, b)`: on an interval it
 * takes its maximum `a + R` where `φ` lies in it, its minimum `a − R` where `φ
 * + 180` does, and its values at the ends otherwise. An angle read as `asin(s)`
 * of one sinusoid is increasing in `s`, so it lies between the `asin` of that
 * range. An angle read as `atan2(y, x)` of two turns at `|x y' − y x'| / |v|² ≤
 * |v'| / |v|` with `v = (x, y)`, where `|v'| ≤ M`, the root sum of the four
 * cosine and sine coefficients squared; on an interval of half width `w`
 * radians about its middle `m`, `|v| ≥ r = |v(m)| − w M`, so where `r > 0` the
 * angle stays within `w M / r` of its value at `m`. An enclosure whose vector
 * may come nearer the origin than `FLOOR`, where the angle's reading turns
 * ill-conditioned and a decomposition pins it at gimbal lock, is refused, and
 * every enclosure is widened by `SLACK` degrees, far above the rounding of the
 * fits and the decompositions it encloses.
 */
export namespace AutoMovieMotionHumanBendEnclosure {
  /**
   * The least length of an angle's vector, or the projected cosine of a middle
   * angle, over which an enclosure is certified.
   */
  export const FLOOR: number = 1e-3;

  /**
   * Degrees every enclosure is widened by: far above the fit's and the
   * decomposition's rounding (about 1e-12 degrees at `FLOOR`), far below any
   * strain a sweep compares.
   */
  export const SLACK: number = 1e-6;

  /** An enclosure of an angle, degrees, the lesser end first. */
  export type IInterval = [number, number];

  /**
   * A sinusoid's value at a parameter, degrees.
   *
   * @param f The sinusoid.
   * @param angle The parameter, degrees.
   * @returns Its value.
   */
  export function at(f: IAutoMovieSwivelArcs.ISinusoid, angle: number): number {
    const turn: number = angle / DEGREES;
    return f.a + f.b * Math.cos(turn) + f.c * Math.sin(turn);
  }

  /**
   * The middle angle `asin(s)` over `[low, high]` of its parameter.
   *
   * @param sine The sinusoid of the angle's sine.
   * @param low The interval's start, degrees.
   * @param high The interval's end, degrees, not before `low`.
   * @returns The enclosure in degrees, or null where the angle may come within
   *   `FLOOR` of its right angle.
   */
  export function middle(
    sine: IAutoMovieSwivelArcs.ISinusoid,
    low: number,
    high: number,
  ): IInterval | null {
    const values: IInterval = range(sine, low, high);
    const pole: number = Math.sqrt(1 - FLOOR * FLOOR);
    if (!(values[0] >= -pole && values[1] <= pole)) return null;
    return [
      Math.asin(values[0]) * DEGREES - SLACK,
      Math.asin(values[1]) * DEGREES + SLACK,
    ];
  }

  /**
   * An outer angle `turn · atan2(y, x)` over `[low, high]` of its parameter.
   *
   * @param y The sinusoid of the angle's sine side.
   * @param x The sinusoid of the angle's cosine side.
   * @param turn The sign the reading takes.
   * @param low The interval's start, degrees.
   * @param high The interval's end, degrees, not before `low`.
   * @returns The enclosure in degrees, not wrapped, or null where the vector
   *   may come within `FLOOR` of the origin.
   */
  export function outer(
    y: IAutoMovieSwivelArcs.ISinusoid,
    x: IAutoMovieSwivelArcs.ISinusoid,
    turn: number,
    low: number,
    high: number,
  ): IInterval | null {
    const centre: number = (low + high) / 2;
    const width: number = (high - low) / 2 / DEGREES;
    const vx: number = at(x, centre);
    const vy: number = at(y, centre);
    const slope: number = Math.sqrt(
      x.b * x.b + x.c * x.c + y.b * y.b + y.c * y.c,
    );
    const reach: number = Math.hypot(vx, vy) - width * slope;
    if (!(reach >= FLOOR)) return null;
    const angle: number = Math.atan2(vy, vx) * DEGREES;
    const spread: number =
      Math.min(Math.PI, (width * slope) / reach) * DEGREES + SLACK;
    const ends: IInterval = [turn * (angle - spread), turn * (angle + spread)];
    return [Math.min(ends[0], ends[1]), Math.max(ends[0], ends[1])];
  }

  /**
   * The least distance, degrees, from an angle to an interval and its full-turn
   * shifts.
   *
   * @param angle The angle, degrees.
   * @param interval The interval, degrees.
   * @returns The distance; 0 for an interval of a full turn or more.
   */
  export function circular(angle: number, interval: IInterval): number {
    const width: number = interval[1] - interval[0];
    if (!(width < 360)) return 0;
    const offset: number = (((angle - interval[0]) % 360) + 360) % 360;
    return offset <= width ? 0 : Math.min(offset - width, 360 - offset);
  }

  /**
   * The least excess `max(0, lo − v, v − hi)` past a reserved interval over
   * every `v` of an interval and its full-turn shifts.
   *
   * @param interval The angles, degrees.
   * @param lo The reserved interval's start, degrees.
   * @param hi The reserved interval's end, degrees.
   * @returns The least excess, degrees.
   */
  export function excess(interval: IInterval, lo: number, hi: number): number {
    if (!(interval[1] - interval[0] < 360)) return 0;
    const aim: number = (lo + hi) / 2;
    const near: number = Math.round(
      (aim - (interval[0] + interval[1]) / 2) / 360,
    );
    let out: number = Infinity;
    for (let k: number = near - 1; k <= near + 1; ++k) {
      const v: number = Math.min(
        interval[1] + 360 * k,
        Math.max(interval[0] + 360 * k, aim),
      );
      out = Math.min(out, Math.max(0, lo - v, v - hi));
    }
    return out;
  }

  /**
   * The full-turn sinusoid range on `[low, high]` of its parameter.
   *
   * @param f The sinusoid.
   * @param low The interval's start, degrees.
   * @param high The interval's end, degrees, not before `low`.
   * @returns Its least and greatest values.
   */
  export function range(
    f: IAutoMovieSwivelArcs.ISinusoid,
    low: number,
    high: number,
  ): IInterval {
    const ends: IInterval = [at(f, low), at(f, high)];
    let least: number = Math.min(ends[0], ends[1]);
    let most: number = Math.max(ends[0], ends[1]);
    const amplitude: number = Math.hypot(f.b, f.c);
    if (amplitude > 0) {
      const peak: number = Math.atan2(f.c, f.b) * DEGREES;
      if (within(peak, low, high)) most = f.a + amplitude;
      if (within(peak + 180, low, high)) least = f.a - amplitude;
    }
    return [least, most];
  }
}

/** Degrees per radian. */
const DEGREES: number = 180 / Math.PI;

/** Whether some full-turn shift of an angle, degrees, lies in `[low, high]`. */
function within(angle: number, low: number, high: number): boolean {
  return angle + 360 * Math.ceil((low - angle) / 360) <= high;
}
