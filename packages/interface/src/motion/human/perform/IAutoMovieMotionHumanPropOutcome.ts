import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieHit } from "../../../physics/IAutoMovieHit";
import type { IAutoMovieProjectile } from "../../../physics/IAutoMovieProjectile";
import type { IAutoMovieProjectileContinue } from "../../../physics/IAutoMovieProjectileContinue";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionHumanPropFlight } from "./IAutoMovieMotionHumanPropFlight";

/**
 * How a prop's flight goes on after a contact, from its model body's flight
 * data: the outcome of each contact, and the legs that follow the first one.
 *
 * At each contact the body decides, from the data it declares and nothing else:
 *
 * - `stick` where it declares an embedding depth (`contact.embed`): its point
 *   goes that far on along its velocity and it rests there in what it struck,
 *   riding it;
 * - `pass` through a person where it declares a speed loss (`passLoss`): it flies
 *   on through that body, slower by the loss;
 * - `bounce` where it declares a restitution and a friction pair (its
 *   `kineticFriction`, else its static `friction`): Newton's restitution and
 *   Coulomb's impulse limit on its velocity relative to the struck surface
 *   (`projectileContinue`), a spherical launch turning as a ball of its body's
 *   `contact.gyration` whose spin carries to the next bounce, rolling on at its
 *   rolling resistance (`contact.rolling`) once a rebound would rise less than
 *   its radius, and coming to rest where it struck when it declares no rolling
 *   resistance;
 * - `roll` along the ground where it declares a rolling resistance and no
 *   restitution to bounce with;
 * - A contact with a friction pair and a measurable radius, but no rebound
 *   coefficient or explicit ground roll, refuses the physical continuation
 *   instead of turning unknown restitution into zero;
 * - Otherwise it stays where it struck, riding it: an outcome the body's data do
 *   not give is never invented.
 *
 * A body's radius is its least round shape's, or half the least extent of its
 * boxes; a body with no such shape has no rebound to measure, so it does not
 * bounce. A roll is on the ground and meets nothing on its way; a body that
 * rebounds and flies is swept again by the flight's one sweep.
 */
export namespace IAutoMovieMotionHumanPropOutcome {
  /** A leg of a flight after its first contact. */
  export interface ILeg {
    /** Seconds since the launch it begins. */
    from: number;

    /** The engine's segment, its times since the launch. */
    segment: IAutoMovieProjectileContinue.Segment;

    /** Seconds since the launch it ends at a contact; Infinity when it does not. */
    end: number;

    /** The contact that ends it, absent when none does. */
    contact?: IAutoMovieMotionHumanPropFlight.IContact;
  }

  /** A meeting of a flight with what it strikes. */
  export interface IMeeting {
    /** The engine's hit, its time since the swept flight's own zero. */
    hit: IAutoMovieHit;

    /** What it struck. */
    struck: IAutoMovieMotionHumanPropFlight.Struck;

    /**
     * The struck collider's id, for pass exclusion or a resolved bounce's
     * departure query.
     */
    collider: string;

    /**
     * The struck surface's velocity at the contact, world metres per second: a
     * bounce acts on the prop's velocity relative to it. At rest when absent,
     * as the floor and a prop that does not move are.
     */
    surface?: IAutoMovieVector3;
  }

  /**
   * The legs after a first contact, each swept again until the prop sticks,
   * rests, rolls or the film ends. Input props of HumanPropOutcome.legs. The
   * prop, the flight that struck, its meeting, the film's seconds left after
   * the launch, the sweep (flight, original-launch-relative base, optional
   * passed collider and separately the resolved bounce collider) and the
   * contact record of a meeting. A passed collider is left behind; a bounced
   * collider remains eligible for later entry after certified departure.
   */
  export type ILegsProps = {
    /**
     * Borrowed prop and physical outcome settings, stable throughout this
     * synchronous continuation call.
     */
    prop: IAutoMovieMotionHumanProp;
    /**
     * Effective finite positive collider radius in metres for an explicit
     * spherical launch.
     */
    sphereRadius?: number;
    /** Initial projectile whose zero is the original launch. */
    projectile: IAutoMovieProjectile;
    /**
     * First observed contact; hit.time is finite nonnegative seconds from the
     * original launch, checked by legs.
     */
    meeting: IAutoMovieMotionHumanPropOutcome.IMeeting;
    /**
     * Finite nonnegative duration available after the original launch, seconds;
     * legs validates it and returns no continuations when the first hit reaches
     * or exceeds it.
     */
    horizon: number;
    /**
     * Synchronous sweep called for each subsequent projectile. base is seconds
     * from the ORIGINAL launch, not scene time; returned hit.time is relative
     * to this projectile's own zero. null means no further contact. leave
     * excludes a passed collider; departing is only the resolved bounce's
     * departure collider. The callback owns horizon clipping; legs checks
     * finite nonnegative hit time and strict absolute progress. Borrowed inputs
     * are call-stable; exceptions propagate and the callback is not retained.
     */
    meet: (
      projectile: IAutoMovieProjectile,
      base: number,
      leave?: string,
      departing?: string,
    ) => IAutoMovieMotionHumanPropOutcome.IMeeting | null;
    /**
     * Synchronous contact-record producer for every observed continuation
     * meeting. base is original-launch-relative seconds; combine it with
     * meeting.hit.time for launch-relative contact time. The sweep owns end <=
     * horizon. Inputs are borrowed for the call, exceptions propagate and the
     * callback is not retained.
     */
    settle: (
      meeting: IAutoMovieMotionHumanPropOutcome.IMeeting,
      projectile: IAutoMovieProjectile,
      base: number,
    ) => IAutoMovieMotionHumanPropFlight.IContact;
  };
}
