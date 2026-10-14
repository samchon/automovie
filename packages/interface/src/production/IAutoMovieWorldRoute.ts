/**
 * Named world-XZ polyline whose declared width constrains formations and guides compact route placement.
 *
 * @evidence contracts/common.md#principled-implementation World admission bounds waypoint components to +/-1e9 and requires positive finite summed segment length and width. Along-route placement uses arc length and lateral offset; the formation measurement's routeClearance takes the minimum declared route width minus the sampled formation's world-X AABB span across all world routes, rather than proving containment in a selected road corridor.
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
