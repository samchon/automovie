import { AutoMovieGravity, integrateMotionTrajectory } from "@automovie/engine";

/**
 * Props with mass and friction moved by the hands' force (#3433): a prop
 * on the floor slides under Newton's second law and Coulomb friction, a
 * hinged prop turns under its torque, and the pushing body leans so its
 * weight balances the reaction of the force it applies.
 *
 * - **Slide.** A prop of mass `m` at rest stays while the applied
 *   horizontal force is within the static friction `μs m g`; once moving it
 *   accelerates at `(F - μk m g) / m` against its motion (Coulomb's law).
 *   Its position and speed are integrated at plan time by the engine's
 *   integrator, so playback and seek read the same path.
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
 * pushing-strength study has been read for it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three laws, their premises, where the coefficients come from and the first pass's limits.
 * @evidence contracts/development/implementation.md#principled-implementation Newton's second law under Coulomb friction with its static threshold, the hinge's rotational form of it, and static moment balance for the lean; the slide and the hinge are integrated by the engine's fixed-step integrator.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One right-hand side per law and one closed form for the lean.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A push the body's weight cannot balance is reported, never clamped to a lean.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four right-hand sides per integrator step.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each returned trajectory holds its knots for as long as its caller keeps it.
 */
export namespace HumanPropDynamics {
  /** A prop pushed or pulled across the floor. */
  export interface ISlide {
    /** Kilograms. */
    mass: number;

    /** The static Coulomb coefficient. */
    friction: number;

    /** The kinetic Coulomb coefficient, at most `friction`. */
    kinetic: number;

    /**
     * The horizontal force along the push at a second, newtons, positive
     * along it. Pure.
     */
    force: (seconds: number) => number;

    /** Start, seconds. */
    from: number;

    /** End, seconds. */
    to: number;
  }

  /**
   * A slide's distance and speed along the push.
   *
   * @param props The prop and the force.
   * @returns The trajectory of `[distance, speed]`.
   */
  export function slide(
    props: ISlide,
  ): integrateMotionTrajectory.ITrajectory {
    const g: number = AutoMovieGravity.STANDARD;
    return integrateMotionTrajectory({
      f: (t: number, x: readonly number[]): integrateMotionTrajectory.IRate => {
        const v: number = x[1]!;
        const f: number = props.force(t);
        if (v <= 0 && f <= props.friction * props.mass * g)
          return { dx: [0, 0] };
        return {
          dx: [v, (f - props.kinetic * props.mass * g) / props.mass],
        };
      },
      x0: [0, 0],
      t0: props.from,
      t1: props.to,
    });
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
  ): integrateMotionTrajectory.ITrajectory {
    return integrateMotionTrajectory({
      f: (t: number, x: readonly number[]): integrateMotionTrajectory.IRate => ({
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
