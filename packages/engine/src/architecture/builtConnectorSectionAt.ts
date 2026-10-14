import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
} from "@automovie/interface";

import { IAutoMovieConnectorSectionAt } from "./IAutoMovieConnectorSectionAt";
import { builtConnectorSection } from "./builtConnectorSection";
import { requireBuiltConnector } from "./requireBuiltConnector";

/**
 * The usable section of a connector at one arc-length fraction of its route.
 *
 * A constant section answers the same pair everywhere; a varying one is read as the piecewise-linear function its stations describe, so a corridor that narrows between two stations narrows evenly rather than in a step nothing declared.
 *
 * Widths and clear heights are in metres. Throws when the connector does not exist, when `at` is non-finite or outside `[0, 1]`, and when the connector states no section.
 *
 * @evidence contracts/common.md#principled-implementation Resolves the connector, checks the closed unit fraction interval and delegates to `builtConnectorSection`'s binary64 piecewise-linear interpolation. Sorted bracketing stations and finite computed differences are caller premises; the section helper does not make this an exact-arithmetic interpolation certificate.
 * @evidence contracts/common.md#clear-and-simple-design The id-addressed form owns exactly the lookup and the two refusals, and the record-addressed form owns the interpolation, so the rule is written once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no connector; a fraction outside `[0, 1]` and a connector without a section are refused by name instead of clamped or given a default section.
 * @evidence contracts/common.md#meaningful-documentation States the constant and varying readings, the even narrowing between stations, the metre units, and all three throws.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the connector count for the lookup plus the station count for the bracket scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one fraction per call over the caller's mutable record and caches nothing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned section.
 */
export const builtConnectorSectionAt: (environment: IAutoMovieBuiltEnvironment, connectorId: string, at: number) => IAutoMovieConnectorSectionAt = (
  environment: IAutoMovieBuiltEnvironment,
  connectorId: string,
  at: number,
): IAutoMovieConnectorSectionAt => {
  const connector: IAutoMovieBuiltConnector = requireBuiltConnector(
    environment,
    connectorId,
  );
  if (!Number.isFinite(at) || at < 0 || at > 1)
    throw new Error(
      `connector "${connectorId}" of built environment "${environment.id}" can only be sectioned within [0, 1], but was asked at ${at}`,
    );
  const section: IAutoMovieConnectorSectionAt | null = builtConnectorSection(
    connector,
    at,
  );
  if (section === null)
    throw new Error(
      `connector "${connectorId}" of built environment "${environment.id}" states no usable section`,
    );
  return section;
};
