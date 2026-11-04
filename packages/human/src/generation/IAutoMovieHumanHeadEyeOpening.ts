/** One eye's opening, calibration millimetres. */
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
