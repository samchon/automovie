/**
 * Refuse a carriage that does not stand in the space its state says it serves.
 *
 * A named stop is a claim about geometry, so it is settled against geometry:
 * the state is applied, the element the carriage drives is placed, and its own
 * origin has to land inside the space. A space that bounds nothing is skipped
 * rather than failed, because a purely semantic container has no inside for the
 * car to be in and refusing it would outlaw a run through an unbounded region.
 *
 * Every other member stands where the environment's current state puts it, the
 * same rule the swept envelope follows, so a state is measured as the one
 * change it makes rather than against a configuration nothing declared.
  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const validateCarriageService = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
): void => {
  const staged = operationDeltas(environment);
  environment.connectors.forEach((connector, index) => {
    const operation = connector.operation;
    if (operation === undefined) return;
    operation.states.forEach((state, stateIndex) => {
      const claims: Array<{ space: string; carriage: string; at: number }> = [];
      state.carriages.forEach((entry, valueIndex) => {
        if (
          entry.serves === null ||
          !spaceSubtreeIsBounded(environment, entry.serves)
        )
          return;
        claims.push({
          space: entry.serves,
          carriage: entry.carriage,
          at: valueIndex,
        });
      });
      // Placing every element of the work is the expensive half, so a state
      // that claims no bounded space never pays for it.
      if (claims.length === 0) return;
      const deltas = new Map(staged);
      applyCarriageState(operation.carriages, state, deltas);
      const matrices = worldMatricesOf(environment, deltas);
      for (const claim of claims) {
        const carriage = operation.carriages.find(
          (candidate) => candidate.id === claim.carriage,
        )!;
        const world = matrices.get(carriage.element)!;
        const point: IAutoMovieVector3 = {
          x: world[12]!,
          y: world[13]!,
          z: world[14]!,
        };
        if (
          builtEnvironmentContainsPoint(environment, claim.space, point) ===
          false
        )
          collector.push(
            "range",
            `${root}.connectors[${index}].operation.states[${stateIndex}].carriages[${claim.at}].serves`,
            `operating state "${state.id}" stands carriage "${carriage.id}" at (${point.x}, ${point.y}, ${point.z}), which is outside the space "${claim.space}" it serves`,
            claim.space,
          );
      }
    });
  });
};
