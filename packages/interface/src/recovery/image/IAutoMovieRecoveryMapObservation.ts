/** One automatically linked, geometrically retained landmark observation. */
export interface IAutoMovieRecoveryMapObservation {
  /** Index in the owning operation's source array; zero and one are the seed. */
  viewIndex: number;

  /** Index in this image's once-observed feature population. */
  featureIndex: number;

  /** Measured [x,y] image pixel centre, with +X right and +Y down. */
  pixel: [number, number];
}
