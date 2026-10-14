import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieQuaternion,
  IAutoMovieStageSetPiece,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieConnectorGeometry } from "@automovie/engine";
import type { IAutoMovieConnectorSectionAt } from "@automovie/engine";
import type { IAutoMovieConnectorStation } from "@automovie/engine";
import { builtConnectorGeometry } from "@automovie/engine";
import { builtConnectorSectionAt } from "@automovie/engine";
import { lowerBuiltEnvironment } from "@automovie/engine";
import { validateBuiltEnvironment } from "@automovie/engine";
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
 * Validate connector geometry, measure routes and interpolate declared sections while preserving scalar-record lowering.
 *
 * Scenarios:
 * 1. A graph holding a spiral stair, a varying-section corridor, a ramp, a straight flight, an escalator, and a moving walk validates as a whole.
 * 2. The spiral's authored facings change by quarter turns and return after four stations, while plan coordinates repeat and Y rises; every facing is a unit quaternion within the existing tolerance.
 * 3. Route metrics match hand arithmetic within the existing tolerance: a 4 m plan run climbing 3 m is 5 m long at `atan2(3, 4)`, and the equally spaced corridor's middle station is at 0.5.
 * 4. The queried constant section values agree; varying-section queries interpolate and match the selected stations within the existing tolerance.
 * 5. A connector with no orientation answers `null` facings rather than inventing a heading from the route.
 * 6. Both queries refuse an unknown connector; section queries refuse invalid fractions and absent sections, while geometry refuses empty or stationary routes.
 * 7. Twenty-three malformed connectors are each refused at their own path, including both spellings at once and neither spelling.
 * 8. Lowering the scalar-section record retains the existing staged node-id list.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateBuiltEnvironment, builtConnectorGeometry, builtConnectorSectionAt and lowerBuiltEnvironment, inspecting route metrics, selected station positions/facings, section dimensions, refusal paths and the staged scalar-section node id. Incorrect route length, lost authored orientation, wrong interpolation or silently admitted conflicting section spellings contradict these observations.
 * @evidence contracts/testing.md#independent-expectations A local 3-4-5 flight fixes rise/run/length/slope, and literal corridor widths 3/1.5/3 with heights 2.6/2.2/2.6 give quarter width 2.25 and height 2.4 under the original predicates. Helix coordinate equations supply position expectations; expected quarter-turn quaternions share the fixture yaw helper, so they are not an independent quaternion-construction oracle. The equally spaced corridor's 0.5 station does not distinguish arc-length from index parametrization.
 * @evidence contracts/testing.md#distinguishing-cases Six admitted families, constant/varying sections, absent facings, unknown ids, nonfinite/out-of-range queries, empty/stationary routes, absent sections and the existing 23 located mutation cases retain their original inputs and strength. Lowering checks the scalar-section node id rather than a full output snapshot; no arbitrary uneven-route parametrization, landing geometry, personal traversability or rendered appearance is certified here.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_built_connector imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_built_connector(): void {
  const source: IAutoMovieBuiltEnvironment = levels();
  TestValidator.equals(
    "a graph of six connector families validates",
    validateBuiltEnvironment({ environment: source }).success,
    true,
  );

  const spiral: IAutoMovieConnectorGeometry = builtConnectorGeometry(
    source,
    "spiral",
  );
  TestValidator.predicate(
    "a spiral stair's treads are told apart by facing alone",
    ((): boolean => {
      const first: IAutoMovieConnectorStation = spiral.stations[0]!;
      const quarter: IAutoMovieConnectorStation = spiral.stations[1]!;
      const full: IAutoMovieConnectorStation = spiral.stations[4]!;
      return (
        // Plan coordinates repeat after four quarter turns; Y still distinguishes these stations.
        nclose(first.position.x, full.position.x) &&
        nclose(first.position.z, full.position.z) &&
        nclose(full.position.y, HELIX_TURNS * HELIX_RISE) &&
        // Consecutive facings differ and remain unit rotations.
        spiral.stations.every((station: IAutoMovieConnectorStation): boolean =>
          qunit(station.rotation!),
        ) &&
        spiral.stations
          .slice(1)
          .every(
            (station: IAutoMovieConnectorStation, index: number): boolean =>
              !qclose(station.rotation!, spiral.stations[index]!.rotation!),
          ) &&
        qclose(first.rotation!, NO_ROTATION) &&
        qclose(quarter.rotation!, yaw(Math.PI / 2)) &&
        // A whole turn comes back to where it started, one storey higher.
        qclose(full.rotation!, first.rotation!)
      );
    })(),
  );

  const flight: IAutoMovieConnectorGeometry = builtConnectorGeometry(
    source,
    "flight",
  );
  TestValidator.equals(
    "route metrics are the route's own arithmetic",
    namedFacts([
      ["rise", (): boolean => nclose(flight.rise, 3)],
      ["run", (): boolean => nclose(flight.run, 4)],
      ["length", (): boolean => nclose(flight.length, 5)],
      ["slope", (): boolean => nclose(flight.slope, Math.atan2(3, 4))],
      ["firstStation", (): boolean => nclose(flight.stations[0]!.at, 0)],
      ["lastStation", (): boolean => nclose(flight.stations[1]!.at, 1)],
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
    ((): boolean => {
      const corridor: IAutoMovieConnectorGeometry = builtConnectorGeometry(
        source,
        "corridor",
      );
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
      (station: IAutoMovieConnectorStation): IAutoMovieQuaternion | null =>
        station.rotation,
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
    ((): boolean => {
      const start: IAutoMovieConnectorSectionAt = builtConnectorSectionAt(
        source,
        "flight",
        0,
      );
      const middle: IAutoMovieConnectorSectionAt = builtConnectorSectionAt(
        source,
        "flight",
        0.5,
      );
      const end: IAutoMovieConnectorSectionAt = builtConnectorSectionAt(
        source,
        "flight",
        1,
      );
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
    ((): boolean => {
      const start: IAutoMovieConnectorSectionAt = builtConnectorSectionAt(
        source,
        "corridor",
        0,
      );
      const quarter: IAutoMovieConnectorSectionAt = builtConnectorSectionAt(
        source,
        "corridor",
        0.25,
      );
      const waist: IAutoMovieConnectorSectionAt = builtConnectorSectionAt(
        source,
        "corridor",
        0.5,
      );
      const end: IAutoMovieConnectorSectionAt = builtConnectorSectionAt(
        source,
        "corridor",
        1,
      );
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
    throwsError(
      (): IAutoMovieConnectorGeometry =>
        builtConnectorGeometry(source, "missing"),
    ),
  );
  TestValidator.predicate(
    "an unknown connector refuses a section",
    throwsError(
      (): IAutoMovieConnectorSectionAt =>
        builtConnectorSectionAt(source, "missing", 0),
    ),
  );
  TestValidator.predicate(
    "a parameter outside the route is refused",
    throwsError(
      (): IAutoMovieConnectorSectionAt =>
        builtConnectorSectionAt(source, "flight", 1.5),
    ),
  );
  TestValidator.predicate(
    "a non-finite parameter is refused",
    throwsError(
      (): IAutoMovieConnectorSectionAt =>
        builtConnectorSectionAt(source, "flight", Number.NaN),
    ),
  );
  TestValidator.predicate(
    "an empty route has nothing to measure",
    throwsError((): void => {
      const value: IAutoMovieBuiltEnvironment = levels();
      value.connectors[0]!.route = [];
      builtConnectorGeometry(value, "spiral");
    }),
  );
  TestValidator.predicate(
    "a route that never moves has nothing to measure",
    throwsError((): void => {
      const value: IAutoMovieBuiltEnvironment = levels();
      value.connectors[0]!.route = [
        { x: 1, y: 1, z: 1 },
        { x: 1, y: 1, z: 1 },
      ];
      builtConnectorGeometry(value, "spiral");
    }),
  );
  TestValidator.predicate(
    "a connector with no section at all is refused",
    throwsError((): void => {
      const value: IAutoMovieBuiltEnvironment = levels();
      delete value.connectors[3]!.width;
      delete value.connectors[3]!.clearHeight;
      builtConnectorSectionAt(value, "flight", 0);
    }),
  );
  assertBuiltConnectorTestRefusals();
  TestValidator.equals(
    "the untouched level graph produces no violation path at all",
    refusalPaths((): void => {}),
    [],
  );

  TestValidator.equals(
    "the scalar-section record lowers to the same staged set as before",
    lowerBuiltEnvironment(source).set?.map(
      (piece: IAutoMovieStageSetPiece): string => piece.node,
    ),
    ["levels/stair-flight"],
  );
}
