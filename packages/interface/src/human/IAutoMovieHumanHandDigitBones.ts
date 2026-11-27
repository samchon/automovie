import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Ordered digit bone directions and millimetre lengths consumed by the digit
 * course builder.
 *
 * The interface package owns these declarations; AutoMovieHumanHandDigitBones
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHandDigitBones {
  /**
   * The legs argument of AutoMovieHumanHandDigitBones.onBones. A digit's line,
   * sections, tip and first section on its legs. A finger's sections follow the
   * phalanx span law from its own root section (the form's, scaled by the
   * hand's across and through scales), the thumb's are the form's read at the
   * same share of the way from the root to the tip; both carry the joint
   * swellings, creases, pulp and nail of `AutoMovieHumanDigitProfile`, each
   * drawn as the four-guide ring (`AutoMovieHumanDigitRing`); the line turns at
   * each joint over the elbow's rule, half a length of `softness` times the
   * joint's radius; the tip closes where its radius equals the length left to
   * the apex (`AutoMovieHumanDigitTipCap`).
   *
   * @param rootAt Length along the line of the digit's root, where the form's
   *   sections start; 0 for the thumb, whose line starts at its root.
   * @param joints Lengths of its joints along the line, proximal first.
   */
  export type OnBonesLegs = readonly {
    /** Unit direction of this bone segment in the registered frame. */
    direction: AutoMovieVector3Tuple;
    /** Distance along this bone segment, millimetres. */
    length: number;
  }[];
}
