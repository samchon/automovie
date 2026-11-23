import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieProjectile } from "../../../physics/IAutoMovieProjectile";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionPropLaunch } from "../law/IAutoMovieMotionPropLaunch";
import type { IAutoMovieMotionHumanPropOutcome } from "./IAutoMovieMotionHumanPropOutcome";
import type { IAutoMovieMotionHumanSegment } from "./IAutoMovieMotionHumanSegment";

/**
 * Props that fly: every launch an action publishes
 * (`IAutoMovieMotionHumanActionPlan.launches`) turns its prop into the engine's
 * flight (`projectileAt`) from the launch until the flight's first contact,
 * against the people, the props that do not fly themselves and the floor, found
 * by the engine's one sweep (`projectileFirstContact`), and then into where the
 * flight ends.
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
 * (`IAutoMovieBody.drag`), drag-free without it. What it meets is the one
 * sweep's (`HumanPropSweep`): every person but the launcher, the props that do
 * not fly and the floor. Flights do not meet each other, and a flying prop is
 * no collider.
 *
 * At its first contact the body's flight data decide what follows
 * (`HumanPropOutcome`): it sticks embedded, passes through, bounces or rolls
 * on; a prop whose data grant none stays where it struck, on the floor, riding
 * a struck prop or a struck person's bone. A bounce or a pass is swept again,
 * contact by contact, until the prop stays, rolls to rest or the film ends. A
 * flight still in the air at the film's end is unended.
 */
export namespace IAutoMovieMotionHumanPropFlight {
  /** One flight of a prop. */
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

    /**
     * Film second of its first collision; Infinity when no collision was
     * resolved.
     */
    end: number;

    /** Its first collision, absent when none was resolved. */
    contact?: IAutoMovieMotionHumanPropFlight.IContact;

    /**
     * Film second a later grip or launch takes ownership, when it occurs within
     * the film.
     */
    supersededAt?: number;

    /**
     * Film second a staged grip took this launch over. A capture is separate
     * from a collision.
     */
    capturedAt?: number;

    /**
     * What follows the first contact, by the body's flight data: a bounce, a
     * pass, a roll (`HumanPropOutcome`); none when it stays where it struck.
     */
    legs?: readonly IAutoMovieMotionHumanPropOutcome.ILeg[];
  }

  /** Where and how a flight struck. */
  export interface IContact {
    /** What it struck. */
    struck: IAutoMovieMotionHumanPropFlight.Struck;

    /** The contact point on the struck surface, world metres. */
    point: IAutoMovieVector3;

    /** The struck surface's outward unit normal. */
    normal: IAutoMovieVector3;

    /** The prop's velocity at contact, m/s. */
    velocity: IAutoMovieVector3;

    /**
     * The prop's frame at contact, in the frame of what it struck (the bone,
     * the prop, or the world); embedded by its depth where it sticks.
     */
    offset: IAutoMovieRigidTransform;

    /**
     * What the contact does (`HumanPropOutcome.decide`); `stick` where it
     * stays.
     */
    outcome: "stick" | "bounce" | "roll" | "pass";
  }

  /** What a flight struck. */
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
