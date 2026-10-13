import {
  IAutoMovieBuiltConnector,
  IAutoMovieConnectorLanding,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Validate the further spaces a run serves along its own route.
 *
 * A landing is a stop, and a stop stated twice, stated at an end the run
 * already names, or stated out of order is a stop later work cannot place.
 * Each landing's space must resolve, differ from the run's `from` and `to`,
 * and appear once; its arc-length fraction `at` must lie strictly inside
 * `(0, 1)`, because both ends are already served by the run's own endpoints,
 * and strictly increase from the landing before it. Findings are pushed under
 * `<path>.landings`; a run with no landings is skipped.
 *
 * @param connector Run whose landings are checked.
 * @param path Violation path of the connector.
 * @param spaces Declared space ids.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Landings are an ordered set of interior stations along a parameterized route, so they must be unique, interior to the open unit interval, and strictly increasing, which is what lets every stop query read them in route order without sorting.
 * @evidence contracts/common.md#clear-and-simple-design The landing rule of connector validation in one function, separated from `validateBuiltEnvironment`; `builtConnectorStops` relies on the order it enforces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No landing is re-sorted or deduplicated, and the open interval follows from the endpoints already being stops rather than from any one connector.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why each rule exists, the interval and its openness, the order rule, the path, and the skip for a run without landings.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the landings with a seen set, linear in their count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one run per call; each connector is checked once per validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The seen set is released on return; at most a few violations per landing are appended to the caller's collector.
 */
export const validateBuiltConnectorLandings = (
  connector: IAutoMovieBuiltConnector,
  path: string,
  spaces: ReadonlySet<string>,
  collector: ViolationCollector,
): void => {
  const landings: IAutoMovieConnectorLanding[] | undefined = connector.landings;
  if (landings === undefined) return;
  const seen: Set<string> = new Set();
  landings.forEach((landing: IAutoMovieConnectorLanding, index: number): void => {
    const landingPath: string = `${path}.landings[${index}]`;
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
