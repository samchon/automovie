/**
 * Motion bounds of closed-form motion curves and the conservative-advancement
 * time of impact they give.
 *
 * The method is conservative advancement (Mirtich 1996, "Impulse-based Dynamic
 * Simulation of Rigid Body Systems", PhD thesis, UC Berkeley, ch. 3; Zhang,
 * Redon, Lee & Kim 2007, "Continuous Collision Detection for Articulated Models
 * Using Taylor Models and Temporal Culling", SIGGRAPH; Tang, Kim & Manocha
 * 2009, "C2A: Controlled Conservative Advancement", ICRA): two shapes read
 * apart by a distance `d` at a time `t` cannot meet before the gap could close,
 * so when their closing speed is bounded by `V` nothing is read before `t + d /
 * V`. The loop of `timeOfImpact` is ported from the Flexible Collision
 * Library's shape-shape `conservativeAdvancement`
 * (flexible-collision-library/fcl, BSD-3-Clause, Copyright (c) 2011-2014 Willow
 * Garage, Inc. and (c) 2014-2016 Open Source Robotics Foundation,
 * `include/fcl/narrowphase/detail/conservative_advancement_func_matrix-inl.h`,
 * commit ae86ecde788086110f8a4cea54ae1949df8a21d3): read the distance, stop at
 * a contact, advance by the distance over the motion bound, stop below the time
 * resolution or past the motion's end.
 *
 * The bound on the closing speed comes from the curves' derivatives, computed
 * once when the motion is prepared and read in closed form after. A polynomial
 * curve segment in Bernstein (Bezier) form has a derivative that is again a
 * Bezier curve, with control points `n (P[i+1] - P[i]) / h` over a segment of
 * duration `h` (Farin 2002, "Curves and Surfaces for CAGD", 5th ed., §5.3), and
 * every point of a Bezier curve lies in the convex hull of its control points
 * (Farin 2002, §4.2), so the greatest of those control points' norms bounds the
 * speed over the whole segment. A cubic Hermite segment's Bezier points are its
 * ends and the ends moved by a third of their tangents (Farin 2002, §7.5); a
 * quintic Hermite segment's follow from its ends' values, velocities and
 * accelerations the same way. A point carried by an articulated chain moves no
 * faster than its root plus each joint's rate times the point's lever arm from
 * that joint (the articulated motion bound of Zhang et al. 2007).
 */
export namespace AutoMovieEngineMotionBound {
  /**
   * A speed bound prepared over a motion's knots: the bound integrated in
   * closed form, read by the travel between two times and by the
   * conservative-advancement step.
   */
  export interface IPrepared {
    /**
     * The knot times, seconds, strictly increasing, the caller's own array
     * borrowed.
     */
    readonly times: readonly number[];

    /**
     * An upper bound on how far any point the bound covers moves between two
     * times, in the speeds' length unit: the speed bound integrated from `from`
     * to `to`. Times outside the knots are clamped to them.
     *
     * @param from The earlier time, seconds.
     * @param to The later time, seconds.
     * @returns The bound, not negative; zero when `to` is not after `from`.
     */
    travel(from: number, to: number): number;

    /**
     * The earliest time a gap read at `from` can close (Mirtich 1996): the
     * least `t` at which the speed bound integrated from `from` reaches `gap`.
     *
     * @param from The time the gap was read, seconds.
     * @param gap The gap read, in the speeds' length unit; zero, negative or
     *   NaN certifies nothing and returns `from`.
     * @returns The time, seconds, at least `from`; `Infinity` when the gap
     *   cannot close before the last knot.
     */
    advance(from: number, gap: number): number;
  }

  /**
   * An upper bound on the speed of a polynomial curve segment given by its
   * Bezier control points: the greatest norm of its derivative's control points
   * `n (P[i+1] - P[i]) / h` (Farin 2002, §5.3 and §4.2).
   *
   * @param points The segment's control points, each a coordinate vector of the
   *   same dimension, at least two.
   * @param duration The segment's duration, seconds, positive.
   * @returns The bound, in coordinate units per second.
   */
  export function bezierSpeed(
    points: readonly (readonly number[])[],
    duration: number,
  ): number {
    const degree: number = points.length - 1;
    let most: number = 0;
    for (let i: number = 0; i < degree; ++i) {
      const a: readonly number[] = points[i]!;
      const b: readonly number[] = points[i + 1]!;
      let square: number = 0;
      for (let d: number = 0; d < a.length; ++d) {
        const step: number = b[d]! - a[d]!;
        square += step * step;
      }
      most = Math.max(most, Math.sqrt(square));
    }
    return (degree * most) / duration;
  }

  /**
   * An upper bound on the speed of a cubic Hermite segment, from its Bezier
   * points `p0, p0 + h v0 / 3, p1 - h v1 / 3, p1` (Farin 2002, §7.5).
   *
   * @param p0 The value at the segment's start.
   * @param v0 The velocity there, units per second.
   * @param p1 The value at the segment's end.
   * @param v1 The velocity there, units per second.
   * @param duration The segment's duration, seconds, positive.
   * @returns The bound, units per second.
   */
  export function cubicHermiteSpeed(
    p0: readonly number[],
    v0: readonly number[],
    p1: readonly number[],
    v1: readonly number[],
    duration: number,
  ): number {
    return bezierSpeed(
      [p0, combine(p0, v0, duration / 3), combine(p1, v1, -duration / 3), p1],
      duration,
    );
  }

  /**
   * An upper bound on the speed of a quintic Hermite segment, from its Bezier
   * points `p0`, `p0 + h v0 / 5`, `p0 + 2 h v0 / 5 + h^2 a0 / 20`, `p1 - 2 h v1
   * / 5 + h^2 a1 / 20`, `p1 - h v1 / 5`, `p1`: the Bernstein form's end
   * derivatives (Farin 2002, §5.3) matched to the ends' values, velocities and
   * accelerations.
   *
   * @param p0 The value at the segment's start.
   * @param v0 The velocity there, units per second.
   * @param a0 The acceleration there, units per second squared.
   * @param p1 The value at the segment's end.
   * @param v1 The velocity there, units per second.
   * @param a1 The acceleration there, units per second squared.
   * @param duration The segment's duration, seconds, positive.
   * @returns The bound, units per second.
   */
  export function quinticHermiteSpeed(
    p0: readonly number[],
    v0: readonly number[],
    a0: readonly number[],
    p1: readonly number[],
    v1: readonly number[],
    a1: readonly number[],
    duration: number,
  ): number {
    const h: number = duration;
    return bezierSpeed(
      [
        p0,
        combine(p0, v0, h / 5),
        combine(combine(p0, v0, (2 * h) / 5), a0, (h * h) / 20),
        combine(combine(p1, v1, (-2 * h) / 5), a1, (h * h) / 20),
        combine(p1, v1, -h / 5),
        p1,
      ],
      duration,
    );
  }

  /**
   * An upper bound on the speed of a point carried by an articulated chain: the
   * root's speed bound plus, for each joint, its rate bound times the point's
   * lever arm from it (the articulated motion bound of Zhang et al. 2007).
   *
   * @param root The bound on the speed of the chain's root at the point, length
   *   units per second, not negative.
   * @param rates Each joint's angular rate bound, radians per second, not
   *   negative.
   * @param levers Each joint's lever arm to the point, the greatest distance
   *   from the joint's centre to any point covered, length units, in the order
   *   of `rates`.
   * @returns The bound, length units per second.
   */
  export function chainSpeed(
    root: number,
    rates: readonly number[],
    levers: readonly number[],
  ): number {
    let speed: number = root;
    for (let j: number = 0; j < rates.length; ++j)
      speed += rates[j]! * levers[j]!;
    return speed;
  }

  /**
   * A speed bound prepared over a motion's knots, its integral summed once so
   * every later travel and advance is read in closed form.
   *
   * @param times The knot times, seconds, at least two, strictly increasing;
   *   borrowed, so the caller must not change them.
   * @param speeds Each interval's speed bound, length units per second, finite
   *   and not negative, one per interval between neighbouring knots: for two
   *   shapes, the sum of both shapes' bounds, as the Flexible Collision
   *   Library's motion bound adds the two motions'.
   * @returns The prepared bound.
   */
  export function prepare(
    times: readonly number[],
    speeds: readonly number[],
  ): IPrepared {
    const n: number = speeds.length;

    // The bound integrated to each knot, summed once.
    const prefix: Float64Array = new Float64Array(n + 1);
    for (let k: number = 0; k < n; ++k) {
      prefix[k + 1] = prefix[k]! + speeds[k]! * (times[k + 1]! - times[k]!);
    }

    // The interval holding a time, by bisection over the knots.
    const interval = (t: number): number => {
      let lo: number = 0;
      let hi: number = n - 1;
      while (lo < hi) {
        const mid: number = (lo + hi + 1) >> 1;
        if (times[mid]! <= t) lo = mid;
        else hi = mid - 1;
      }
      return lo;
    };

    // The bound integrated from the first knot to a time, clamped to the
    // knots.
    const integral = (t: number): number => {
      if (t <= times[0]!) return 0;
      if (t >= times[n]!) return prefix[n]!;
      const k: number = interval(t);
      return prefix[k]! + speeds[k]! * (t - times[k]!);
    };
    return {
      times,
      travel: (from: number, to: number): number =>
        to > from ? Math.max(0, integral(to) - integral(from)) : 0,
      advance: (from: number, gap: number): number => {
        if (!(gap > 0)) return from;
        const goal: number = integral(from) + gap;
        if (goal >= prefix[n]!) return Infinity;

        // The first knot whose integral reaches the goal ends the interval
        // the gap closes in; within it the bound is constant.
        let lo: number = 0;
        let hi: number = n;
        while (lo < hi) {
          const mid: number = (lo + hi) >> 1;
          if (prefix[mid + 1]! < goal) lo = mid + 1;
          else hi = mid;
        }
        const at: number = times[lo]! + (goal - prefix[lo]!) / speeds[lo]!;
        return Math.max(from, at);
      },
    };
  }

  /**
   * The first index of a grid of instants a gap read at instant `at` does not
   * certify (Mirtich 1996): the least index whose time is not before the
   * prepared bound's `advance`, so every instant between is left unread.
   *
   * @param bound The prepared bound.
   * @param grid The grid's instants, seconds, increasing.
   * @param at The index of the instant read.
   * @param gap The gap read there, in the bound's length unit.
   * @returns The index, in `(at, grid.length]`; `grid.length` when every later
   *   instant is certified.
   */
  export function nextGrid(
    bound: IPrepared,
    grid: readonly number[],
    at: number,
    gap: number,
  ): number {
    const until: number = bound.advance(grid[at]!, gap);
    if (until === Infinity) return grid.length;
    let lo: number = at + 1;
    let hi: number = grid.length;
    while (lo < hi) {
      const mid: number = (lo + hi) >> 1;
      if (grid[mid]! < until) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /**
   * The time of impact of two moving shapes by conservative advancement, the
   * loop of the Flexible Collision Library's shape-shape
   * `conservativeAdvancement`: read the separation, report a contact at once,
   * advance to the earliest time the gap can close, and stop once the advance
   * is no longer than the time resolution or the motion ends.
   *
   * @param separation The shapes' separation at a time, in the bound's length
   *   unit, zero or negative in contact: the caller's distance query (GJK or
   *   the shape pair distance) at that time's poses.
   * @param bound The prepared bound on the two shapes' closing speed.
   * @param from The start of the search, seconds.
   * @param to The end of the search, seconds, after `from`.
   * @param resolution The time resolution, seconds, positive: the caller's
   *   frame period or contact-time requirement.
   * @returns The time of impact, seconds, in `[from, to]`; `Infinity` when the
   *   shapes stay apart until `to`.
   */
  export function timeOfImpact(
    separation: (seconds: number) => number,
    bound: IPrepared,
    from: number,
    to: number,
    resolution: number,
  ): number {
    let t: number = from;
    for (;;) {
      const d: number = separation(t);
      if (!(d > 0)) return t;
      const next: number = bound.advance(t, d);
      if (next - t <= resolution) return t;
      if (next >= to) return Infinity;
      t = next;
    }
  }
}

/*
 * A coordinate vector plus another scaled: `a + s b`, componentwise.
 */
const combine = (
  a: readonly number[],
  b: readonly number[],
  s: number,
): number[] => a.map((value: number, d: number): number => value + s * b[d]!);
