/** Validate a connector's stations, section spelling, slope, and steps.  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const validateConnectorShape = (
  connector: IAutoMovieBuiltConnector,
  path: string,
  collector: ViolationCollector,
): void => {
  const measurable =
    connector.route.length >= 2 &&
    connector.route.every((point) =>
      [point.x, point.y, point.z].every(Number.isFinite),
    );
  if (measurable)
    for (let index = 0; index + 1 < connector.route.length; ++index)
      if (
        Vector3.length(
          Vector3.subtract(
            connector.route[index + 1]!,
            connector.route[index]!,
          ),
        ) <= ROUTE_EPSILON
      )
        collector.push(
          "range",
          `${path}.route[${index + 1}]`,
          "consecutive connector route stations must be distinct",
          connector.route[index + 1],
        );
  if (connector.orientations !== undefined) {
    if (connector.orientations.length !== connector.route.length)
      collector.push(
        "type",
        `${path}.orientations`,
        `a connector states ${connector.orientations.length} station facings for ${connector.route.length} route points`,
        connector.orientations.length,
      );
    connector.orientations.forEach((rotation, index) =>
      unitQuaternion(
        rotation,
        `${path}.orientations[${index}]`,
        "connector station facing",
        collector,
      ),
    );
  }

  const scalar =
    connector.width !== undefined || connector.clearHeight !== undefined;
  if (connector.sections !== undefined && scalar)
    collector.push(
      "type",
      `${path}.sections`,
      "a connector states a constant width and clear height or a varying section, never both",
      connector.sections.length,
    );
  else if (connector.sections === undefined && !scalar)
    collector.push(
      "range",
      `${path}.width`,
      "a connector must state a constant width and clear height, or a varying section",
      null,
    );
  else if (scalar) {
    positive(connector.width, `${path}.width`, "connector width", collector);
    positive(
      connector.clearHeight,
      `${path}.clearHeight`,
      "connector clear height",
      collector,
    );
  } else
    validateConnectorSections(
      connector.sections!,
      `${path}.sections`,
      collector,
    );

  const metrics = measurable ? routeMetrics(connector.route) : null;
  if (connector.slope !== undefined) {
    if (
      !Number.isFinite(connector.slope) ||
      connector.slope < 0 ||
      connector.slope > Math.PI / 2
    )
      collector.push(
        "range",
        `${path}.slope`,
        `connector slope must be a finite number within [0, PI / 2], but was ${connector.slope}`,
        connector.slope,
      );
    else if (
      metrics !== null &&
      Math.abs(connector.slope - metrics.slope) > SLOPE_TOLERANCE
    )
      collector.push(
        "range",
        `${path}.slope`,
        `connector states a slope of ${connector.slope} radians, but its own route rises at ${metrics.slope}`,
        connector.slope,
      );
  }
  if (connector.steps !== undefined) {
    const steps = connector.steps;
    const before = collector.items.length;
    if (!Number.isSafeInteger(steps.count) || steps.count < 1)
      collector.push(
        "range",
        `${path}.steps.count`,
        `a stepped connector needs a safe integer step count >= 1, but had ${steps.count}`,
        steps.count,
      );
    positive(steps.rise, `${path}.steps.rise`, "step rise", collector);
    positive(steps.run, `${path}.steps.run`, "step run", collector);
    if (collector.items.length === before && metrics !== null) {
      if (
        Math.abs(steps.count * steps.rise - Math.abs(metrics.rise)) >
        STEP_TOLERANCE
      )
        collector.push(
          "range",
          `${path}.steps.rise`,
          `${steps.count} steps of ${steps.rise} m climb ${steps.count * steps.rise} m, but the route climbs ${Math.abs(metrics.rise)} m`,
          steps.rise,
        );
      if (Math.abs(steps.count * steps.run - metrics.run) > STEP_TOLERANCE)
        collector.push(
          "range",
          `${path}.steps.run`,
          `${steps.count} steps of ${steps.run} m run ${steps.count * steps.run} m, but the route runs ${metrics.run} m`,
          steps.run,
        );
    }
  }
};
