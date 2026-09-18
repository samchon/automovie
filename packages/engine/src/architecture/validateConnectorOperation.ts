/** Validate the travelling carriages, named states, and stops of one run.  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const validateConnectorOperation = (props: {
  connector: IAutoMovieBuiltConnector;
  path: string;
  elements: ReadonlySet<string>;
  environment: IAutoMovieBuiltEnvironment;
  /** Which member already drives an element, across the whole work. */
  driven: Map<string, string>;
  collector: ViolationCollector;
}): void => {
  const { connector, path, collector } = props;
  const operation = connector.operation;
  if (operation === undefined) return;
  const base = `${path}.operation`;
  if (connector.elements.length === 0)
    collector.push(
      "type",
      `${path}.elements`,
      `connector "${connector.id}" drives a carriage, so it must name the elements it is built from`,
      connector.elements,
    );
  if (operation.carriages.length === 0)
    collector.push(
      "range",
      `${base}.carriages`,
      `connector "${connector.id}" declares an operation with no carriage`,
      operation.carriages.length,
    );
  const carriageIds = collectIds(
    operation.carriages,
    `${base}.carriages`,
    "carriage",
    collector,
  );
  const owned = descendantElements(props.environment, connector.elements);
  operation.carriages.forEach((carriage, index) => {
    const carriagePath = `${base}.carriages[${index}]`;
    if (!props.elements.has(carriage.element))
      collector.push(
        "type",
        `${carriagePath}.element`,
        `carriage element "${carriage.element}" does not resolve`,
        carriage.element,
      );
    else if (connector.elements.length !== 0 && !owned.has(carriage.element))
      collector.push(
        "type",
        `${carriagePath}.element`,
        `carriage element "${carriage.element}" must be one of the elements connector "${connector.id}" is built from, or descend from one`,
        carriage.element,
      );
    // One element carries one displacement, and doors and runs draw from the
    // same table, so a leaf that is also a lift car would lose whichever travel
    // was written first rather than gaining a second degree of freedom.
    const already = props.driven.get(carriage.element);
    if (already !== undefined)
      collector.push(
        "type",
        `${carriagePath}.element`,
        `carriage element "${carriage.element}" is already driven by ${already}`,
        carriage.element,
      );
    else
      props.driven.set(
        carriage.element,
        `carriage "${carriage.id}" of connector "${connector.id}"`,
      );
    validateTravelMotion(
      carriage.motion,
      `${carriagePath}.motion`,
      "carriage",
      collector,
    );
  });
  const stops = new Set(connectorStops(connector));
  if (operation.states.length === 0)
    collector.push(
      "range",
      `${base}.states`,
      `connector "${connector.id}" declares an operation with no named state`,
      operation.states.length,
    );
  collectIds(operation.states, `${base}.states`, "operating state", collector);
  operation.states.forEach((state, index) => {
    const statePath = `${base}.states[${index}]`;
    if (!CONNECTOR_DRIVES.includes(state.drive))
      collector.push(
        "type",
        `${statePath}.drive`,
        `unknown connector drive "${String(state.drive)}"`,
        state.drive,
      );
    else if (state.drive === "reverse" && connector.bidirectional === false)
      collector.push(
        "type",
        `${statePath}.drive`,
        `operating state "${state.id}" drives connector "${connector.id}" in reverse, but the run is one-way`,
        state.drive,
      );
    const seen = new Set<string>();
    state.carriages.forEach((entry, valueIndex) => {
      const valuePath = `${statePath}.carriages[${valueIndex}]`;
      if (!carriageIds.has(entry.carriage))
        collector.push(
          "type",
          `${valuePath}.carriage`,
          `operating state "${state.id}" drives unknown carriage "${entry.carriage}"`,
          entry.carriage,
        );
      if (seen.has(entry.carriage))
        collector.push(
          "type",
          `${valuePath}.carriage`,
          `operating state "${state.id}" drives carriage "${entry.carriage}" twice`,
          entry.carriage,
        );
      seen.add(entry.carriage);
      if (entry.serves !== null && !stops.has(entry.serves))
        collector.push(
          "type",
          `${valuePath}.serves`,
          `operating state "${state.id}" has carriage "${entry.carriage}" serve "${entry.serves}", which is neither an endpoint nor a landing of connector "${connector.id}"`,
          entry.serves,
        );
      const carriage = operation.carriages.find(
        (candidate) => candidate.id === entry.carriage,
      );
      if (carriage === undefined) return;
      if (
        !Number.isFinite(entry.value) ||
        entry.value < carriage.motion.min ||
        entry.value > carriage.motion.max
      )
        collector.push(
          "range",
          `${valuePath}.value`,
          `operating state "${state.id}" drives carriage "${carriage.id}" to ${entry.value}, outside its travel [${carriage.motion.min}, ${carriage.motion.max}]`,
          entry.value,
        );
    });
    for (const carriage of operation.carriages)
      if (!seen.has(carriage.id))
        collector.push(
          "type",
          `${statePath}.carriages`,
          `operating state "${state.id}" gives carriage "${carriage.id}" no value`,
          carriage.id,
        );
  });
  if (!operation.states.some((state) => state.id === operation.state))
    collector.push(
      "type",
      `${base}.state`,
      `current operating state "${operation.state}" does not resolve`,
      operation.state,
    );
};
