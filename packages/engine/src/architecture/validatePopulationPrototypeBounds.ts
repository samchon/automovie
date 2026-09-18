/**
 * Check exactly what a building owns about a population it stages.
 *
 * The whole instance-set design is the production builder's to validate, and
 * it validates it again when the lowered set reaches the world. What is checked
 * here is the subset this record answers for on its own: the slot count and the
 * placement law {@link builtInstanceSetPlacementBounds} has to be total over,
 * because a space query that cannot bound a population it was handed would have
 * to return either a lie or nothing at all.
  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const validatePopulationPrototypeBounds = (
  bounds: IAutoMovieBuiltPopulation["prototypeBounds"],
  path: string,
  collector: ViolationCollector,
): void => {
  finiteVector(
    bounds.min,
    `${path}.min`,
    "population prototype minimum",
    collector,
  );
  finiteVector(
    bounds.max,
    `${path}.max`,
    "population prototype maximum",
    collector,
  );
  for (const axis of ["x", "y", "z"] as const)
    if (
      Number.isFinite(bounds.min[axis]) &&
      Number.isFinite(bounds.max[axis]) &&
      bounds.min[axis] > bounds.max[axis]
    )
      collector.push(
        "range",
        `${path}.${axis}`,
        `population prototype ${axis} bounds must be ordered, but ${bounds.min[axis]} is above ${bounds.max[axis]}`,
        { min: bounds.min[axis], max: bounds.max[axis] },
      );
};
