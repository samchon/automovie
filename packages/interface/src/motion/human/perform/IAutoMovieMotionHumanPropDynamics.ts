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
 * @evidence contracts/development/common.md#meaningful-documentation force: The horizontal force along the push at a second, newtons, positive along it. Pure. from: Start, seconds. to: End, seconds.
 * @evidence contracts/development/design.md#principled-representation force: The horizontal force along the push at a second, newtons, positive along it. Pure. from: Start, seconds. to: End, seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPropDynamics.ts (HumanPropDynamics.slide, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanPropDynamics.slide.
 */
export namespace IAutoMovieMotionHumanPropDynamics {
  /**
   * A prop pushed or pulled across the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation force: The horizontal force along the push at a second, newtons, positive along it. Pure. from: Start, seconds. to: End, seconds.
   * @evidence contracts/development/design.md#principled-representation force: The horizontal force along the push at a second, newtons, positive along it. Pure. from: Start, seconds. to: End, seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPropDynamics.ts (HumanPropDynamics.slide, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanPropDynamics.slide.
   */
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
}
