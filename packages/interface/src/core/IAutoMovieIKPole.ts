/** Pole target controlling which way an IK chain bends. */
export interface IAutoMovieIKPole {
  /** Node the pole points toward, or `null` to use only `angle`. */
  node: string | null;

  /** Pole roll angle in degrees. */
  angle: number;
}
