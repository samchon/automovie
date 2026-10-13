import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Eye traits of an {@link IAutoMovieHead}: signed weights in `[-2, 2]`,
 * omitted meaning unchanged. Every control is symmetric, so one value moves
 * both eyes. The `epicanthus`/`fold` cues are the East-Asian-defining controls.
 *
 * `flattenHead` projects `openness` onto the `eyeHeight` morph and `tilt` onto
 * `eyeAngle`; the other fields land on same-stem names (`eyeSize`,
 * `eyeSpacing`, `eyeDepth`, `epicanthus`, `eyeFold`).
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
