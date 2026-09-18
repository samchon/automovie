/**
 * Refuse a configuration the scene could not stage, in any state the record
 * names.
 *
 * A staged node is world TRS, so a composed hierarchy carrying shear cannot be
 * lowered without silently dropping it. Checking only the state the record
 * currently stands in would let a door pass shut and lie open: the same
 * revolute leaf below a non-uniformly scaled ancestor is a clean rigid frame at
 * rest and a sheared one a quarter turn later, and both the staged set and the
 * placement queries would answer with a decomposition that never existed.
 *
 * Only the subtree a state actually moves is re-checked. A delta rides down
 * from the element it drives, so nothing above or beside it can change, and
 * measuring the untouched remainder once per state would be the same answer
 * paid for again.
  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const validateStagedConfigurations = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
): void => {
  const staged = operationDeltas(environment);
  const base = worldMatricesOf(environment, staged);
  environment.elements.forEach((element, index) => {
    if (isSheared(base.get(element.id)!))
      collector.push(
        "type",
        `${root}.elements[${index}].transform`,
        "the composed hierarchy contains shear, which cannot be lowered to the scene's world TRS; keep rotated descendants below uniformly scaled ancestors",
        element.transform,
      );
  });

  /** Report the elements one alternative configuration would shear. */
  const alternative = (props: {
    path: string;
    state: string;
    moved: readonly string[];
    deltas: Map<string, number[]>;
  }): void => {
    const touched = descendantElements(environment, props.moved);
    const matrices = worldMatricesOf(environment, props.deltas);
    for (const id of touched)
      if (isSheared(matrices.get(id)!)) {
        collector.push(
          "type",
          props.path,
          `operating state "${props.state}" composes shear into element "${id}", which cannot be lowered to the scene's world TRS; keep rotated descendants below uniformly scaled ancestors`,
          props.state,
        );
        return;
      }
  };
  environment.openings.forEach((opening, index) => {
    const operation = opening.operation;
    if (operation === undefined) return;
    operation.states.forEach((state, stateIndex) => {
      if (state.id === operation.state) return;
      const deltas = new Map(staged);
      applyPanelState(operation.panels, state, deltas);
      alternative({
        path: `${root}.openings[${index}].operation.states[${stateIndex}]`,
        state: state.id,
        moved: operation.panels.map((panel) => panel.element),
        deltas,
      });
    });
  });
  environment.connectors.forEach((connector, index) => {
    const operation = connector.operation;
    if (operation === undefined) return;
    operation.states.forEach((state, stateIndex) => {
      if (state.id === operation.state) return;
      const deltas = new Map(staged);
      applyCarriageState(operation.carriages, state, deltas);
      alternative({
        path: `${root}.connectors[${index}].operation.states[${stateIndex}]`,
        state: state.id,
        moved: operation.carriages.map((carriage) => carriage.element),
        deltas,
      });
    });
  });
};
