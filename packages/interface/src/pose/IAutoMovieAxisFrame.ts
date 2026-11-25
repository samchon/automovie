/**
 * One degree-valued affine clinical mapping: clinical = sign * rig + neutral.
 * Conversion owners admit sign plus/minus one and finite neutral; the type
 * itself performs no validation.
 */
export interface IAutoMovieAxisFrame {
  /** Axis direction relative to the clinical convention. */
  sign: 1 | -1;

  /** Clinical angle in degrees represented by the rig's rest orientation. */
  neutral: number;
}
