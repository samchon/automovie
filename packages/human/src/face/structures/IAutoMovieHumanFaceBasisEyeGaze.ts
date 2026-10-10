/**
 * One gaze channel of an eye: the authored unit axis it rotates about, the
 * degrees reached at weight one and the globe translation that accompanies it.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisEyeGaze {
  /** The expression channel that drives this rotation. */
  channel: string;
  /** Authored unit rotation axis in the head frame. */
  axis: [number, number, number];
  /** Rotation at weight one, in degrees. */
  degrees: number;
  /** Globe translation at weight one, in metres. */
  translation: [number, number, number];
}
