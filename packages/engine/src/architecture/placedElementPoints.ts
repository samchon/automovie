/**
 * The world points one placed element draws, or its origin when it draws none.
 *
 * Parts are placed the way the renderer places them, each under its own
 * transform and then under the element's world matrix. A model the environment
 * does not own is `undefined` here rather than an error, because a runtime
 * model reference is a legal way to furnish a building and the record simply
 * does not carry its vertices.
  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const placedElementPoints = (
  model: IAutoMovieModel | undefined,
  world: number[],
): IAutoMovieVector3[] => {
  const points = (model === undefined ? [] : model.parts).flatMap((part) =>
    placedPartPoints(part, world),
  );
  return points.length === 0
    ? [applyMatrix(world, { x: 0, y: 0, z: 0 })]
    : points;
};
