/**
 * Iris colour, as a closed choice ordered from the lightest to the darkest iris.
 *
 * The eye generator turns a choice into stroma colour and pattern. The choice is a category because no continuous measurement of iris pigment was read; a measured quantity replaces it when one is.
 */
export const enum AutoMovieHumanIrisColor {
  /** Blue iris. */
  Blue = "blue",

  /** Grey iris. */
  Gray = "gray",

  /** Green iris. */
  Green = "green",

  /** Hazel iris: brown near the pupil, green or grey toward the limbus. */
  Hazel = "hazel",

  /** Light brown iris. */
  LightBrown = "lightBrown",

  /** Brown iris. */
  Brown = "brown",

  /** Dark brown iris that reads nearly black. */
  DarkBrown = "darkBrown",
}
