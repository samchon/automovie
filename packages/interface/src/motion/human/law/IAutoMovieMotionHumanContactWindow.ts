import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
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
 * ground, a prop or another person. A moving support carries its contacts, as
 * Unreal's based movement and Unity's parent constraint carry a character on
 * a platform, so slip and penetration are measured in that frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: Start share. to: End share. inHand: A grip's in-hand motion of the held object (#3447): a rigid displacement in the hand's frame at a share of this window from 0 to 1, metres, the identity at 0. The performance composes it before the offset it stored at closure (position R_d p + t_d, rotation R_d R), so a pen turned into a writing grip or a coin rolled across the fingers moves in the hand while the hand holds it. It must be a pure function of the share. Absent, the object keeps the offset it had at closure. kind: Support discriminant: ground, prop or another person. kind: Support discriminant: ground, prop or another person. subject: Scene subject id of the supporting prop or person.
 * @evidence contracts/development/design.md#principled-representation from: Start share. to: End share. inHand: A grip's in-hand motion of the held object (#3447): a rigid displacement in the hand's frame at a share of this window from 0 to 1, metres, the identity at 0. The performance composes it before the offset it stored at closure (position R_d p + t_d, rotation R_d R), so a pen turned into a writing grip or a coin rolled across the fingers moves in the hand while the hand holds it. It must be a pure function of the share. Absent, the object keeps the offset it had at closure. kind: Support discriminant: ground, prop or another person. kind: Support discriminant: ground, prop or another person. subject: Scene subject id of the supporting prop or person.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/stand.ts (stand.plan, return); actions/supportWindows.ts (supportWindows.of, return); actions/supportWindows.ts (supportWindows.of.close.part, p); actions/walkDelayed.ts (walkDelayed, c); actions/walkDelayed.ts (walkDelayed, return); actions/walkPaced.ts (walkPaced, c).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, AutoMovieHumanoidRegion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical AutoMovieHumanoidRegion, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanContactWindow {
  /** The body part in contact; head and chest bear through their 
egion, as a head resting on a partner's shoulder (#4012). */
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

  /** How it bears: fixed, turning about the contact, holding, sitting, lying or striking. */
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
   * A grip's in-hand motion of the held object (#3447): a rigid displacement
   * in the hand's frame at a share of this window from 0 to 1, metres, the
   * identity at 0. The performance composes it before the offset it stored
   * at closure (position R_d p + t_d, rotation R_d R), so a pen
   * turned into a writing grip or a coin rolled across the fingers moves in
   * the hand while the hand holds it. It must be a pure function of the
   * share. Absent, the object keeps the offset it had at closure.
   *
   * @param share The share of the window, in [0, 1].
   * @returns The object's displacement in the hand's frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanContactWindow.inHand: A grip's in-hand motion of the held object (#3447): a rigid displacement in the hand's frame at a share of this window from 0 to 1, metres, the identity at 0. The performance composes it before the offset it stored at closure (position R_d p + t_d, rotation R_d R), so a pen turned into a writing grip or a coin rolled across the fingers moves in the hand while the hand holds it. It must be a pure function of the share. Absent, the object keeps the offset it had at closure.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanContactWindow.inHand is used through packages/motions/src/perform/HumanPropHold.ts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanContactWindow.inHand is used through packages/motions/src/perform/HumanPropHold.ts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanContactWindow.inHand is used through packages/motions/src/perform/HumanPropHold.ts.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanContactWindow.inHand is used through packages/motions/src/perform/HumanPropHold.ts.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanContactWindow.inHand is used through packages/motions/src/perform/HumanPropHold.ts.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanContactWindow.inHand is used through packages/motions/src/perform/HumanPropHold.ts.
   */
  inHand?(share: number): {
    /** Prop displacement in the holding hand's frame, metres; zero at share 0. */
    position: IAutoMovieVector3;
    /** Prop rotation in the holding hand's frame, unit quaternion; identity at share 0. */
    rotation: IAutoMovieQuaternion;
  };

  /**
   * The surface region of the body that touches, when the window names it
   * more precisely than its part: a knee (`kneeLeft`) on the floor for a
   * lower leg, a palm on a vault, a forearm on a table. The engine anchors
   * each region to one bone and resolves its point on that bone's collision
   * shapes, so the balance and slip audits read the contact there rather
   * than at the part's end joint. Absent, the contact is where the part's
   * own kind puts it (a sole, a palm, the seat bones).
   */
  region?: AutoMovieHumanoidRegion;

  /**
   * The point of a planted foot that holds its place, when the law holds one
   * through the window: the ball a heel rises about, the heel a forefoot
   * lowers about, or the leg goal's own `contact`. The slip and lift audits
   * then read that point instead of the sole's lowest socket, so a foot
   * turning about its held ball is not read as slipping where its toe tip
   * rolls under it, and a ball that slides still is. Absent, the contact is
   * the lowest socket at each instant, as a foot rolls through the rockers
   * of stance.
   */
  socket?: IAutoMovieMotionHumanContactWindow.Socket;

  /**
   * The share of the body's weight this contact bears, in [0, 1] (#3425).
   * Absent, a plant, a pivot, a seat, a lie and a bear share the weight
   * equally among the bearing windows open at the instant, and a grip and a
   * strike bear none. The shares of the windows open at one instant need not
   * sum to 1 when another support (a partner, a hanging grip) takes the
   * rest; the statics verdict reads the declared shares as weights of the
   * contacts' centre.
   */
  load?: number;
}

/**
 * Companion types of {@link IAutoMovieMotionHumanContactWindow}.
 *
 */
export namespace IAutoMovieMotionHumanContactWindow {
  /**
   * The held point of a planted foot: a named sole socket, or a point in the
   * foot's rest frame relative to its ankle joint, metres, as a leg goal's
   * `contact` names it (`IAutoMovieHumanLimbGoal.contact`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both forms, the frame and the unit.
   * @evidence contracts/development/design.md#principled-representation A sole socket by name, or the same rest-frame offset a leg goal turns its foot about.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the slip and lift audits (audit/AutoMovieMotionHumanAuditGround.ts, plants).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanFoot.Socket and IAutoMovieVector3 identities.
   */
  export type Socket = IAutoMovieMotionHumanFoot.Socket | IAutoMovieVector3;

  /**
   * The frame a contact bears on: the ground, a prop subject, a person's
   * region, or a person's segment, the bone an arm's segment lies along (a
   * self-hug's forearm on the other forearm), where a region's point and
   * frame would not say which part of the segment it lies on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation kind: Support discriminant: ground, prop or another person. kind: Support discriminant: ground, prop or another person. subject: Scene subject id of the supporting prop or person.
   * @evidence contracts/development/design.md#principled-representation kind: Support discriminant: ground, prop or another person. kind: Support discriminant: ground, prop or another person. subject: Scene subject id of the supporting prop or person.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/supportWindows.ts (supportWindows.of.frames, return); carrier/HumanSupportFrame.ts (HumanSupportFrame.of, return); carrier/HumanSupportFrame.ts (HumanSupportFrame.contact, return); carrier/HumanSupportFrame.ts (HumanSupportFrame.at, named); compose/AutoMovieMotionHumanTouchContacts.ts (AutoMovieMotionHumanTouchContacts.windows, hand); perform/HumanPerformancePlace.ts (HumanPerformancePlace.place.context, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidRegion, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
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
        /** The prop's named point whose frame bears the contact, for a contact on a moving part (a pedal on its crank, a tread's plate); the whole prop's frame when absent. */
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
        /** Supporting person's bone when the contact is specified by bone rather than region. */
        bone: AutoMovieHumanoidBone;
      };

  /**
   * A stationary horizontal surface, such as the floor or a stair tread.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Height measures world elevation in metres. An omitted height selects the floor.
   * @evidence contracts/development/design.md#principled-representation The ground discriminant identifies horizontal stationary support, so elevation alone locates its plane.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The contact window uses this variant for both floor and tread support. Height distinguishes raised treads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller supplies actual support elevation without encoding a stair number or scene.
   */
  export interface IGround {
    /** Support discriminant. */
    kind: "ground";
    /** The surface's world height in metres. Defaults to the world floor. */
    height?: number;
  }
}
