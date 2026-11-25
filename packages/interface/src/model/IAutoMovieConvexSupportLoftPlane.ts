/** One fixed oriented support plane in the local XZ section. */
export interface IAutoMovieConvexSupportLoftPlane {
  /** Unique plane identity within the loft registry. */
  id: string;

  /** Dimensionless outward unit normal [nx,nz]. */
  normal: [number, number];
}
