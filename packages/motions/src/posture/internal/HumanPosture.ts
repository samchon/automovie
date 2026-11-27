import type {
  AutoMovieHumanDigit,
  AutoMovieHumanLimb,
} from "@automovie/interface";

/*
 * Companion types of HumanPosture.
 */
export namespace HumanPosture {
  /*
   * The limbs of Limb, as data.
   */
  export const LIMBS = [
    "leftArm",
    "rightArm",
    "leftLeg",
    "rightLeg",
  ] as const satisfies readonly NonNullable<AutoMovieHumanLimb>[];

  /*
   * The digits of Digit, as data, the left hand's first, each thumb to
   * little finger.
   */
  export const DIGITS = [
    "leftThumb",
    "leftIndex",
    "leftMiddle",
    "leftRing",
    "leftLittle",
    "rightThumb",
    "rightIndex",
    "rightMiddle",
    "rightRing",
    "rightLittle",
  ] as const satisfies readonly NonNullable<AutoMovieHumanDigit>[];
}
