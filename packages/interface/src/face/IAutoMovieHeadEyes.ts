/**
 * Eye traits of an {@link IAutoMovieHead}: signed weights in `[-2, 2]`, with
 * omission leaving the template unchanged.
 *
 * Every control is symmetric, so one value moves both eyes. `flattenHead`
 * renames `openness` to `eyeHeight` and `tilt` to `eyeAngle`, and the other
 * fields to same-stem names (`eyeSize`, `eyeSpacing`, `eyeDepth`,
 * `epicanthus`, `eyeFold`).
 *
 * @evidence contracts/common.md#principled-implementation `HEAD_PARAMETERS.eyes` in `flattenHead` renames all seven leaves one-to-one, two of them to names that differ from the field, which the documentation lists so a template author can name targets correctly.
 * @evidence contracts/common.md#clear-and-simple-design Seven unsided leaves cover size, aperture, placement, depth and both lid folds in one record; sided eye traits belong to `IAutoMovieFaceEyeSet` instead.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fold controls are ordinary leaves with no population-specific default or preset; every leaf is copied unchanged for the template to interpret.
 * @evidence contracts/common.md#meaningful-documentation States the range and neutral meaning, that the controls are symmetric, and every morph name including the two renamed ones; members give each sign's direction.
 * @author Samchon
 */
export interface IAutoMovieHeadEyes {
  /** Overall eye size relative to the face: `+` larger, `-` smaller. */
  size?: number;

  /** Lid aperture: `+` more open, `-` narrower. */
  openness?: number;

  /** Distance between the eyes: `+` wider-set, `-` closer. */
  spacing?: number;

  /** Outer-corner tilt: `+` up, `-` down. */
  tilt?: number;

  /** Eyeball protrusion in the socket: `+` more prominent, `-` deeper-set. */
  depth?: number;

  /** Epicanthic fold over the inner corner: `+` more covered, `-` open. */
  epicanthus?: number;

  /** Upper-lid fold: `+` hooded toward a single lid, `-` a deeper crease. */
  fold?: number;
}
