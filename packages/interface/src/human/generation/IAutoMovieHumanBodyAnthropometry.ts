/**
 * Closed vocabularies mapping body tape controls to their resolved anatomical
 * fields. Runtime construction and admission remain with
 * AutoMovieHumanBodyAnatomy in Human.
 */
export namespace IAutoMovieHumanBodyAnthropometry {
  /** A body control whose unknown value takes its survey line on stature. */
  export type TapeControl =
    | "chest"
    | "underbust"
    | "waist"
    | "hip"
    | "neckBase"
    | "neck"
    | "bustSpan"
    | "neckToWaist"
    | "shoulderToApex"
    | "upperArmLength"
    | "lowerArmLength"
    | "bicep"
    | "elbow"
    | "forearm"
    | "wrist"
    | "handCircumference"
    | "inseam"
    | "thigh"
    | "knee"
    | "calf";

  /** An anatomy field that replaces a body control's tape or length. */
  export type TapeField =
    | "chestCircumference"
    | "underbustCircumference"
    | "waistCircumference"
    | "hipCircumference"
    | "neckBaseCircumference"
    | "neckCircumference"
    | "bustPointWidth"
    | "backNeckToWaist"
    | "sideNeckToBustPoint"
    | "upperArmLength"
    | "forearmLength"
    | "upperArmCircumference"
    | "elbowCircumference"
    | "forearmCircumference"
    | "wristCircumference"
    | "handCircumference"
    | "inseam"
    | "thighCircumference"
    | "kneeCircumference"
    | "calfCircumference";
}
