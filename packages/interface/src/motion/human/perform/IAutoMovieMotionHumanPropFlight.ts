import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieProjectile } from "../../../physics/IAutoMovieProjectile";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionPropLaunch } from "../law/IAutoMovieMotionPropLaunch";
import type { IAutoMovieMotionHumanPropOutcome } from "./IAutoMovieMotionHumanPropOutcome";
import type { IAutoMovieMotionHumanSegment } from "./IAutoMovieMotionHumanSegment";

/**
 * Props that fly: every launch an action publishes (`IAutoMovieMotionHumanActionPlan.launches`)
 * turns its prop into the engine's flight (`projectileAt`) from the launch
 * until the flight's first contact, against the people, the props that do
 * not fly themselves and the floor, found by the engine's one sweep
 * (`projectileFirstContact`), and then into where the flight ends.
 *
 * A launched prop leaves from its displayed frame at the launch second (the
 * hand that held it lets go there) with the launch's velocity; a prop the
 * action sets on its way without holding it (a ball in a barrel) leaves from
 * the launch's point. Its rotation is kept, turned by the launch's attitude
 * when it gives one. A prop that names a `tip` point flies as a capsule from
 * its origin to its tip, so an arrow meets a body with its head; any other
 * flies as its origin's point, so a bottle meets the floor with its base.
 *
 * The flight carries the quadratic drag its model body declares
 * (`IAutoMovieBody.drag`, #3482), drag-free without it. What it meets is the
 * one sweep's (`HumanPropSweep`): every person but the launcher, the props
 * that do not fly and the floor. Flights do not meet each other, and a
 * flying prop is no collider.
 *
 * At its first contact the body's flight data decide what follows
 * (`HumanPropOutcome`, #3479): it sticks embedded, passes through, bounces
 * or rolls on; a prop whose data grant none stays where it struck, on the
 * floor, riding a struck prop or a struck person's bone. A bounce or a pass
 * is swept again, contact by contact, until the prop stays, rolls to rest
 * or the film ends. A flight still in the air at the film's end is unended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation projectile: The flight, its time zero at `launch`. contact: Its first contact, absent while unended. point: The contact point on the struck surface, world metres.
 * @evidence contracts/development/design.md#principled-representation projectile: The flight, its time zero at `launch`. contact: Its first contact, absent while unended. point: The contact point on the struck surface, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformance.ts (HumanPerformance.flights, return); perform/HumanPropFlight.ts (HumanPropFlight.flights, return); perform/HumanPropFlight.ts (HumanPropFlight.fly, source); perform/HumanPropFlight.ts (HumanPropFlight.fly, return); perform/HumanPropFlight.ts (HumanPropFlight.fly.settle, return); perform/HumanPropFlight.ts (HumanPropFlight.contactOf, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSegment, IAutoMovieMotionPropLaunch, IAutoMovieProjectile, IAutoMovieMotionHumanPropOutcome.ILeg, IAutoMovieVector3, IAutoMovieRigidTransform identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPropFlight {
  /**
   * One flight of a prop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States film-absolute launch/end times, launch-relative projectile/leg clocks, source action, optional first contact and unended-flight Infinity.
   * @evidence contracts/development/design.md#principled-representation Reuses the engine projectile and continuation legs; optional contact and infinite end express an unended flight, with their consistency established by fly rather than by the record type alone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Frame and hit readers consume the launch, source, projectile, end, contact and continuation legs emitted by this owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores neither sampled frames nor a second ballistic law; source/published records are borrowed from the planned performance and returned flight records are not deeply frozen.
   */
  export interface IFlight {
    /** The prop. */
    prop: string;

    /** Film second of the launch. */
    launch: number;

    /** The launching action, with its performer. */
    source: IAutoMovieMotionHumanSegment & {
      /** Scene subject id of the performer whose action launched this flight. */
      subject: string;
    };

    /** The launch as the action published it. */
    published: IAutoMovieMotionPropLaunch;

    /** The flight, its time zero at `launch`. */
    projectile: IAutoMovieProjectile;

    /** Film second of its first contact; Infinity when it is still in the air at the film's end. */
    end: number;

    /** Its first contact, absent while unended. */
    contact?: IAutoMovieMotionHumanPropFlight.IContact;

    /** What follows the first contact, by the body's flight data: a bounce, a pass, a roll (`HumanPropOutcome`); none when it stays where it struck. */
    legs?: readonly IAutoMovieMotionHumanPropOutcome.ILeg[];
  }

  /**
   * Where and how a flight struck.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names world-metre point/normal and incoming velocity, the carrier-relative resting offset and the declared contact outcome.
   * @evidence contracts/development/design.md#principled-representation Keeps the observed world contact separate from the prop's embedded or unembedded offset in the struck carrier's frame; supported target and outcome unions constrain their alternatives.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Flight frames use the target/offset, while hit records read the geometry, velocity and outcome.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contact data does not claim a calibrated moving-surface impulse or a coupled rigid-body solve; the existing continuation uses its fixed-surface response approximation.
   */
  export interface IContact {
    /** What it struck. */
    struck: IAutoMovieMotionHumanPropFlight.Struck;

    /** The contact point on the struck surface, world metres. */
    point: IAutoMovieVector3;

    /** The struck surface's outward unit normal. */
    normal: IAutoMovieVector3;

    /** The prop's velocity at contact, m/s. */
    velocity: IAutoMovieVector3;

    /** The prop's frame at contact, in the frame of what it struck (the bone, the prop, or the world); embedded by its depth where it sticks. */
    offset: IAutoMovieRigidTransform;

    /** What the contact does (`HumanPropOutcome.decide`); `stick` where it stays. */
    outcome: "stick" | "bounce" | "roll" | "pass";
  }

  /**
   * What a flight struck.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a person's canonical bone, a prop subject and the world ground; identities refer to the placed performance.
   * @evidence contracts/development/design.md#principled-representation A closed discriminated union keeps the carrier facts required by each target kind; runtime performance readers establish that the subject and bone exist.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The sweep produces these targets and contact settlement/frame readers consume every variant.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No material, response or actor identity is inferred from the subject string; each variant carries only its carrier identity.
   */
  export type Struck =
    | {
        /** Impact target discriminant: person, prop or ground. */
        kind: "person";
        /** Scene subject id of the struck person or prop. */
        subject: string;
        /** Bone of the struck person carrying the impacted collider. */
        bone: AutoMovieHumanoidBone;
      }
    | {
        /** Impact target discriminant: person, prop or ground. */
        kind: "prop";
        /** Scene subject id of the struck person or prop. */
        subject: string;
      }
    | {
        /** Impact target discriminant: person, prop or ground. */
        kind: "ground";
      };
}
