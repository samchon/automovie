import type { IAutoMovieIntegrateMotionTrajectory, IAutoMovieMotionHumanPropDynamics } from "@automovie/interface";

import { AutoMovieGravity, integrateMotionTrajectory } from "@automovie/engine";

/**
 * Props with mass and friction moved by the hands' force (#3433): a prop
 * on the floor slides under Newton's second law and Coulomb friction, a
 * hinged prop turns under its torque, and the pushing body leans so its
 * weight balances the reaction of the force it applies.
 *
 * - **Slide.** A prop of mass `m` at rest stays while the applied
 *   horizontal force is within the static friction `μs m g`; once moving it
 *   accelerates at `(F - μk m g) / m` against its motion (Coulomb's law),
 *   until it stops, where the static friction holds it again. Its position
 *   and speed are integrated at plan time by the engine's integrator, each
 *   stop located inside its step and the integration restarted there, so
 *   playback and seek read the same path.
 * - **Hinge.** A door of moment of inertia `I` about its hinge turns at
 *   `θ'' = τ / I` under the torque applied at its handle.
 * - **Lean.** A body pushing horizontally with a force `F` at the height
 *   `y` of its hands leans until its weight's moment about its feet,
 *   `M g h sin θ`, balances the push's reaction, `F y` (static moment
 *   balance).
 *
 * The prop's mass and its static and kinetic friction are its model's
 * (`IAutoMovieBody`), read by the caller; this module reads coefficients
 * only. First pass: rolling resistance is the kinetic coefficient the
 * producer gives; the push's force profile comes from the caller, since no
 * pushing-strength study has been read for it. These calculations are
 * exported and unit-tested; no pushing, hauling or door law yet consumes
 * their trajectories.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three laws, their premises, where the coefficients come from and the first pass's limits.
 * @evidence contracts/development/implementation.md#principled-implementation Newton's second law under Coulomb friction with its static threshold and its stop located as the switching point of a discontinuous right-hand side, the hinge's rotational form of it, and static moment balance for the lean; the slide and the hinge are integrated by the engine's fixed-step integrator.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One right-hand side per law and one closed form for the lean.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A push the body's weight cannot balance is reported, never clamped to a lean.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four right-hand sides per integrator step, and per stop one bisection of single steps down to a double's resolution, about fifty, and one restarted integration of what is left.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each returned trajectory holds its knots for as long as its caller keeps it.
 */
export namespace HumanPropDynamics {

  /**
   * A slide's distance and speed along the push.
   *
   * Coulomb's law switches at rest: a sliding prop decelerates at the
   * kinetic friction until its speed reaches zero, and is then held by the
   * static friction for as long as the push stays within it. A fixed step
   * that straddles the stop would carry the kinetic deceleration past it,
   * so the stop is located inside its step and the integration restarted
   * there at rest: the switching point of a discontinuous right-hand side
   * (Hairer, Nørsett and Wanner, Solving Ordinary Differential Equations I,
   * section II.6, located, not yet read). The stop is the root of one
   * sliding step's speed from the step's start, found by bisection down to
   * the resolution of a double.
   *
   * @param props The prop and the force.
   * @returns The trajectory of `[distance, speed]`, the integrator's step
   *   its first piece's and its knots those of all its pieces.
   */
  export function slide(props: IAutoMovieMotionHumanPropDynamics.ISlide): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    const g: number = AutoMovieGravity.STANDARD;
    const sliding = (
      t: number,
      x: readonly number[],
    ): IAutoMovieIntegrateMotionTrajectory.IRate => ({
      dx: [
        x[1]!,
        (props.force(t) - props.kinetic * props.mass * g) / props.mass,
      ],
    });
    const law = (
      t: number,
      x: readonly number[],
    ): IAutoMovieIntegrateMotionTrajectory.IRate =>
      x[1]! <= 0 && props.force(t) <= props.friction * props.mass * g
        ? { dx: [0, 0] }
        : sliding(t, x);

    // One sliding step from a knot to an instant inside its step.
    const step = (
      from: number,
      x: readonly number[],
      until: number,
    ): IAutoMovieIntegrateMotionTrajectory.ITrajectory =>
      integrateMotionTrajectory({
        f: sliding,
        x0: x,
        t0: from,
        t1: until,
        h: until - from,
      });
    const pieces: {
      to: number;
      path: IAutoMovieIntegrateMotionTrajectory.ITrajectory;
    }[] = [];
    let from: number = props.from;
    let x0: readonly number[] = [0, 0];
    for (;;) {
      const path: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
        integrateMotionTrajectory({ f: law, x0, t0: from, t1: props.to });
      const knot = (k: number): number => path.times[k]!;
      let k: number = 1;
      while (
        k < path.knots &&
        !(path.at(knot(k)).x[1]! <= 0 && path.at(knot(k - 1)).x[1]! > 0)
      )
        k++;
      if (k === path.knots) {
        pieces.push({ to: props.to, path });
        break;
      }

      // The stop inside the step from knot k - 1 to knot k.
      const a: number = knot(k - 1);
      const start: readonly number[] = path.at(a).x;
      let lo: number = a;
      let hi: number = knot(k);
      if (step(a, start, hi).at(hi).x[1]! < 0)
        for (;;) {
          const mid: number = (lo + hi) / 2;
          if (!(mid > lo && mid < hi)) break;
          if (step(a, start, mid).at(mid).x[1]! > 0) lo = mid;
          else hi = mid;
        }
      const tail: IAutoMovieIntegrateMotionTrajectory.ITrajectory = step(a, start, hi);
      pieces.push({ to: a, path }, { to: hi, path: tail });
      if (!(hi < props.to)) break;
      from = hi;
      x0 = [tail.at(hi).x[0]!, 0];
    }
    const last: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      pieces[pieces.length - 1]!.path;
    // Each piece's knots within its own span, after the piece before it.
    const times: number[] = pieces.flatMap(
      (
        p: { to: number; path: IAutoMovieIntegrateMotionTrajectory.ITrajectory },
        i: number,
      ): number[] =>
        p.path.times.filter(
          (t: number): boolean =>
            t <= p.to && (i === 0 || t > pieces[i - 1]!.to),
        ),
    );
    return {
      t0: props.from,
      t1: props.to,
      h: pieces[0]!.path.h,
      knots: times.length,
      times,
      at: (time: number): IAutoMovieIntegrateMotionTrajectory.IState =>
        (
          pieces.find((p: { to: number }): boolean => time <= p.to)?.path ??
          last
        ).at(time),
    };
  }

  /**
   * A hinged prop's turn under a torque.
   *
   * @param inertia The moment of inertia about the hinge, kg m².
   * @param torque The torque about the hinge at a second, N m. Pure.
   * @param from Start, seconds.
   * @param to End, seconds.
   * @returns The trajectory of `[angle, angular speed]`, radians.
   */
  export function hinge(
    inertia: number,
    torque: (seconds: number) => number,
    from: number,
    to: number,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    return integrateMotionTrajectory({
      f: (
        t: number,
        x: readonly number[],
      ): IAutoMovieIntegrateMotionTrajectory.IRate => ({
        dx: [x[1]!, torque(t) / inertia],
      }),
      x0: [0, 0],
      t0: from,
      t1: to,
    });
  }

  /**
   * The lean that balances a horizontal push's reaction, degrees forward,
   * or null when the body's weight cannot balance it.
   *
   * @param mass The body's mass, kilograms.
   * @param height Its centre-of-mass height, metres.
   * @param force The push, newtons, positive forward.
   * @param hands The hands' height, metres.
   * @returns Degrees, or null.
   */
  export function lean(
    mass: number,
    height: number,
    force: number,
    hands: number,
  ): number | null {
    const ratio: number =
      (force * hands) / (mass * AutoMovieGravity.STANDARD * height);
    if (Math.abs(ratio) > 1) return null;
    return (Math.asin(ratio) * 180) / Math.PI;
  }
}
