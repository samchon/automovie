import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
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
  ] as const;

  /** The ways a part bears, as data. */
  export const KINDS = [
    "plant",
    "pivot",
    "grip",
    "seat",
    "lie",
    "strike",
  ] as const;

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
