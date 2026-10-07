/**
 * The straight distance between two shaped landmarks.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyLandmarkDistance {
  /** A straight landmark-to-landmark length. */
  kind: "distance";

  /** Landmark id at one end. */
  from: string;

  /** Landmark id at the other end. */
  to: string;
}
