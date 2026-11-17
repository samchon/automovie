import { AutoMovieStationHermite, wrapDegrees } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The paths the jump's phases are drawn on: a quintic Hermite path for the
 * root, a straight interpolation for the feet, and the nearest equivalent
 * of a heading.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three paths and who draws on them.
 * @evidence contracts/development/design.md#principled-representation Pure functions of their ends, shared by the jump's push-off, flight and landing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three functions, each read by the jump.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The Hermite rule is the engine's.
 */
export namespace jumpPath {
  /**
   * A quintic Hermite path from a point and velocity to a point and velocity
   * over a duration, ending at rest acceleration and starting at `a0`, rest
   * when absent: the push-off continues the interrupted motion's own root
   * acceleration, which a planted leg's knee would otherwise show as a step
   * in its flexion rate's slope at the cut.
   *
   * @param p0 The start, metres.
   * @param v0 The start's velocity, metres per second.
   * @param p1 The end, metres.
   * @param v1 The end's velocity, metres per second.
   * @param duration The path's seconds.
   * @param t Seconds along it, clamped to the path.
   * @param a0 The start's acceleration, metres per second squared; rest when absent.
   * @returns The point at `t`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the ends, the accelerations and why the start's is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's quintic Hermite rule over seconds, values, velocities and accelerations at both ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One weight set and one combination.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The share is clamped, so the path holds its ends outside its span.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieStationHermite`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function hermite(
    p0: IAutoMovieVector3,
    v0: IAutoMovieVector3,
    p1: IAutoMovieVector3,
    v1: IAutoMovieVector3,
    duration: number,
    t: number,
    a0: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
  ): IAutoMovieVector3 {
    // The engine's quintic Hermite rule over seconds: values, velocities and
    // accelerations (curvatures) at both ends.
    const u: number = Math.min(1, Math.max(0, t / duration));
    const rest: readonly number[] = [0, 0, 0];
    const [x, y, z] = AutoMovieStationHermite.combine(
      {
        value: [p0.x, p0.y, p0.z],
        slope: [v0.x, v0.y, v0.z],
        curvature: [a0.x, a0.y, a0.z],
      },
      { value: [p1.x, p1.y, p1.z], slope: [v1.x, v1.y, v1.z], curvature: rest },
      AutoMovieStationHermite.weights(u, duration, 0, true),
    );
    // combine maps the three-entry value array entry by entry, so all three exist.
    return { x: x!, y: y!, z: z! };
  }

  /**
   * A straight interpolation.
   *
   * @param a The start.
   * @param b The end.
   * @param s The share from `a` to `b`.
   * @returns The point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Componentwise linear interpolation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The share is not clamped; callers pass shares of a path.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   * The equivalent of a heading nearest another, so a turn takes the shorter way.
   *
   * @param angle The heading, degrees.
   * @param near The heading to stay near, degrees.
   * @returns The equivalent of `angle` within half a turn of `near`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The difference wrapped to half a turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrap.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reuses the engine's wrap rather than a loop.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `wrapDegrees`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function unwrap(angle: number, near: number): number {
    return near + wrapDegrees(angle - near);
  }
}
