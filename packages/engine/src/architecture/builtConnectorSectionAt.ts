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
 *
 * @evidence contracts/common.md#principled-implementation Resolves the connector by id, refuses a non-finite or out-of-range fraction, delegates interpolation to `builtConnectorSection`, and turns its null into a named refusal.
 * @evidence contracts/common.md#clear-and-simple-design A guard layer over the record-addressed function, so the range check and missing-section refusal live here while the interpolation rule lives once in the other.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An out-of-range fraction is refused rather than clamped, and a connector with no section is refused rather than given a default width or clearance.
 * @evidence contracts/common.md#meaningful-documentation States the arc-length frame of the fraction, the piecewise-linear reading of a varying section, and the three refusals.
 * @evidence contracts/performance.md#cost-and-resources A linear id search over connectors plus the station walk, both linear in list length; a caller sampling many fractions on one connector repeats the id search each time, which is why record holders call `builtConnectorSection` directly, and nothing is cached.
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
