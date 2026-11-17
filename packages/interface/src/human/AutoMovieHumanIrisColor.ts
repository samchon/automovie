/**
 * Iris colour, as a closed choice ordered from the lightest to the darkest iris.
 *
 * The choice describes an iris colour category rather than a measured pigment concentration or a stroma pattern.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Iris colour, as a closed choice ordered from the lightest to the darkest iris.
 * @evidence contracts/development/design.md#principled-representation Closed visible iris-color categories represent appearance, not a measured melanin concentration or eye orientation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the vocabulary. Pigmentation stores the iris choice independently of constitutive skin pigmentation and clinical eye pose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One color choice is independent of reference population; no ancestry-derived color constraint is imposed.
 */
export type AutoMovieHumanIrisColor =
  /** Blue iris. */
  | "blue"
  /** Grey iris. */
  | "gray"
  /** Green iris. */
  | "green"
  /** Hazel iris: brown near the pupil, green or grey toward the limbus. */
  | "hazel"
  /** Light brown iris. */
  | "lightBrown"
  /** Brown iris. */
  | "brown"
  /** Dark brown iris that reads nearly black. */
  | "darkBrown";
