import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A pedestrian struck by a moving car, or diving clear of it.
 *
 * The contact is the first overlap of the car's front profile with the
 * pedestrian's legs on the car's own course clock. The trajectory follows
 * the frontal impact classes of Ravani, Brougham and Mason (Pedestrian
 * Post-Impact Kinematics and Injury Patterns, SAE 811024, 1981,
 * https://papers.sae.org/811024): a centre of mass below the leading edge
 * gives a forward projection, one above it a wrap onto the bonnet, an
 * off-centre contact a fender vault and a fast wrap a roof vault. A wrapped
 * body rides the bonnet in the car's frame, then flies to the ground and
 * lies down.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the contact, the trajectory classes with the source, the ride and the landing.
 * @evidence contracts/development/design.md#principled-representation The car by subject id and its front affordance; the class is computed, never authored.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the `vehicleHit` and `vehicleDive` laws read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A car whose course never meets the pedestrian is refused, and so is a dive that cannot clear its path.
 */
export namespace IAutoMovieMotionHumanVehicleHit {
  /**
   * The post-impact trajectory class.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four trajectory classes; the namespace states when each occurs and its source.
   * @evidence contracts/development/design.md#principled-representation A closed union of the frontal impact classes of Ravani, Brougham and Mason (SAE 811024).
   * @evidence contracts/development/design.md#minimal-and-owned-surface planVehicleHit computes it from the contact and branches on it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal per class; the class is computed, never authored.
   */
  export type Trajectory =
    | "forwardProjection"
    | "wrap"
    | "fenderVault"
    | "roofVault";

  /**
   * The struck pedestrian's parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation Subject and affordance ids and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `vehicleHit.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact instant is found on the car's course, not authored.
   */
  export interface IParams {
    /** The car's scene subject id. */
    vehicle: string;

    /** The car's affordance at the top of its leading edge, the bonnet's front; read from the car's colliders when absent, as the highest top among those reaching furthest forward (`vehicleFront`). */
    edge?: string;

    /** How far past the action's start the car's course is searched for the contact, seconds; 6 when absent. A car that reaches the pedestrian later is not struck. */
    horizon?: number;

    /** How long the body lies after landing, seconds; 1 when absent; see {@link IAutoMovieMotionHumanKnockdown.IParams.seconds}. */
    hold?: number;
  }

  /**
   * The near-miss dive's parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The car by subject id and the side dived to.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `vehicleDive.plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The dive is timed by the car's arrival on its course.
   */
  export interface IDive {
    /** The car's scene subject id. */
    vehicle: string;

    /** The pedestrian's side the dive goes to; the side nearer the car's path edge when absent. */
    side?: AutoMovieHumanSide;

    /** How far past the action's start the car's course is searched for its arrival, seconds; 6 when absent. A car that arrives later is not dived from. */
    horizon?: number;
  }
}
