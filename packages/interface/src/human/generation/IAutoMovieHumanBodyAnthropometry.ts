/**
 * Closed vocabularies mapping body tape controls to their resolved anatomical fields. Runtime construction and admission remain with AutoMovieHumanBodyAnatomy in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes closed vocabularies mapping body tape controls to their resolved anatomical fields; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Closed vocabularies mapping body tape controls to their resolved anatomical fields. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanBodyAnatomy; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing BodyAnthropometry contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanBodyAnthropometry {
  /** A body control whose unknown value takes its survey line on stature.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A body control whose unknown value takes its survey line on stature.
   * @evidence contracts/development/design.md#principled-representation A body control whose unknown value takes its survey line on stature. The closed alternatives are "chest", "underbust", "waist", "hip", "neckBase", "neck", "bustSpan", "neckToWaist", "shoulderToApex", "upperArmLength", "lowerArmLength", "bicep", "elbow", "forearm", "wrist", "handCircumference", "inseam", "thigh", "knee", "calf".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodyAnatomy.TAPE_ON_STATURE, AutoMovieHumanBodyAnatomy.TAPE_FIELD.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyAnatomy.tape, AutoMovieHumanBodyAnatomy.box, AutoMovieHumanBodyAnatomy.TAPE_ON_STATURE, AutoMovieHumanBodyAnatomy.TAPE_FIELD for a body control whose unknown value takes its survey line on stature.
   */
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

  /** An anatomy field that replaces a body control's tape or length.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation An anatomy field that replaces a body control's tape or length.
   * @evidence contracts/development/design.md#principled-representation An anatomy field that replaces a body control's tape or length. The closed alternatives are "chestCircumference", "underbustCircumference", "waistCircumference", "hipCircumference", "neckBaseCircumference", "neckCircumference", "bustPointWidth", "backNeckToWaist", "sideNeckToBustPoint", "upperArmLength", "forearmLength", "upperArmCircumference", "elbowCircumference", "forearmCircumference", "wristCircumference", "handCircumference", "inseam", "thighCircumference", "kneeCircumference", "calfCircumference".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodyAnatomy.TAPE_FIELD.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyAnatomy.TAPE_FIELD for an anatomy field that replaces a body control's tape or length.
   */
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
