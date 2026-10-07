import {
  builtConnectorGeometry,
  builtConnectorSectionAt,
  lowerBuiltEnvironment,
  validateBuiltEnvironment,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { BUILT_CONNECTOR_TEST_HELIX_RADIUS as HELIX_RADIUS } from "../internal/BUILT_CONNECTOR_TEST_HELIX_RADIUS";
import { BUILT_CONNECTOR_TEST_HELIX_RISE as HELIX_RISE } from "../internal/BUILT_CONNECTOR_TEST_HELIX_RISE";
import { BUILT_CONNECTOR_TEST_HELIX_TURNS as HELIX_TURNS } from "../internal/BUILT_CONNECTOR_TEST_HELIX_TURNS";
import { BUILT_CONNECTOR_TEST_NO_ROTATION as NO_ROTATION } from "../internal/BUILT_CONNECTOR_TEST_NO_ROTATION";
import { assertBuiltConnectorTestRefusals } from "../internal/assertBuiltConnectorTestRefusals";
import { builtConnectorTestLevels as levels } from "../internal/builtConnectorTestLevels";
import { builtConnectorTestRefusalPaths as refusalPaths } from "../internal/builtConnectorTestRefusalPaths";
import { builtConnectorTestYaw as yaw } from "../internal/builtConnectorTestYaw";
import {
  namedFacts,
  nclose,
  qclose,
  qunit,
  throwsError,
  vclose,
} from "../internal/predicates";

/**
 * A connector is a measurable shape, not a labelled edge between two rooms.
 * This pins that a spiral stair is expressible at all, that a varying section
 * is read where the route actually is, that a stated slope and a stated step
 * must agree with the route they are declared on, and that the constant and the
 * varying spelling of a section are mutually exclusive rather than merged.
 * Whether a person can climb any of it is deliberately never asked.
 *
 * Scenarios:
 *
 * 1. A graph holding a spiral stair, a varying-section corridor, a ramp, a
 *    straight flight, an escalator, and a moving walk validates as a whole.
 * 2. A spiral stair's treads are told apart by facing alone: consecutive stations
 *    sit a quarter turn apart while their plan positions repeat every fourth
 *    station, and every facing survives as a unit quaternion.
 * 3. Route metrics come out as hand arithmetic: a 4 m plan run climbing 3 m is 5 m
 *    long at `atan2(3, 4)`, and the station parameters are arc-length fractions
 *    rather than index fractions.
 * 4. A constant section answers the same pair everywhere; a varying one
 *    interpolates between its stations and reproduces each station exactly.
 * 5. A connector with no orientation answers `null` facings rather than inventing
 *    a heading from the route.
 * 6. Every query refuses an unknown connector, an out-of-range parameter, a route
 *    with nothing to measure, and a connector with no section at all.
 * 7. Twenty-three malformed connectors are each refused at their own path,
 *    including both spellings at once and neither spelling.
 * 8. The pre-geometry scalar record lowers exactly as before.
 */
export const test_architecture_built_connector = (): void => {
  const source = levels();
  TestValidator.equals(
    "a graph of six connector families validates",
    validateBuiltEnvironment({ environment: source }).success,
    true,
  );

  const spiral = builtConnectorGeometry(source, "spiral");
  TestValidator.predicate(
    "a spiral stair's treads are told apart by facing alone",
    (() => {
      const first = spiral.stations[0]!;
      const quarter = spiral.stations[1]!;
      const full = spiral.stations[4]!;
      return (
        // The plan position repeats after four quarter turns, so position alone
        // cannot distinguish the bottom tread from the top one.
        nclose(first.position.x, full.position.x) &&
        nclose(first.position.z, full.position.z) &&
        nclose(full.position.y, HELIX_TURNS * HELIX_RISE) &&
        // The facing does distinguish them, and it is a real quaternion.
        spiral.stations.every((station) => qunit(station.rotation!)) &&
        spiral.stations
          .slice(1)
          .every(
            (station, index) =>
              !qclose(station.rotation!, spiral.stations[index]!.rotation!),
          ) &&
        qclose(first.rotation!, NO_ROTATION) &&
        qclose(quarter.rotation!, yaw(Math.PI / 2)) &&
        // A whole turn comes back to where it started, one storey higher.
        qclose(full.rotation!, first.rotation!)
      );
    })(),
  );

  const flight = builtConnectorGeometry(source, "flight");
  TestValidator.equals(
    "route metrics are the route's own arithmetic",
    namedFacts([
      ["rise", () => nclose(flight.rise, 3)],
      ["run", () => nclose(flight.run, 4)],
      ["length", () => nclose(flight.length, 5)],
      ["slope", () => nclose(flight.slope, Math.atan2(3, 4))],
      ["firstStation", () => nclose(flight.stations[0]!.at, 0)],
      ["lastStation", () => nclose(flight.stations[1]!.at, 1)],
    ]),
    {
      rise: true,
      run: true,
      length: true,
      slope: true,
      firstStation: true,
      lastStation: true,
    },
  );
  TestValidator.predicate(
    "station parameters are arc length, not index",
    (() => {
      const corridor = builtConnectorGeometry(source, "corridor");
      return (
        nclose(corridor.stations[1]!.at, 0.5) &&
        nclose(corridor.length, 16) &&
        nclose(corridor.rise, 0) &&
        nclose(corridor.slope, 0)
      );
    })(),
  );
  TestValidator.equals(
    "a connector that declared no facing answers with none",
    builtConnectorGeometry(source, "corridor").stations.map(
      (station) => station.rotation,
    ),
    [null, null, null],
  );
  TestValidator.predicate(
    "the helix route is a real helix rather than a stack of points",
    vclose(spiral.stations[1]!.position, {
      x: HELIX_RADIUS * Math.cos(Math.PI / 2),
      y: HELIX_RISE,
      z: HELIX_RADIUS,
    }),
  );

  TestValidator.predicate(
    "a constant section answers the same pair everywhere",
    (() => {
      const start = builtConnectorSectionAt(source, "flight", 0);
      const middle = builtConnectorSectionAt(source, "flight", 0.5);
      const end = builtConnectorSectionAt(source, "flight", 1);
      return (
        nclose(start.width, 1.4) &&
        nclose(middle.width, 1.4) &&
        nclose(end.width, 1.4) &&
        nclose(middle.clearHeight, 2.2)
      );
    })(),
  );
  TestValidator.predicate(
    "a varying section interpolates between its own stations",
    (() => {
      const start = builtConnectorSectionAt(source, "corridor", 0);
      const quarter = builtConnectorSectionAt(source, "corridor", 0.25);
      const waist = builtConnectorSectionAt(source, "corridor", 0.5);
      const end = builtConnectorSectionAt(source, "corridor", 1);
      return (
        nclose(start.width, 3) &&
        nclose(quarter.width, 2.25) &&
        nclose(quarter.clearHeight, 2.4) &&
        nclose(waist.width, 1.5) &&
        nclose(end.width, 3) &&
        nclose(end.clearHeight, 2.6)
      );
    })(),
  );

  TestValidator.predicate(
    "an unknown connector refuses geometry",
    throwsError(() => builtConnectorGeometry(source, "missing")),
  );
  TestValidator.predicate(
    "an unknown connector refuses a section",
    throwsError(() => builtConnectorSectionAt(source, "missing", 0)),
  );
  TestValidator.predicate(
    "a parameter outside the route is refused",
    throwsError(() => builtConnectorSectionAt(source, "flight", 1.5)),
  );
  TestValidator.predicate(
    "a non-finite parameter is refused",
    throwsError(() => builtConnectorSectionAt(source, "flight", Number.NaN)),
  );
  TestValidator.predicate(
    "an empty route has nothing to measure",
    throwsError(() => {
      const value = levels();
      value.connectors[0]!.route = [];
      builtConnectorGeometry(value, "spiral");
    }),
  );
  TestValidator.predicate(
    "a route that never moves has nothing to measure",
    throwsError(() => {
      const value = levels();
      value.connectors[0]!.route = [
        { x: 1, y: 1, z: 1 },
        { x: 1, y: 1, z: 1 },
      ];
      builtConnectorGeometry(value, "spiral");
    }),
  );
  TestValidator.predicate(
    "a connector with no section at all is refused",
    throwsError(() => {
      const value = levels();
      delete value.connectors[3]!.width;
      delete value.connectors[3]!.clearHeight;
      builtConnectorSectionAt(value, "flight", 0);
    }),
  );
  assertBuiltConnectorTestRefusals();
  TestValidator.equals(
    "the untouched level graph produces no violation path at all",
    refusalPaths(() => {}),
    [],
  );

  TestValidator.equals(
    "the scalar-section record lowers to the same staged set as before",
    lowerBuiltEnvironment(source).set?.map((piece) => piece.node),
    ["levels/stair-flight"],
  );
};
