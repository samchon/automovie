import type { IAutoMovieHit } from "../../../physics/IAutoMovieHit";
import type { IAutoMovieProjectile } from "../../../physics/IAutoMovieProjectile";
import type { IAutoMovieProjectileContinue } from "../../../physics/IAutoMovieProjectileContinue";
import type { IAutoMovieMotionHumanProp } from "./IAutoMovieMotionHumanProp";
import type { IAutoMovieMotionHumanPropFlight } from "./IAutoMovieMotionHumanPropFlight";

/**
 * How a prop's flight goes on after a contact (#3479), from its model body's
 * flight data (#3482): the outcome of each contact, and the legs that follow
 * the first one.
 *
 * At each contact the body decides, from the data it declares and nothing
 * else:
 *
 * - `stick` where it declares an embedding depth (`contact.embed`): its point
 *   goes that far on along its velocity and it rests there in what it
 *   struck, riding it;
 * - `pass` through a person where it declares a speed loss (`passLoss`): it
 *   flies on through that body, slower by the loss;
 * - `bounce` where it declares a restitution and a friction pair (its
 *   `kineticFriction`, else its static `friction`): Newton's restitution and
 *   Coulomb's impulse limit (`projectileContinue`), rolling on at its
 *   rolling resistance (`contact.rolling`) once a rebound would rise less
 *   than its radius, and coming to rest where it struck when it declares no
 *   rolling resistance;
 * - `roll` along the ground where it declares a rolling resistance and no
 *   restitution to bounce with;
 * - a contact with a friction pair and a measurable radius, but no rebound
 *   coefficient or explicit ground roll, refuses the physical continuation
 *   instead of turning unknown restitution into zero;
 * - otherwise it stays where it struck, riding it: an outcome the body's data
 *   do not give is never invented.
 *
 * A body's radius is its least round shape's, or half the least extent of
 * its boxes; a body with no such shape has no rebound to measure, so it does
 * not bounce. A roll is on the ground and meets nothing on its way; a body
 * that rebounds and flies is swept again by the flight's one sweep.
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: Seconds since the launch it begins. end: Seconds since the launch it ends at a contact; Infinity when it does not. contact: The contact that ends it, absent when none does.
 * @evidence contracts/development/design.md#principled-representation from: Seconds since the launch it begins. end: Seconds since the launch it ends at a contact; Infinity when it does not. contact: The contact that ends it, absent when none does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPropOutcome.ts (HumanPropOutcome.legs, return); perform/HumanPropOutcome.ts (HumanPropOutcome.at, leg); perform/HumanPropFlight.ts (HumanPropFlight.fly.meet, return); perform/HumanPropFlight.ts (HumanPropFlight.fly.settle, m); perform/HumanPropFlight.ts (HumanPropFlight.contactOf, meeting); perform/HumanPropSweep.ts (HumanPropSweep.sweep, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieProjectileContinue.Segment, IAutoMovieMotionHumanPropFlight.IContact, IAutoMovieHit, IAutoMovieMotionHumanPropFlight.Struck, IAutoMovieMotionHumanProp, IAutoMovieProjectile identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPropOutcome {
  /**
   * A leg of a flight after its first contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents launch-relative seconds, the engine segment, an infinite unended leg and its optional ending contact.
   * @evidence contracts/development/design.md#principled-representation One engine continuation segment retains its timing and observed contact without a parallel trajectory representation; sorted/progressing times remain the producer's obligation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPropFlight reads segment frames and recorded contacts; legs constructs every field.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing contact is explicit and no predicted impact is substituted for an observed one.
   */
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

  /**
   * A meeting of a flight with what it strikes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sweep-relative hit, target kind and collider identity used for pass exclusion or a resolved bounce's physical departure query.
   * @evidence contracts/development/design.md#principled-representation Reuses the engine hit and the flight's target union; their correspondence is supplied by the sweep rather than encoded twice.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The continuation loop reads the hit, target and collider for outcome, settlement and the next sweep.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains no inferred material coefficient or alternative collision solver.
   */
  export interface IMeeting {
    /** The engine's hit, its time since the swept flight's own zero. */
    hit: IAutoMovieHit;

    /** What it struck. */
    struck: IAutoMovieMotionHumanPropFlight.Struck;

    /** The struck collider's id, for pass exclusion or a resolved bounce's departure query. */
    collider: string;
  }

  /**
   * The legs after a first contact, each swept again until the prop sticks, rests, rolls or the film ends. Input props of HumanPropOutcome.legs. The prop, the flight that struck, its meeting, the film's seconds left after the launch, the sweep (flight, original-launch-relative base, optional passed collider and separately the resolved bounce collider) and the contact record of a meeting. A passed collider is left behind; a bounced collider remains eligible for later entry after certified departure.
   *
   * @evidence contracts/development/common.md#meaningful-documentation prop: Borrowed prop and physical outcome settings, stable throughout this synchronous continuation call. projectile: Initial projectile whose zero is the original launch. meeting: First observed contact; hit.time is finite nonnegative seconds from the original launch, checked by legs.
   * @evidence contracts/development/design.md#principled-representation prop: Borrowed prop and physical outcome settings, stable throughout this synchronous continuation call. projectile: Initial projectile whose zero is the original launch. meeting: First observed contact; hit.time is finite nonnegative seconds from the original launch, checked by legs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPropOutcome.ts (HumanPropOutcome.legs, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanProp, IAutoMovieProjectile, IAutoMovieMotionHumanPropOutcome.IMeeting, IAutoMovieMotionHumanPropFlight.IContact identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ILegsProps = {
    /** Borrowed prop and physical outcome settings, stable throughout this synchronous continuation call. */
    prop: IAutoMovieMotionHumanProp;
    /** Effective finite positive collider radius in metres for an explicit spherical launch. */
    sphereRadius?: number;
    /** Initial projectile whose zero is the original launch. */
    projectile: IAutoMovieProjectile;
    /** First observed contact; hit.time is finite nonnegative seconds from the original launch, checked by legs. */
    meeting: IAutoMovieMotionHumanPropOutcome.IMeeting;
    /** Finite nonnegative duration available after the original launch, seconds; legs validates it and returns no continuations when the first hit reaches or exceeds it. */
    horizon: number;
    /**
     * Synchronous sweep called for each subsequent projectile. base is seconds from the ORIGINAL launch, not scene time; returned hit.time is relative to this projectile's own zero. null means no further contact. leave excludes a passed collider; departing is only the resolved bounce's departure collider. The callback owns horizon clipping; legs checks finite nonnegative hit time and strict absolute progress. Borrowed inputs are call-stable; exceptions propagate and the callback is not retained.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPropOutcome.ILegsProps.meet: Synchronous sweep called for each subsequent projectile. base is seconds from the ORIGINAL launch, not scene time; returned hit.time is relative to this projectile's own zero. null means no further contact. leave excludes a passed collider; departing is only the resolved bounce's departure collider. The callback owns horizon clipping; legs checks finite nonnegative hit time and strict absolute progress. Borrowed inputs are call-stable; exceptions propagate and the callback is not retained.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPropOutcome.ILegsProps.meet is used through packages/motions/src/perform/HumanPropOutcome.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPropOutcome.ILegsProps.meet is used through packages/motions/src/perform/HumanPropOutcome.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPropOutcome.ILegsProps.meet is used through packages/motions/src/perform/HumanPropOutcome.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPropOutcome.ILegsProps.meet is used through packages/motions/src/perform/HumanPropOutcome.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPropOutcome.ILegsProps.meet is used through packages/motions/src/perform/HumanPropOutcome.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPropOutcome.ILegsProps.meet is used through packages/motions/src/perform/HumanPropOutcome.ts.
     */
    meet: (
      projectile: IAutoMovieProjectile,
      base: number,
      leave?: string,
      departing?: string,
    ) => IAutoMovieMotionHumanPropOutcome.IMeeting | null;
    /**
     * Synchronous contact-record producer for every observed continuation meeting. base is original-launch-relative seconds; combine it with meeting.hit.time for launch-relative contact time. The sweep owns end <= horizon. Inputs are borrowed for the call, exceptions propagate and the callback is not retained.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanPropOutcome.ILegsProps.settle: Synchronous contact-record producer for every observed continuation meeting. base is original-launch-relative seconds; combine it with meeting.hit.time for launch-relative contact time. The sweep owns end <= horizon. Inputs are borrowed for the call, exceptions propagate and the callback is not retained.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanPropOutcome.ILegsProps.settle is used through packages/motions/src/perform/HumanPropOutcome.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanPropOutcome.ILegsProps.settle is used through packages/motions/src/perform/HumanPropOutcome.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanPropOutcome.ILegsProps.settle is used through packages/motions/src/perform/HumanPropOutcome.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanPropOutcome.ILegsProps.settle is used through packages/motions/src/perform/HumanPropOutcome.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanPropOutcome.ILegsProps.settle is used through packages/motions/src/perform/HumanPropOutcome.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanPropOutcome.ILegsProps.settle is used through packages/motions/src/perform/HumanPropOutcome.ts.
     */
    settle: (
      meeting: IAutoMovieMotionHumanPropOutcome.IMeeting,
      projectile: IAutoMovieProjectile,
      base: number,
    ) => IAutoMovieMotionHumanPropFlight.IContact;
  };
}
