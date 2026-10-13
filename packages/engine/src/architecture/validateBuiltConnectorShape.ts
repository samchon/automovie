import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltEnvironment,
  IAutoMovieConnectorSection,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieConnectorGeometry } from "./IAutoMovieConnectorGeometry";
import { builtConnectorGeometry } from "./builtConnectorGeometry";

/** Shortest distance, in metres, two consecutive route stations may sit apart. */
const ROUTE_EPSILON: number = 1e-9;

/** Largest disagreement, in metres, between a stated step run and its route. */
const STEP_TOLERANCE: number = 1e-3;

/** Largest disagreement, in radians, between a stated slope and its route. */
const SLOPE_TOLERANCE: number = 1e-6;

/**
 * Validate a connector's stations, section spelling, slope, and steps.
 *
 * Consecutive route stations must be more than 1e-9 m apart, and stated
 * station facings must match the route one for one as unit quaternions. A
 * connector states either a constant positive width and clear height or a
 * varying section, never both and never neither; a varying section needs at
 * least 2 stations from `at` 0 to 1, strictly increasing, each with a positive
 * width and clear height. A stated slope must be finite within [0, PI / 2]
 * radians, and stated steps need a whole count of at least 1 with positive
 * rise and run in metres. When the route is measurable, the slope must agree
 * with the route's `atan2(|rise|, run)` within 1e-6 rad and the steps must
 * climb and run what the route does within 1e-3 m, both measured by
 * {@link builtConnectorGeometry}. The route is measurable when it has at least
 * two finite stations, at least one pair of them distinct, and `measured` is
 * true, which the caller sets only for the first connector bearing an id, the
 * one `builtConnectorGeometry` resolves. Findings are pushed under `path`.
 *
 * @param environment Building the connector belongs to.
 * @param connector Run whose shape is checked.
 * @param path Violation path of the connector.
 * @param measured Whether `builtConnectorGeometry` resolves this record by id.
 * @param collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Stated slope and steps are claims about the route, so they are settled against the route's own measured climb and horizontal run from the shared connector geometry, with tolerances far below authoring precision; a route whose stations all coincide has no length to measure, so it is not measured.
 * @evidence contracts/common.md#clear-and-simple-design The shape section of connector validation, separated from `validateBuiltEnvironment`; route measurement is delegated to `builtConnectorGeometry`, the query every consumer reads, instead of a private copy of its formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No connector kind is special-cased; a record whose id repeats an earlier one is not measured, because the duplicate is reported on its own path and the id-addressed measurement would describe the other record.
 * @evidence contracts/common.md#meaningful-documentation The documentation states every station, facing, section, slope and step rule, the units and tolerances, when the route is measured and why, and the path.
 * @evidence contracts/performance.md#efficient-algorithms Linear in route stations, facings and sections, plus one route measurement linear in the stations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one connector per call; each connector is measured at most once per validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The route measurement is released on return; a bounded number of violations per station, facing and section is appended to the caller's collector.
 */
export const validateBuiltConnectorShape = (
  environment: IAutoMovieBuiltEnvironment,
  connector: IAutoMovieBuiltConnector,
  path: string,
  measured: boolean,
  collector: ViolationCollector,
): void => {
  const finite: boolean =
    connector.route.length >= 2 &&
    connector.route.every((point: IAutoMovieVector3): boolean =>
      [point.x, point.y, point.z].every(Number.isFinite),
    );
  // A route with any length can be measured even with a repeated station,
  // which is reported here; only a route of one repeated point has none.
  let measurable: boolean = false;
  if (finite)
    for (let index: number = 0; index + 1 < connector.route.length; ++index)
      if (
        Vector3.length(
          Vector3.subtract(connector.route[index + 1]!, connector.route[index]!),
        ) <= ROUTE_EPSILON
      )
        collector.push(
          "range",
          `${path}.route[${index + 1}]`,
          "consecutive connector route stations must be distinct",
          connector.route[index + 1],
        );
      else measurable = measured;
  if (connector.orientations !== undefined) {
    if (connector.orientations.length !== connector.route.length)
      collector.push(
        "type",
        `${path}.orientations`,
        `a connector states ${connector.orientations.length} station facings for ${connector.route.length} route points`,
        connector.orientations.length,
      );
    connector.orientations.forEach(
      (rotation: IAutoMovieQuaternion, index: number): void =>
        collector.unitQuaternion(
          `${path}.orientations[${index}]`,
          rotation,
          "connector station facing",
        ),
    );
  }

  const scalar: boolean =
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
    collector.positive(`${path}.width`, connector.width, "connector width");
    collector.positive(
      `${path}.clearHeight`,
      connector.clearHeight,
      "connector clear height",
    );
  } else validateSections(connector.sections!, `${path}.sections`, collector);

  const metrics: IAutoMovieConnectorGeometry | null = measurable
    ? builtConnectorGeometry(environment, connector.id)
    : null;
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
  if (connector.steps === undefined) return;
  const steps: NonNullable<IAutoMovieBuiltConnector["steps"]> = connector.steps;
  const before: number = collector.items.length;
  if (!Number.isSafeInteger(steps.count) || steps.count < 1)
    collector.push(
      "range",
      `${path}.steps.count`,
      `a stepped connector needs a safe integer step count >= 1, but had ${steps.count}`,
      steps.count,
    );
  collector.positive(`${path}.steps.rise`, steps.rise, "step rise");
  collector.positive(`${path}.steps.run`, steps.run, "step run");
  if (collector.items.length !== before || metrics === null) return;
  if (Math.abs(steps.count * steps.rise - Math.abs(metrics.rise)) > STEP_TOLERANCE)
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
};

/** A varying section: 2+ stations from 0 to 1, increasing, each positive. */
const validateSections = (
  sections: readonly IAutoMovieConnectorSection[],
  path: string,
  collector: ViolationCollector,
): void => {
  if (sections.length < 2) {
    collector.push(
      "range",
      path,
      `a varying connector section needs at least 2 stations, but had ${sections.length}`,
      sections.length,
    );
    return;
  }
  if (sections[0]!.at !== 0)
    collector.push(
      "range",
      `${path}[0].at`,
      `a varying connector section must begin at 0, but began at ${sections[0]!.at}`,
      sections[0]!.at,
    );
  const last: number = sections.length - 1;
  if (sections[last]!.at !== 1)
    collector.push(
      "range",
      `${path}[${last}].at`,
      `a varying connector section must end at 1, but ended at ${sections[last]!.at}`,
      sections[last]!.at,
    );
  sections.forEach(
    (section: IAutoMovieConnectorSection, index: number): void => {
      if (index > 0 && !(section.at > sections[index - 1]!.at))
        collector.push(
          "range",
          `${path}[${index}].at`,
          `connector section stations must strictly increase, but ${section.at} followed ${sections[index - 1]!.at}`,
          section.at,
        );
      collector.positive(
        `${path}[${index}].width`,
        section.width,
        "section width",
      );
      collector.positive(
        `${path}[${index}].clearHeight`,
        section.clearHeight,
        "section clear height",
      );
    },
  );
};
