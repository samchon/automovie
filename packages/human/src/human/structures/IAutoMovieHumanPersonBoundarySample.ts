/**
 * One canonical sample of the shared face/body neck polyline: its position
 * (metres) and unit normal, both interpolated from the evaluated face loop in
 * the shared Y-up, +Z-forward posed frame.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBoundarySample {
  /** Position on the face loop, metres. */
  point: number[];

  /** Unit normal interpolated along the face loop. */
  normal: number[];
}
