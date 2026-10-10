/**
 * The straight distance between two named skin points, as a sliding caliper's
 * blades read it between two drawn landmarks.
 *
 * Both points are fixed anatomical landmarks registered on the basis skin
 * (`skinLandmarks`), so the reading follows them on every shape.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinLandmarkDistance {
  /** A straight distance between two skin landmarks. */
  kind: "skin-distance";

  /** Skin landmark name at one end. */
  from: string;

  /** Skin landmark name at the other end. */
  to: string;
}
