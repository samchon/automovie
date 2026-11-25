/**
 * Named world-XZ polyline whose declared width constrains formations and guides
 * compact route placement.
 */
export interface IAutoMovieWorldRoute {
  /** Stable route id. */
  id: string;

  /** At least two finite ordered centerline points in world XZ coordinates. */
  waypoints: Array<{
    /** World X in meters. */
    x: number;

    /** World Z in meters. */
    z: number;
  }>;

  /** Finite maximum formation width in meters, strictly above zero. */
  allowedFormationWidth: number;
}
