import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Eyes: symmetric shared controls (asymmetry is a future global axis). The
 * `epicanthus`/`fold` cues are the East-Asian-defining controls.
 *
 * @author Samchon
 */
export interface IAutoMovieHeadEyes {
  /** Overall eye size relative to the face: `+` larger (feminine/young). */
  size?: AutoMovieFaceWeight;

  /** Lid aperture openness: `+` more open, `-` narrower. */
  openness?: AutoMovieFaceWeight;

  /** Inter-eye spacing: `+` wider-set (cute/neoteny), `-` closer. */
  spacing?: AutoMovieFaceWeight;

  /** Outer-canthus tilt: `+` up (youthful), `-` down. */
  tilt?: AutoMovieFaceWeight;

  /** Eyeball protrusion in the socket: `+` more prominent, `-` deeper-set. */
  depth?: AutoMovieFaceWeight;

  /** Epicanthic fold at the inner corner: `+` more (East-Asian), `-` open. */
  epicanthus?: AutoMovieFaceWeight;

  /** Upper-lid fold: `+` hooded/mono-lid, `-` deeper double-lid crease. */
  fold?: AutoMovieFaceWeight;
}
