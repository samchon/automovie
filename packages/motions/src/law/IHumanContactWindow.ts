import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 */
export interface IHumanContactWindow {
  /** The body part in contact. */
  part: (typeof IHumanContactWindow.PARTS)[number];

  /** How it bears: fixed, turning about the contact, holding, sitting, lying or striking. */
  kind: (typeof IHumanContactWindow.KINDS)[number];

  /** Start share. */
  from: number;

  /** End share. */
  to: number;

  /** The frame the contact bears on. */
  support: IHumanContactWindow.Support;

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
   */
  inHand?(share: number): {
    position: IAutoMovieVector3;
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
/** Companion types of {@link IHumanContactWindow}. */
export namespace IHumanContactWindow {
  /** The body parts a contact window can name, as data. */
  export const PARTS = [
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
  ] as const;

  /**
   * The ways a part bears, as data. `bear` is a part that carries weight
   * without being a foot's plant: a knee or a shin on the floor, a palm on a
   * vault, a forearm on a table (#3425).
   */
  export const KINDS = [
    "plant",
    "pivot",
    "grip",
    "seat",
    "lie",
    "strike",
    "bear",
  ] as const;

  /**
   * The surface region each part touches with when a window names no
   * `region`: a foot's sole, a hand's palm, the seat bones, the upper back,
   * the outer face of an arm segment, the front of a thigh and a knee. The
   * one table the audits read a window's contact point from.
   */
  export const REGIONS: Readonly<
    Record<(typeof PARTS)[number], AutoMovieHumanoidRegion>
  > = {
    leftFoot: "soleLeft",
    rightFoot: "soleRight",
    leftHand: "palmLeft",
    rightHand: "palmRight",
    seat: "seat",
    back: "upperBack",
    leftUpperArm: "upperArmLeft",
    rightUpperArm: "upperArmRight",
    leftLowerArm: "forearmLeft",
    rightLowerArm: "forearmRight",
    leftUpperLeg: "thighFrontLeft",
    rightUpperLeg: "thighFrontRight",
    leftLowerLeg: "kneeLeft",
    rightLowerLeg: "kneeRight",
  };

  /** The kinds that bear the body's weight when no `load` says otherwise. */
  export const BEARING: readonly (typeof KINDS)[number][] = [
    "plant",
    "pivot",
    "seat",
    "lie",
    "bear",
  ];

  /**
   * The frame a contact bears on: the ground, a prop subject, a person's
   * region, or a person's segment, the bone an arm's segment lies along (a
   * self-hug's forearm on the other forearm), where a region's point and
   * frame would not say which part of the segment it lies on.
   */
  export type Support =
    | { kind: "ground" }
    | { kind: "prop"; subject: string }
    | { kind: "person"; subject: string; region: AutoMovieHumanoidRegion }
    | { kind: "person"; subject: string; bone: AutoMovieHumanoidBone };
}
