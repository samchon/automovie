/**
 * Iris colour, as a closed choice ordered from the lightest to the darkest
 * iris.
 *
 * The choice describes an iris colour category rather than a measured pigment
 * concentration or a stroma pattern.
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
