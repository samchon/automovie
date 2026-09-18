/** Climb, horizontal run, 3D length, and slope of one route polyline.  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const routeMetrics = (
  route: readonly IAutoMovieVector3[],
): { rise: number; run: number; length: number; slope: number } => {
  let run = 0;
  let length = 0;
  for (let index = 0; index + 1 < route.length; ++index) {
    const delta = Vector3.subtract(route[index + 1]!, route[index]!);
    run += Math.hypot(delta.x, delta.z);
    length += Vector3.length(delta);
  }
  const rise = route[route.length - 1]!.y - route[0]!.y;
  return { rise, run, length, slope: Math.atan2(Math.abs(rise), run) };
};
