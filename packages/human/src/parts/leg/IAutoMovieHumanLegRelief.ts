/**
 * One superficial form of the leg that raises or lowers the skin over a patch of the limb: a muscle belly, a bony prominence, a tendon groove or a fat pad.
 *
 * A relief is placed in the leg's own anatomical coordinates, so one table serves both sides and every identity. Its height runs along one segment as a fraction of that segment's joint-to-joint length, which carries an attachment level read from an atlas onto any leg length; its angle runs around the limb from the anterior direction toward the medial one, so the same entry makes the medial gastrocnemius head on the left and on the right leg.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanLegRelief {
  /** Anatomical name, for reading the table. */
  name: string;

  /**
   * What lifts the skin, which decides what scales the relief.
   *
   * - `muscle`: a muscle belly, scaled by lean mass and softened by the fat over it.
   * - `bone`: a subcutaneous bony landmark or tendon, softened by the fat over it.
   * - `fat`: a fat pad, scaled by the fat thickness at the site.
   */
  tissue: "muscle" | "bone" | "fat";

  /**
   * Segment whose length measures the levels: the thigh from the knee joint centre (0) to the hip joint centre (1), or the shank from the ankle joint centre (0) to the knee joint centre (1). Levels outside 0 to 1 reach across the knee into the other segment.
   */
  segment: "thigh" | "shank";

  /** Lowest level the relief reaches, where it fades to nothing. */
  bottom: number;

  /** Level of its fullest point. */
  peak: number;

  /** Highest level the relief reaches, where it fades to nothing. */
  top: number;

  /**
   * Angle of its crest from the anterior direction toward the medial one, degrees, at its bottom level; negative angles turn toward the lateral side.
   */
  angleBottom: number;

  /** The same angle at its top level; the crest turns linearly between, as the sartorius and the hamstrings spiral around the thigh. */
  angleTop: number;

  /** Angular half width, degrees: the standard deviation of its Gaussian profile around the limb. */
  width: number;

  /**
   * Height at the fullest point as a fraction of the local mean radius, before the tissue scaling; negative for a groove or hollow.
   */
  amplitude: number;
}
