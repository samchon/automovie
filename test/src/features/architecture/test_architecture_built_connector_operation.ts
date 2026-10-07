import { builtConnectorCarriagePlacements, builtConnectorGeometry, builtEnvironmentAdjacentSpaces, builtEnvironmentSpaceConnectors, lowerBuiltEnvironment, validateBuiltEnvironment } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, nclose, qclose, throwsError, vclose } from "../internal/predicates";
import { builtConnectorOperationTestRuns as runs } from "../internal/builtConnectorOperationTestRuns";
import { BUILT_CONNECTOR_OPERATION_TEST_STOREY as STOREY } from "../internal/BUILT_CONNECTOR_OPERATION_TEST_STOREY";
import { builtConnectorOperationTestCarAt as carAt } from "../internal/builtConnectorOperationTestCarAt";
import { BUILT_CONNECTOR_OPERATION_TEST_CAR_REST as CAR_REST } from "../internal/BUILT_CONNECTOR_OPERATION_TEST_CAR_REST";
import { BUILT_CONNECTOR_OPERATION_TEST_NO_ROTATION as NO_ROTATION } from "../internal/BUILT_CONNECTOR_OPERATION_TEST_NO_ROTATION";
import { builtConnectorOperationTestYaw as yaw } from "../internal/builtConnectorOperationTestYaw";
import { builtConnectorOperationTestAlphabetical as alphabetical } from "../internal/builtConnectorOperationTestAlphabetical";
import { assertBuiltConnectorOperationTestRefusals } from "../internal/assertBuiltConnectorOperationTestRefusals";
import { builtConnectorOperationTestRefusalPaths as refusalPaths } from "../internal/builtConnectorOperationTestRefusalPaths";



/**
 * A run that moves is a run with named states, and the states have to be true.
 *
 * A lift that stops at four floors is one shaft, so this pins that the floors
 * between its ends stay in the graph rather than in its geometry alone: an
 * adjacency query answers with them, a one-way run only reaches the stops ahead
 * of it, and a landing is placed on the route by arc length. It also pins that
 * a stop is a claim the engine settles — the car has to actually stand in the
 * space its state says it serves, while a counterweight that serves nothing is
 * held to nothing. Whether anyone could board any of it is never asked.
 *
 * Scenarios:
 *
 * 1. A work holding a lift with a car, a counterweight and a mid landing, a
 *    powered escalator, a one-way chute, a revolving gate, and a static stair
 *    validates whole.
 * 2. A landing is placed on the run's own route by arc length, on both an even
 *    two-point route and an uneven three-point one; a run with no landing
 *    answers with none.
 * 3. Carriage placement answers where each car stands at the record's own state
 *    and at any other named one, and hands back the space that state serves —
 *    `null` for the counterweight, which stands at no floor in any state. A
 *    revolving gate's wing turns on the same record without travelling at all.
 * 4. Lowering stages the car at the current state: standing the record at the top
 *    floor moves the staged node, and stripping the operation puts it back at
 *    its rest pose, so a static connector lowers as it always did.
 * 5. Adjacency reaches every stop of a two-way run and only the stops ahead of a
 *    one-way one, and the connector query answers for a landing that is neither
 *    endpoint.
 * 6. A run that declares no operation has no carriage to place, and every query
 *    refuses an unknown connector, an unknown state, and a carriage whose
 *    element is gone.
 * 7. A state that names no value for a carriage leaves it at rest and serving
 *    nothing, and a current state that does not resolve serves nothing either.
 * 8. Thirty-one malformed runs are each refused at their own path, including a car
 *    that does not stand in the floor it claims, a reverse drive on a one-way
 *    run — which the two-way lift's own reverse state is the twin of — an
 *    element two members try to drive at once, and a state the scene could not
 *    stage even though the record's current one can.
 */
export const test_architecture_built_connector_operation = (): void => {
  const source = runs();
  TestValidator.equals(
    "a work of three moving runs and one static one validates",
    validateBuiltEnvironment({ environment: source }).success,
    true,
  );

  const lift = builtConnectorGeometry(source, "lift");
  TestValidator.equals(
    "a landing sits on the run's own route by arc length",
    namedFacts([
      ["count", () => lift.landings.length === 1],
      ["space", () => lift.landings[0]!.space === "level-1"],
      ["at", () => nclose(lift.landings[0]!.at, 0.5)],
      [
        "position",
        () => vclose(lift.landings[0]!.position, { x: 0, y: STOREY, z: 0 }),
      ],
    ]),
    { count: true, space: true, at: true, position: true },
  );
  TestValidator.predicate(
    "an uneven route places its landing by length, not by station index",
    (() => {
      const chute = builtConnectorGeometry(source, "chute");
      // Segments of 2 m and 4 m: half the length falls a quarter of the way
      // along the second one, which an index-based reading would miss by a
      // metre.
      return (
        chute.landings.length === 1 &&
        vclose(chute.landings[0]!.position, { x: -6, y: STOREY, z: 0 })
      );
    })(),
  );
  TestValidator.equals(
    "a run with no landing answers with none",
    builtConnectorGeometry(source, "stair").landings,
    [],
  );
  TestValidator.predicate(
    "a landing on a route that stalls is placed at the stall rather than by a division by zero",
    (() => {
      const value = runs();
      value.connectors[0]!.route = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 2 * STOREY, z: 0 },
      ];
      value.connectors[0]!.landings![0]!.at = 0;
      const stalled = builtConnectorGeometry(value, "lift");
      return vclose(stalled.landings[0]!.position, { x: 0, y: 0, z: 0 });
    })(),
  );

  TestValidator.equals(
    "each car stands where its own state puts it",
    namedFacts([
      ["carRest", () => nclose(carAt(source, "car"), CAR_REST)],
      [
        "carLevel1",
        () => nclose(carAt(source, "car", "at-level-1"), CAR_REST + STOREY),
      ],
      [
        "carLevel2",
        () => nclose(carAt(source, "car", "at-level-2"), CAR_REST + 2 * STOREY),
      ],
      [
        "counterweightRest",
        () => nclose(carAt(source, "counterweight"), CAR_REST + 2 * STOREY),
      ],
      [
        "counterweightLevel2",
        () => nclose(carAt(source, "counterweight", "at-level-2"), CAR_REST),
      ],
    ]),
    {
      carRest: true,
      carLevel1: true,
      carLevel2: true,
      counterweightRest: true,
      counterweightLevel2: true,
    },
  );
  TestValidator.equals(
    "the state hands back the floor it serves, and nothing for what serves none",
    builtConnectorCarriagePlacements(source, "lift", "at-level-1").map(
      (placement) => [placement.carriage, placement.node, placement.serves],
    ),
    [
      ["car", "runs/car", "level-1"],
      ["counterweight", "runs/counterweight", null],
    ],
  );

  TestValidator.predicate(
    "lowering stages the car at the state the record stands in",
    (() => {
      const node = (environment: IAutoMovieBuiltEnvironment): number =>
        lowerBuiltEnvironment(environment).set!.find(
          (piece) => piece.node === "runs/car",
        )!.position.y;
      const raised = runs();
      raised.connectors[0]!.operation!.state = "at-level-2";
      const stripped = runs();
      stripped.connectors[0]!.operation!.state = "at-level-2";
      delete stripped.connectors[0]!.operation;
      return (
        nclose(node(source), CAR_REST) &&
        nclose(node(raised), CAR_REST + 2 * STOREY) &&
        // A run that states no operation lowers from its rest pose alone, which
        // is exactly what it did before any of this existed.
        nclose(node(stripped), CAR_REST)
      );
    })(),
  );

  TestValidator.predicate(
    "a carriage may turn as well as slide, which is what a revolving gate is",
    (() => {
      const shut = builtConnectorCarriagePlacements(source, "gate")[0]!;
      const turned = builtConnectorCarriagePlacements(
        source,
        "gate",
        "half-turned",
      )[0]!;
      return (
        shut.serves === "lobby" &&
        turned.serves === null &&
        // The wing pivots about its own origin, so it turns without travelling
        // — which is exactly why a placement has to answer with a rotation and
        // not only a position.
        vclose(shut.position, turned.position) &&
        qclose(shut.rotation, NO_ROTATION) &&
        qclose(turned.rotation, yaw(Math.PI / 3))
      );
    })(),
  );

  TestValidator.equals(
    "a two-way run reaches every stop it declares",
    // The lift reaches the floor between its ends, and the one-way escalator
    // reaches the plant deck ahead of it.
    builtEnvironmentAdjacentSpaces(source, "level-0").sort(alphabetical),
    ["level-1", "level-2", "lobby", "plant"],
  );
  TestValidator.equals(
    "a landing reaches the stops on both sides of a two-way run",
    builtEnvironmentAdjacentSpaces(source, "level-1").sort(alphabetical),
    ["level-0", "level-2"],
  );
  TestValidator.equals(
    "a one-way run reaches only the stops ahead of it",
    builtEnvironmentAdjacentSpaces(source, "level-2").sort(alphabetical),
    ["level-0", "level-1"],
  );
  TestValidator.equals(
    "a landing on a one-way run reaches forward and never back",
    builtEnvironmentAdjacentSpaces(source, "plant"),
    ["level-1"],
  );
  TestValidator.equals(
    "a space no run touches is adjacent to nothing",
    builtEnvironmentAdjacentSpaces(source, "whole"),
    [],
  );
  TestValidator.equals(
    "a landing is a place the run lands on, so the connector query answers with it",
    builtEnvironmentSpaceConnectors(source, "level-1").map(
      (connector) => connector.id,
    ),
    ["lift", "escalator", "chute", "stair"],
  );

  TestValidator.equals(
    "a run that never moves has no carriage to place",
    builtConnectorCarriagePlacements(source, "stair"),
    [],
  );
  TestValidator.predicate(
    "an unknown connector has no carriage",
    throwsError(() => builtConnectorCarriagePlacements(source, "missing")),
  );
  TestValidator.predicate(
    "an unknown operating state is refused",
    throwsError(() =>
      builtConnectorCarriagePlacements(source, "lift", "at-level-9"),
    ),
  );
  TestValidator.predicate(
    "a carriage whose element is gone is refused",
    throwsError(() => {
      const value = runs();
      value.elements = value.elements.filter((element) => element.id !== "car");
      builtConnectorCarriagePlacements(value, "lift");
    }),
  );
  TestValidator.predicate(
    "a state that names no value leaves its carriage at rest and serving nothing",
    (() => {
      const value = runs();
      value.connectors[0]!.operation!.states[0]!.carriages = [
        { carriage: "counterweight", value: 0, serves: null },
      ];
      const placements = builtConnectorCarriagePlacements(value, "lift");
      const car = placements.find((entry) => entry.carriage === "car")!;
      return nclose(car.position.y, CAR_REST) && car.serves === null;
    })(),
  );
  TestValidator.predicate(
    "a current state that does not resolve leaves every carriage at rest",
    (() => {
      const value = runs();
      value.connectors[0]!.operation!.state = "at-level-9";
      const placements = builtConnectorCarriagePlacements(value, "lift");
      return (
        placements.every((entry) => entry.serves === null) &&
        nclose(placements[0]!.position.y, CAR_REST)
      );
    })(),
  );
  assertBuiltConnectorOperationTestRefusals();
  TestValidator.equals(
    "the untouched moving work produces no violation path at all",
    refusalPaths(() => {}),
    [],
  );
};
