/**
 * Named world-XZ polyline whose declared width constrains formations and guides compact route placement.
 *
 * @evidence contracts/common.md#principled-implementation Ordered finite waypoints define the centerline; placement uses arc length and lateral offset while formation route checks compare declared width against the unit's spatial footprint.
 * @evidence contracts/common.md#clear-and-simple-design A stable id, centerline and allowed width describe route authority without embedding per-member transforms or timing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts At least two points and finite positive route length are required by placement, and declared width is a constraint rather than an inferred road mesh measurement.
 * @evidence contracts/common.md#meaningful-documentation Defines ordered meter coordinates, minimum point population, route identity and finite positive width.
 * @author Samchon
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
