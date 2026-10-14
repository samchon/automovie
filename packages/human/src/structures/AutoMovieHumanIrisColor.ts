/**
 * Iris colour, as a closed choice ordered from the lightest to the darkest iris.
 *
 * The eye generator turns a choice into stroma colour and pattern. The choice is a category because no continuous measurement of iris pigment was read; a measured quantity replaces it when one is.
 *
 * @author Samchon
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
