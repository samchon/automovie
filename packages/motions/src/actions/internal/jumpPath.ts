import { AutoMovieStationHermite, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieStationHermite,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * The paths the jump's phases are drawn on: a quintic Hermite path for the
 * root, a straight interpolation for the feet, and the nearest equivalent of a
 * heading.
 */
export namespace jumpPath {
  /*
   * A quintic Hermite path from a point and velocity to a point and velocity
   * over a duration, ending at rest acceleration and starting at `a0`, rest
   * when absent: the push-off continues the interrupted motion's own root
   * acceleration, which a planted leg's knee would otherwise show as a step in
   * its flexion rate's slope at the cut.
   * Parameter p0: The start, metres.
   * Parameter v0: The start's velocity, metres per second.
   * Parameter p1: The end, metres.
   * Parameter v1: The end's velocity, metres per second.
   * Parameter duration: The path's seconds.
   * Parameter a0: The start's acceleration, metres per second squared; rest when
   * absent.
   * Returns: A point reader at local seconds, held at the path's ends.
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

  /*
   * A straight interpolation.
   * Parameter a: The start.
   * Parameter b: The end.
   * Parameter s: The share from `a` to `b`.
   * Returns: The point.
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

  /*
   * The equivalent of a heading nearest another, so a turn takes the shorter
   * way.
   * Parameter angle: The heading, degrees.
   * Parameter near: The heading to stay near, degrees.
   * Returns: The equivalent of `angle` within half a turn of `near`.
   */
  export function unwrap(angle: number, near: number): number {
    return near + AutoMovieEngineMath.wrapDegrees(angle - near);
  }
}
