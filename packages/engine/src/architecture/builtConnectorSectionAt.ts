import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

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
 * Throws when the connector does not exist, when `at` is non-finite or outside
 * `[0, 1]`, and when the connector states no section.
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

const requireConnector = (
  environment: IAutoMovieBuiltEnvironment,
  connectorId: string,
): IAutoMovieBuiltConnector => {
  const connector = environment.connectors.find(
    (candidate) => candidate.id === connectorId,
  );
  if (connector === undefined)
    throw new Error(
      `built environment "${environment.id}" has no connector "${connectorId}"`,
    );
  return connector;
};
