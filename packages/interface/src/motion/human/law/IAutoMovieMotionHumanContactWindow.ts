import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieHumanoidRegion } from "../../../skeleton/AutoMovieHumanoidRegion";
import type { IAutoMovieMotionHumanFoot } from "../posture/IAutoMovieMotionHumanFoot";

/**
 * A span of an action during which a body part bears on something: a foot
 * planted or pivoting on the floor, a hand gripping, the seat or the back
 * resting, a forearm lying on the other forearm or the chest, a striking
 * surface in contact.
 *
 * Shares are of the action's duration, `from <= to`, both in [0, 1]. The
 * performance re-solves a planted or gripping limb onto its goal after every
 * transition offset, so the contact never slides (planted effectors are never
 * inertialized in world space). Every window names the frame it bears on: the
 * ground, a prop or another person. A moving support carries its contacts, as a
 * platform carries a character standing on it, so slip and penetration are
 * measured in that frame.
 */
export interface IAutoMovieMotionHumanContactWindow {
  /**
   * The body part in contact; head and chest bear through their egion, as a
   * head resting on a partner's shoulder (#4012).
   */
  part: (readonly [
    "leftFoot",
    "rightFoot",
    "leftHand",
    "rightHand",
    "seat",
    "back",
    "leftUpperArm",
    "rightUpperArm",
    "leftLowerArm",
    "rightLowerArm",
    "leftUpperLeg",
    "rightUpperLeg",
    "leftLowerLeg",
    "rightLowerLeg",
    "head",
    "chest",
  ])[number];

  /**
   * How it bears: fixed, turning about the contact, holding, sitting, lying or
   * striking.
   */
  kind: (readonly [
    "plant",
    "pivot",
    "grip",
    "seat",
    "lie",
    "strike",
    "bear",
  ])[number];

  /** Start share. */
  from: number;

  /** End share. */
  to: number;

  /** The frame the contact bears on. */
  support: IAutoMovieMotionHumanContactWindow.Support;

  /**
   * A grip's in-hand motion of the held object: a rigid displacement in the
   * hand's frame at a share of this window from 0 to 1, metres, the identity at
   * 0. The performance composes it before the offset it stored at closure
   * (position R_d p + t_d, rotation R_d R), so a pen turned into a writing grip
   * or a coin rolled across the fingers moves in the hand while the hand holds
   * it. It must be a pure function of the share. Absent, the object keeps the
   * offset it had at closure.
   *
   * @param share The share of the window, in [0, 1].
   * @param grip The displayed grip at that share, when available in the prop's
   *   read.
   * @returns The object's displacement in the hand's frame.
   */
  inHand?(
    share: number,
    grip?: IAutoMovieRigidTransform,
  ): {
    /** Prop displacement in the holding hand's frame, metres; zero at share 0. */
    position: IAutoMovieVector3;
    /**
     * Prop rotation in the holding hand's frame, unit quaternion; identity at
     * share 0.
     */
    rotation: IAutoMovieQuaternion;
  };

  /**
   * The surface region of the body that touches, when the window names it more
   * precisely than its part: a knee (`kneeLeft`) on the floor for a lower leg,
   * a palm on a vault, a forearm on a table. The engine anchors each region to
   * one bone and resolves its point on that bone's collision shapes, so the
   * balance and slip audits read the contact there rather than at the part's
   * end joint. Absent, the contact is where the part's own kind puts it (a
   * sole, a palm, the seat bones).
   */
  region?: AutoMovieHumanoidRegion;

  /**
   * Prepared geometric evidence for a dry bearing contact. A window that names
   * only an authored site leaves this absent.
   */
  material?: IAutoMovieMotionHumanContactWindow.IMaterial;

  /**
   * The point of a planted foot that holds its place, when the law holds one
   * through the window: the ball a heel rises about, the heel a forefoot lowers
   * about, or the leg goal's own `contact`. The slip and lift audits then read
   * that point instead of the sole's lowest socket, so a foot turning about its
   * held ball is not read as slipping where its toe tip rolls under it, and a
   * ball that slides still is. Absent, the contact is the lowest socket at each
   * instant, as a foot rolls through the rockers of stance.
   */
  socket?: IAutoMovieMotionHumanContactWindow.Socket;

  /**
   * The share of the body's weight this contact bears, in [0, 1]. Absent, a
   * plant, a pivot, a seat, a lie and a bear share the weight equally among the
   * bearing windows open at the instant, and a grip and a strike bear none. The
   * shares of the windows open at one instant need not sum to 1 when another
   * support (a partner, a hanging grip) takes the rest; the statics verdict
   * reads the declared shares as weights of the contacts' centre.
   */
  load?: number;
}

/** Companion types of {@link IAutoMovieMotionHumanContactWindow}. */
export namespace IAutoMovieMotionHumanContactWindow {
  /** The matched exterior and receiving point of a dry bearing contact. */
  export interface IMaterial {
    /** Bone carrying the exterior feature on the supported body. */
    bone: AutoMovieHumanoidBone;
    /** Receiving point in the window's support frame, metres. */
    point: IAutoMovieVector3;
    /** Boundary of a non-point bearing feature in the same support frame. */
    patch?: readonly IAutoMovieVector3[];
    /** Outward unit normal in that same frame. */
    normal: IAutoMovieVector3;
    /** Signed exterior clearance at fitting, metres. Negative is inside. */
    clearance: number;
  }

  /**
   * The held point of a planted foot: a named sole socket, or a point in the
   * foot's rest frame relative to its ankle joint, metres, as a leg goal's
   * `contact` names it (`IAutoMovieHumanLimbGoal.contact`).
   */
  export type Socket = IAutoMovieMotionHumanFoot.Socket | IAutoMovieVector3;

  /**
   * The frame a contact bears on: the ground, a prop subject, a person's
   * region, or a person's segment, the bone an arm's segment lies along (a
   * self-hug's forearm on the other forearm), where a region's point and frame
   * would not say which part of the segment it lies on.
   */
  export type Support =
    | IGround
    | {
        /** Support discriminant: ground, prop or another person. */
        kind: "prop";
        /** Whether this grip transports the whole prop. Defaults to true. */
        carries?: boolean;
        /** Scene subject id of the supporting prop or person. */
        subject: string;
        /**
         * The prop's named point whose frame bears the contact, for a contact
         * on a moving part (a pedal on its crank, a tread's plate); the whole
         * prop's frame when absent.
         */
        point?: string;
      }
    | {
        /** Support discriminant: ground, prop or another person. */
        kind: "person";
        /** Scene subject id of the supporting prop or person. */
        subject: string;
        /** Supporting person's named body region. */
        region: AutoMovieHumanoidRegion;
      }
    | {
        /** Support discriminant: ground, prop or another person. */
        kind: "person";
        /** Scene subject id of the supporting prop or person. */
        subject: string;
        /**
         * Supporting person's bone when the contact is specified by bone rather
         * than region.
         */
        bone: AutoMovieHumanoidBone;
      };

  /** A stationary horizontal surface, such as the floor or a stair tread. */
  export interface IGround {
    /** Support discriminant. */
    kind: "ground";
    /** The surface's world height in metres. Defaults to the world floor. */
    height?: number;
  }
}
