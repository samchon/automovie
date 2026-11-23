import type {
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

/** Companion types of {@link HumanContactWindow}. */
export namespace HumanContactWindow {
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
    "head",
    "chest",
  ] as const satisfies readonly NonNullable<
    IAutoMovieMotionHumanContactWindow["part"]
  >[];

  /**
   * The ways a part bears, as data. `bear` is a part that carries weight
   * without being a foot's plant: a knee or a shin on the floor, a palm on a
   * vault, a forearm on a table.
   */
  export const KINDS = [
    "plant",
    "pivot",
    "grip",
    "seat",
    "lie",
    "strike",
    "bear",
  ] as const satisfies readonly NonNullable<
    IAutoMovieMotionHumanContactWindow["kind"]
  >[];

  /**
   * The surface region each part touches with when a window names no `region`:
   * a foot's sole, a hand's palm, the seat bones, the upper back, the outer
   * face of an arm segment, the front of a thigh and a knee, the back of the
   * head and the breastbone. The one table the audits read a window's contact
   * point from.
   */
  export const REGIONS: Readonly<
    Record<IAutoMovieMotionHumanContactWindow["part"], AutoMovieHumanoidRegion>
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
    head: "headBack",
    chest: "sternum",
  };

  /** The kinds that bear the body's weight when no `load` says otherwise. */
  export const BEARING: readonly IAutoMovieMotionHumanContactWindow["kind"][] =
    ["plant", "pivot", "seat", "lie", "bear"];
}
