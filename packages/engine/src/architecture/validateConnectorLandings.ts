/**
 * Validate the further spaces a run serves along its own route.
 *
 * A landing is a stop, and a stop stated twice, stated at an end the run
 * already names, or stated out of order is a stop later work cannot place. The
 * fraction is strictly inside `(0, 1)` because both ends are already served by
 * the run's own `from` and `to`.
  * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @author Samchon
 */
export const validateConnectorLandings = (
  connector: IAutoMovieBuiltConnector,
  path: string,
  spaces: ReadonlySet<string>,
  collector: ViolationCollector,
): void => {
  const landings = connector.landings;
  if (landings === undefined) return;
  const seen = new Set<string>();
  landings.forEach((landing, index) => {
    const landingPath = `${path}.landings[${index}]`;
    if (!spaces.has(landing.space))
      collector.push(
        "type",
        `${landingPath}.space`,
        `connector landing space "${landing.space}" does not resolve`,
        landing.space,
      );
    if (landing.space === connector.from || landing.space === connector.to)
      collector.push(
        "type",
        `${landingPath}.space`,
        `connector landing "${landing.space}" restates an endpoint of connector "${connector.id}"`,
        landing.space,
      );
    if (seen.has(landing.space))
      collector.push(
        "type",
        `${landingPath}.space`,
        `connector landing "${landing.space}" is stated twice`,
        landing.space,
      );
    seen.add(landing.space);
    if (!Number.isFinite(landing.at) || landing.at <= 0 || landing.at >= 1)
      collector.push(
        "range",
        `${landingPath}.at`,
        `a connector landing stops between the run's own ends, so its arc-length fraction must be within (0, 1), but was ${landing.at}`,
        landing.at,
      );
    else if (index > 0 && !(landing.at > landings[index - 1]!.at))
      collector.push(
        "range",
        `${landingPath}.at`,
        `connector landings must strictly increase along the route, but ${landing.at} followed ${landings[index - 1]!.at}`,
        landing.at,
      );
  });
};
