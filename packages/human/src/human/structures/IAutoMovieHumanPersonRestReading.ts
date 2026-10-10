/**
 * What a person's closed skin at rest measures: stature and enclosed volume.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonRestReading {
  /** Highest minus lowest Float32 skin height at rest, metres. */
  statureMetres: number;

  /** Volume the closed Float32 skin encloses at rest, cubic metres. */
  volumeCubicMetres: number;
}
