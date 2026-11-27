import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieMotionHumanScheduledInstant } from "./AutoMovieMotionHumanScheduledInstant";

/**
 * Props with mass and friction moved by the hands' force: a prop on the floor
 * slides under Newton's second law and Coulomb friction, a hinged prop turns
 * under its torque, and the pushing body leans so its weight balances the
 * reaction of the force it applies.
 *
 * - **Slide.** A prop of mass `m` at rest stays while the applied horizontal
 *   force is within the static friction `μs m g`; once moving it accelerates at
 *   `(F - μk m g) / m` against its motion (Coulomb's law), until it stops,
 *   where the static friction holds it again. Its position and speed are
 *   integrated at plan time by the engine's integrator, each stop located
 *   inside its step and the integration restarted there, so playback and seek
 *   read the same path.
 * - **Hinge.** A door of moment of inertia `I` about its hinge turns at `θ'' = τ
 *   / I` under the torque applied at its handle.
 * - **Lean.** A body pushing horizontally with a force `F` at the height `y` of
 *   its hands leans until its weight's moment about its feet, `M g h sin θ`,
 *   balances the push's reaction, `F y` (static moment balance).
 *
 * The prop's mass and its static and kinetic friction are its model's
 * (`IAutoMovieBody`), read by the caller; this module reads coefficients only.
 * First pass: rolling resistance is the kinetic coefficient the producer gives;
 * the push's force profile comes from the caller, since no pushing-strength
 * study has been read for it. `slideProp` installs a world-frame trajectory and
 * `hingeProp` installs an articulation track.
 */
export namespace IAutoMovieMotionHumanPropDynamics {
  /**
   * A torque applied to a named prop hinge from zero travel and speed. The
   * track holds its final angle after the drive ends.
   */
  export interface IHingeDrive {
    /** The hinge affordance id on the prop. */
    articulation: string;

    /** The film second or named instant when the drive starts at rest. */
    start: AutoMovieMotionHumanScheduledInstant;

    /** Positive finite drive duration in seconds. */
    duration: number;

    /** Positive finite moment of inertia about the hinge in kg m². */
    inertia: number;

    /**
     * Pure applied torque in finite N m, positive along the hinge's local axis.
     *
     * @param seconds Elapsed seconds since the drive started.
     * @returns Signed torque about the hinge axis.
     */
    torque(seconds: number): number;

    /**
     * The seconds since the drive started at which the torque jumps (switched
     * on or off): the integration ends at each and restarts from its state,
     * never stepping across it. None when absent.
     */
    breaks?: readonly number[];
  }

  /**
   * A straight floor slide authored on the film clock. The prop starts at rest
   * and supplies its own mass and measured or authored friction pair. The
   * interval includes any coasting the author wants to show.
   */
  export interface ISlideDrive {
    /** Nonzero horizontal world direction, normalized by the planner. */
    direction: IAutoMovieVector3;

    /**
     * Pure applied force along the direction at a film second, finite
     * nonnegative newtons.
     */
    force: ISlide["force"];

    /**
     * The film seconds at which the force jumps (a push let go): the
     * integration ends at each and restarts from its state, never stepping
     * across it. None when absent.
     */
    breaks?: readonly number[];

    /** First film second of the slide, when the prop is at rest. */
    from: number;

    /** Last film second of the slide, after which its final placement holds. */
    to: number;
  }

  /** A prop pushed or pulled across the floor. */
  export interface ISlide {
    /** Kilograms. */
    mass: number;

    /** The static Coulomb coefficient. */
    friction: number;

    /** The kinetic Coulomb coefficient, at most `friction`. */
    kinetic: number;

    /**
     * The horizontal force along the push at a second, newtons, positive along
     * it. Pure.
     */
    force: (seconds: number) => number;

    /**
     * The seconds at which the force jumps (a push let go): the integration
     * ends at each and restarts from its state, never stepping across it. None
     * when absent.
     */
    breaks?: readonly number[];

    /** Start, seconds. */
    from: number;

    /** End, seconds. */
    to: number;
  }
}
