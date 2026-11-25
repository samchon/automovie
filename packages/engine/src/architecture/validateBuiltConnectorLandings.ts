import {
  IAutoMovieBuiltConnector,
  IAutoMovieConnectorLanding,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Validate the further spaces a run serves along its own route.
 *
 * A landing is a stop, and a stop stated twice, stated at an end the run
 * already names, or stated out of order is a stop later work cannot place. Each
 * landing's space must resolve, differ from the run's `from` and `to`, and
 * appear once; its arc-length fraction `at` must lie strictly inside `(0, 1)`,
 * because both ends are already served by the run's own endpoints, and strictly
 * increase from the landing before it. Findings are pushed under
 * `<path>.landings`; a run with no landings is skipped.
 *
 * @param connector Run whose landings are checked.
 * @param path Violation path of the connector.
 * @param spaces Declared space ids.
 * @param collector Sink that receives the violations.
 */
export const validateBuiltConnectorLandings: (
  connector: IAutoMovieBuiltConnector,
  path: string,
  spaces: ReadonlySet<string>,
  collector: IAutoMovieViolationCollector,
) => void = (
  connector: IAutoMovieBuiltConnector,
  path: string,
  spaces: ReadonlySet<string>,
  collector: IAutoMovieViolationCollector,
): void => {
  const landings: IAutoMovieConnectorLanding[] | undefined = connector.landings;
  if (landings === undefined) return;
  const seen: Set<string> = new Set();
  landings.forEach(
    (landing: IAutoMovieConnectorLanding, index: number): void => {
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
      if (landing.at <= 0 || landing.at >= 1)
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
    },
  );
};
