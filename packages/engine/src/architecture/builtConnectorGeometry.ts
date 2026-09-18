import { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { IAutoMovieConnectorGeometry } from "./IAutoMovieConnectorGeometry";

/**
 * Measure one connector's traversal shape: climb, run, length, slope, stations.
 *
 * A station's facing is answered as authored or as `null`, never as a heading
 * this function invented. A connector that declared no orientation has no
 * orientation, and saying so is what keeps a later analysis from reading a
 * derived guess as a design decision.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtConnectorGeometry` measures one connector's traversal shape: climb, run, length, slope, stations. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtConnectorGeometry` measures a connector route's climb, run, length, slope, and stations inside its building boundary.
 * @evidence requirements/interior/connections-and-circulation.md#interior-horizontal-vertical-routes `builtConnectorGeometry` resolves the connector endpoint path into one three-dimensional route with climb, horizontal run, length, slope, and ordered stations.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology `builtConnectorGeometry` computes the geometric route that connects the declared spaces through horizontal and vertical travel.
 * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-circulation `builtConnectorGeometry` derives the exterior connector's endpoint route, landings, rise, horizontal run, length, slope, width, and headroom as its measurable circulation contribution.
 * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-exterior-circulation-input-output `builtConnectorGeometry` produces the validated route geometry and section facts for an exterior circulation connector without claiming guard, port, or code compliance.
 * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection `builtConnectorGeometry` preserves a connector whose resolved endpoint spaces belong to different building roots and refuses unresolved, self-linked, or malformed route state.
 * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures `builtConnectorGeometry` materializes the declared cross-building route after endpoint, route, section, and operation validation without claiming transform-revision authority.
 */
export const builtConnectorGeometry = (
  environment: IAutoMovieBuiltEnvironment,
  connectorId: string,
): IAutoMovieConnectorGeometry => {
  const connector = requireConnector(environment, connectorId);
  const cumulative = cumulativeRouteLengths(connector.route);
  const total = cumulative[cumulative.length - 1]!;
  if (connector.route.length < 2 || total === 0)
    throw new Error(
      `connector "${connectorId}" of built environment "${environment.id}" has no measurable route`,
    );
  return {
    ...routeMetrics(connector.route),
    stations: connector.route.map((position, index) => ({
      position,
      rotation: connector.orientations?.[index] ?? null,
      at: cumulative[index]! / total,
    })),
    landings: (connector.landings ?? []).map((landing) => ({
      space: landing.space,
      at: landing.at,
      position: routePointAt(connector.route, cumulative, total, landing.at),
    })),
  };
};
