/**
 * Tissue of a separate mesh a part carries, which decides its material until the appearance stage sets materials per tissue.
 *
 * The union grows as parts add meshes: eyeballs, teeth, tongue, hair and garments join it when their generators land.
 *
 * @author Samchon
 */
export type AutoMovieHumanTissue =
  /** A nail plate, keratin over the nail bed. */
  "nail";
