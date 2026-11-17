/** One eye's opening, calibration millimetres.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation One eye's opening, calibration millimetres.
 * @evidence contracts/development/design.md#principled-representation `place`: Distance of the fissure's centre from the midline. `length`: Length of the margin, endocanthion to exocanthion in 3D. `height`: Height of the margin.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadEyeMargin.margin, canthi. Also types AutoMovieHumanHeadLandmarks.opening, AutoMovieHumanHeadEyeParts.eye.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `place`, `length`, `height`, `inner`, `span`, `seat`; callers supply the complete record.
 */
export interface IAutoMovieHumanHeadEyeOpening {
  /** Distance of the fissure's centre from the midline. */
  place: number;

  /** Length of the margin, endocanthion to exocanthion in 3D. */
  length: number;

  /** Height of the margin. */
  height: number;

  /** Half the intercanthal width: the endocanthion's distance from the midline. */
  inner: number;

  /** Half-span of the margin's lateral harmonic, solved so the canthi stand the length apart. */
  span: number;

  /** How far the socket falls to seat the eye. */
  seat: number;
}
