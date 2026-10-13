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
 * @evidence contracts/common.md#principled-implementation Seven symmetric leaves that `flattenHead` maps through its eyes table, with `openness` landing on the `eyeHeight` name and `tilt` on `eyeAngle`, each applied by the template as an additive delta.
 * @evidence contracts/common.md#clear-and-simple-design One record for both eyes because this vocabulary has no side axis; eyelid fold and epicanthus sit with aperture and placement since they shape the same orbit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The openness and tilt renames are fixed table entries; nothing checks that a template's `eyeHeight` target encodes aperture rather than the vertical position the face vocabulary gives that word.
 * @evidence contracts/common.md#meaningful-documentation States the symmetry, the morph names that differ from field names, and the East-Asian eyelid controls; members give each leaf's direction.
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
