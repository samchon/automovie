import { AutoMovieStationHermite, wrapDegrees } from "@automovie/engine";
import type {
  IAutoMovieStationHermite,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The paths the jump's phases are drawn on: a quintic Hermite path for the
 * root, a straight interpolation for the feet, and the nearest equivalent of a
 * heading.
 */
export namespace jumpPath {
  /**
   * A quintic Hermite path from a point and velocity to a point and velocity
   * over a duration, ending at rest acceleration and starting at `a0`, rest
   * when absent: the push-off continues the interrupted motion's own root
   * acceleration, which a planted leg's knee would otherwise show as a step in
   * its flexion rate's slope at the cut.
   *
   * @param p0 The start, metres.
   * @param v0 The start's velocity, metres per second.
   * @param p1 The end, metres.
   * @param v1 The end's velocity, metres per second.
   * @param duration The path's seconds.
   * @param a0 The start's acceleration, metres per second squared; rest when
   *   absent.
   * @returns A point reader at local seconds, held at the path's ends.
   */
  export function prepare(
    p0: IAutoMovieVector3,
    v0: IAutoMovieVector3,
    p1: IAutoMovieVector3,
    v1: IAutoMovieVector3,
    duration: number,
    a0: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
  ): (t: number) => IAutoMovieVector3 {
    // The engine's quintic Hermite rule over seconds: values, velocities and
    // accelerations (curvatures) at both ends.
    const from: IAutoMovieStationHermite.IEnd = {
      value: [p0.x, p0.y, p0.z],
      slope: [v0.x, v0.y, v0.z],
      curvature: [a0.x, a0.y, a0.z],
    };
    const into: IAutoMovieStationHermite.IEnd = {
      value: [p1.x, p1.y, p1.z],
      slope: [v1.x, v1.y, v1.z],
      curvature: [0, 0, 0],
    };
    return (t: number): IAutoMovieVector3 => {
      const u: number = Math.min(1, Math.max(0, t / duration));
      const [x, y, z]: number[] = AutoMovieStationHermite.combine(
        from,
        into,
        AutoMovieStationHermite.weights(u, duration, 0, true),
      );

      // The copied endpoint arrays have exactly three entries.
      return { x: x!, y: y!, z: z! };
    };
  }

  /**
   * A straight interpolation.
   *
   * @param a The start.
   * @param b The end.
   * @param s The share from `a` to `b`.
   * @returns The point.
   */
  export function lerp(
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    s: number,
  ): IAutoMovieVector3 {
    return {
      x: a.x + (b.x - a.x) * s,
      y: a.y + (b.y - a.y) * s,
      z: a.z + (b.z - a.z) * s,
    };
  }

  /**
   * The equivalent of a heading nearest another, so a turn takes the shorter
   * way.
   *
   * @param angle The heading, degrees.
   * @param near The heading to stay near, degrees.
   * @returns The equivalent of `angle` within half a turn of `near`.
   */
  export function unwrap(angle: number, near: number): number {
    return near + wrapDegrees(angle - near);
  }
}
