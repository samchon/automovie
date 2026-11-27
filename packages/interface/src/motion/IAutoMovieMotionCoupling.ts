import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanoidRegion } from "../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionHumanContactWindow } from "./IAutoMovieMotionHumanContactWindow";

/**
 * How one role of a meeting bears another: the borne role's contacts on the
 * bearer's regions, each with the share of the borne weight it carries, and the
 * borne mass with its centre, which the bearer's balance takes in.
 */
export interface IAutoMovieMotionCoupling {
  /** The bearing role's name. */
  bearer: string;

  /** The borne role's name. */
  borne: string;

  /** The borne role's contacts on the bearer. */
  contacts: readonly IAutoMovieMotionCoupling.IContact[];

  /** The borne mass the bearer carries, kilograms. */
  mass: number;

  /** The borne centre of mass in the bearer's anchor frame, metres. */
  centre: IAutoMovieVector3;

  /**
   * The bearer's bone the key and the holds are stated in: the bone the borne
   * body's resting region lies on, so the borne body rides that bone.
   */
  anchor: AutoMovieHumanoidBone;

  /**
   * Each further bearer's anchor frame in the first bearer's anchor frame at
   * the key pose, by role, with that anchor bone: a borne body walked between
   * two helpers. None when one body bears alone.
   */
  bearers?: Readonly<
    Record<
      string,
      {
        /**
         * Further bearer's anchor position in the first bearer's anchor frame,
         * metres.
         */
        position: IAutoMovieVector3;
        /**
         * Further bearer's anchor rotation relative to the first bearer's
         * anchor, unit quaternion.
         */
        rotation: IAutoMovieQuaternion;
        /** Bone anchoring this bearer to the shared coupling. */
        anchor: AutoMovieHumanoidBone;
      }
    >
  >;

  /**
   * The borne body's root frame in the bearer's anchor frame at the coupling's
   * key pose, its legs there and the bearer's stance it was placed on.
   */
  key: {
    /** Metres. */
    position: IAutoMovieVector3;

    /** Unit quaternion. */
    rotation: IAutoMovieQuaternion;

    /**
     * Both legs' hip flexion, knee flexion and hip abduction, degrees: the
     * carry's own, changed least so the bearer's arms reach the holds.
     */
    legs: readonly [number, number, number];

    /**
     * The first bearer's stance: its trunk's forward inclination, degrees,
     * shared by the lumbopelvic rhythm, and how far it lowers by bending its
     * knees, a share of a squat's drop in [0, 1]. Upright, both none, changed
     * least so its arms reach the holds.
     */
    stance: {
      /** Forward trunk inclination in degrees. */
      incline: number;
      /**
       * Lowering as a share of the body's squat drop in [0, 1]; zero is the
       * standing alignment.
       */
      depth: number;
    };
  };
}

/**
 * The meeting of an action two or more performers do together: one frame with
 * the place of each shared contact, and the film seconds all arrive at, hold
 * and leave.
 *
 * A meeting is computed once, by a pure function of where the roles stand when
 * it starts, and every role's law reads the same record, so no law derives its
 * partner's side of a contact. The roles are put in one order (by role name,
 * then by subject) before anything is computed, so the record is the same
 * whichever role asks first. A role with no performer is left out: the contacts
 * are then the present role's default places and the meeting is not solid, so
 * each role's law performs alone in the air.
 */
export namespace IAutoMovieMotionCoupling {
  /** One contact of a borne body on its bearer. */
  export interface IContact {
    /** The borne body's part. */
    part: IAutoMovieMotionHumanContactWindow["part"];

    /** The borne body's region that touches. */
    region: AutoMovieHumanoidRegion;

    /** The bearer's role and region it lies on. */
    on: {
      /** Name of the bearer role supplying this contact surface. */
      role: string;
      /** Body region of that bearer on which the carried body bears. */
      region: AutoMovieHumanoidRegion;
    };

    /**
     * How it bears: on the bearer (`bear`), or a hold of the borne hand
     * (`grip`).
     */
    kind: "bear" | "grip";

    /** The share of the borne weight it carries, in [0, 1]; a grip carries none. */
    load: number;

    /**
     * Where it bears at the key, metres in the frame of the first bearer's
     * anchor bone (`IAutoMovieMotionCoupling.anchor`): the point its share of
     * the weight presses the bearer at.
     */
    at?: IAutoMovieVector3;
  }
}
