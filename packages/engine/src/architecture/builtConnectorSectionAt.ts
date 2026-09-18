import { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { IAutoMovieConnectorSectionAt } from "./IAutoMovieConnectorSectionAt";
import { builtConnectorSection } from "./builtConnectorSection";

/**
 * The usable section of a connector at one arc-length fraction of its route.
 *
 * A constant section answers the same pair everywhere; a varying one is read as
 * the piecewise-linear function its stations describe, so a corridor that
 * narrows between two stations narrows evenly rather than in a step nothing
 * declared.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtConnectorSectionAt` produces the usable section of a connector at one arc-length fraction of its route. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtConnectorSectionAt` samples the usable connector section at one arc-length fraction of its route.
 * @evidence requirements/interior/connections-and-circulation.md#interior-circulation-transitions `builtConnectorSectionAt` samples the route's rise, run, slope, station and landing transition together with its usable width and headroom at the requested arc-length fraction.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology `builtConnectorSectionAt` exposes the measurable section and landing state along the connector transition.
 */
export const builtConnectorSectionAt = (
  environment: IAutoMovieBuiltEnvironment,
  connectorId: string,
  at: number,
): IAutoMovieConnectorSectionAt => {
  const connector = requireConnector(environment, connectorId);
  if (!Number.isFinite(at) || at < 0 || at > 1)
    throw new Error(
      `connector "${connectorId}" of built environment "${environment.id}" can only be sectioned within [0, 1], but was asked at ${at}`,
    );
  const section = builtConnectorSection(connector, at);
  if (section === null)
    throw new Error(
      `connector "${connectorId}" of built environment "${environment.id}" states no usable section`,
    );
  return section;
};
