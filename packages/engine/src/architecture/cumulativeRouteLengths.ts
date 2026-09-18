/** Cumulative 3D arc length at each route station, starting at zero.  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const cumulativeRouteLengths = (
  route: readonly IAutoMovieVector3[],
): number[] => {
  const lengths = [0];
  for (let index = 0; index + 1 < route.length; ++index)
    lengths.push(
      lengths[index]! +
        Vector3.length(Vector3.subtract(route[index + 1]!, route[index]!)),
    );
  return lengths;
};
