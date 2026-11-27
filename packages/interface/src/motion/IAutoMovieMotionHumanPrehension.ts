import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Taking, holding and releasing an object by hand: the grasp, the carry pose
 * and the regrasp. pickUp and putDown share one reach model
 * (`HumanPrehension`).
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanPrehension` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */


/**
 * Reach to grasp as two coupled components, the model of prehension since
 * Jeannerod (1981, 1984): the transport carries the hand to the object and the
 * grasp shapes the hand, opening it to a peak aperture during the transport and
 * closing it on the object as the transport ends. Every number here belongs to
 * the reaching and grasping family; none is borrowed from striking or
 * locomotion.
 *
 * - Movement time. McIntosh, Mon-Williams and Tresilian (2018, J. Exp. Psychol.
 *   Hum. Percept. Perform. 44:1022, table 1) found reach-to-grasp time poorly
 *   fitted by Fitts' law and well fitted by a two-factor model, `MT = a + b lg
 *   A + c W` for the grasped width, with the group fit a = -306.07 ms, b =
 *   297.27 ms per decade of amplitude A in millimetres and c = 0.65 ms per
 *   millimetre of width W (r^2 = 0.97). Amplitudes below the study's shortest
 *   (170 mm) take its value, since the fit is not valid there; skill varies the
 *   duration through the cross-task timing variability (`HumanSkill.jitter`),
 *   no study of reaching speed by proficiency having been located.
 * - Peak aperture. It scales with the object's width with a slope of about 0.8
 *   (Smeets and Brenner 1999, Motor Control 3:237, as cited by Utz et al.
 *   2015); the intercept, 25 mm, is provisional (the full regression was not
 *   reachable): it keeps the peak 5 mm above the widest graspable object, about
 *   100 mm (McIntosh et al. 2018's hypothetical maximum grip).
 * - Peak timing. Aperture peaks at 60 to 70 % of the transport (Jeannerod 1984,
 *   J. Mot. Behav. 16:235); a seeded draw places it inside that band.
 *
 * The transport path superposes two minimum-jerk units (Flash and Hogan 1985;
 * Flash and Henis 1991): the first carries the wrist from where it is to an
 * approach point set back from the grasp along the object's approach axis, the
 * second, overlapping its end, carries it the last stretch along that axis onto
 * the grasp, so the hand arrives moving along the approach and never through
 * the object, as the deceleration phase of a reach to grasp is the longer one
 * (McIntosh 2018, time after peak speed). Both units end at rest, so the wrist
 * stops exactly on the grasp with zero velocity and acceleration. The hand
 * turns to its grasp rotation on a minimum-jerk slerp finished by the second
 * unit's start, so it is oriented before the final approach.
 */
export namespace IAutoMovieMotionHumanPrehension {
  /** A planned transport of the wrist and the hand's turn. */
  export interface ITransport {
    /** Seconds the transport lasts. */
    duration: number;

    /** The wrist at a second of the transport (clamped to its span), metres. */
    wrist(seconds: number): IAutoMovieVector3;

    /** The hand's world rotation at a second of the transport. */
    turn(seconds: number): IAutoMovieQuaternion;
  }

  /**
   * Plan a transport. Input rotation of HumanPrehension.transport. The hand's
   * world rotation at the start and at the grasp.
   */
  export type ITransportRotation = {
    /** Initial world orientation as a unit quaternion. */
    from: IAutoMovieQuaternion;
    /** Final world orientation as a unit quaternion. */
    to: IAutoMovieQuaternion;
  };
}
