type Vec3 = [number, number, number];

/**
 * The chart square to a bone segment that the interim accessors box today's
 * chains in (`AutoMovieHumanArmInterim`, `AutoMovieHumanDigitInterim`), with
 * the two point helpers they share. Its `v` is the walk's chart before the engine's (`AutoMovieHumanWalkPart`)
 * (`v = d x u`), so a box read here lands on the walk's own chart.
 */
export namespace AutoMovieHumanSegmentChart {
  /**
   * A chart square to the segment from `from` to `to`: `u` the given
   * direction made square to it, `v = d x u`.
   *
   * @param from Segment start.
   * @param to Segment end.
   * @param toward The direction `u` leans to.
   * @returns `[u, v]`.
   */
  export function of(from: Vec3, to: Vec3, toward: Vec3): [Vec3, Vec3] {
    const L: number = distance(to, from);
    const d: Vec3 = [(to[0] - from[0]) / L, (to[1] - from[1]) / L, (to[2] - from[2]) / L];
    const k: number = toward[0] * d[0] + toward[1] * d[1] + toward[2] * d[2];
    const r: Vec3 = [toward[0] - k * d[0], toward[1] - k * d[1], toward[2] - k * d[2]];
    const n: number = Math.hypot(...r);
    const u: Vec3 = [r[0] / n, r[1] / n, r[2] / n];
    return [u, [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]]];
  }

  /**
   * A point between two.
   *
   * @param a The point at share 0.
   * @param b The point at share 1.
   * @param t The share.
   * @returns The point.
   */
  export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
  }

  /**
   * The distance of two points.
   *
   * @param a One point.
   * @param b The other.
   * @returns The distance, mm.
   */
  export function distance(a: Vec3, b: Vec3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
}
