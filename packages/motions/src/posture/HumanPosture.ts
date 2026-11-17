import type {
  AutoMovieHumanDigit,
  AutoMovieHumanLimb,
} from "@automovie/interface";

/**
 * Companion types of {@link HumanPosture}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's frame and unit.
 * @evidence contracts/development/design.md#principled-representation World-frame goals with a bend hint and an optional end rotation, the inputs of two-bone IK with a pole vector; a digit goal is a surface of the distal phalanx on a point with an optional facing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What laws write and the resolver reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses interface vectors and quaternions.
 */
export namespace HumanPosture {
  /** The limbs of {@link Limb}, as data. */
  export const LIMBS = [
    "leftArm",
    "rightArm",
    "leftLeg",
    "rightLeg",
  ] as const satisfies readonly NonNullable<AutoMovieHumanLimb>[];

  /** The digits of {@link Digit}, as data, the left hand's first, each thumb to little finger. */
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
