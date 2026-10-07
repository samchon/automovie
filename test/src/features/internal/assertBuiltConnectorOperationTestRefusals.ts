import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { builtConnectorOperationTestRefusalPaths as refusalPaths } from "./builtConnectorOperationTestRefusalPaths";

/** Run the existing malformed BuiltConnectorOperationTest cases in their authored order. */
export const assertBuiltConnectorOperationTestRefusals = (): void => {
  const malformed: Array<
    readonly [string, (value: IAutoMovieBuiltEnvironment) => void, string]
  > = [
    [
      "a landing space that does not resolve",
      (value) => (value.connectors[0]!.landings![0]!.space = "missing"),
      "$input.connectors[0].landings[0].space",
    ],
    [
      "a landing that restates an endpoint",
      (value) => (value.connectors[0]!.landings![0]!.space = "level-2"),
      "$input.connectors[0].landings[0].space",
    ],
    [
      "a landing stated twice",
      (value) =>
        value.connectors[0]!.landings!.push({ space: "level-1", at: 0.75 }),
      "$input.connectors[0].landings[1].space",
    ],
    [
      "a landing at the run's own start",
      (value) => (value.connectors[0]!.landings![0]!.at = 0),
      "$input.connectors[0].landings[0].at",
    ],
    [
      "a landing at the run's own end",
      (value) => (value.connectors[0]!.landings![0]!.at = 1),
      "$input.connectors[0].landings[0].at",
    ],
    [
      "a non-finite landing station",
      (value) => (value.connectors[0]!.landings![0]!.at = Number.NaN),
      "$input.connectors[0].landings[0].at",
    ],
    [
      "landings that do not advance along the route",
      (value) => {
        value.connectors[0]!.landings!.push({ space: "plant", at: 0.25 });
      },
      "$input.connectors[0].landings[1].at",
    ],
    [
      "an operation with no carriage",
      (value) => (value.connectors[0]!.operation!.carriages = []),
      "$input.connectors[0].operation.carriages",
    ],
    [
      "an operation on a run built from nothing",
      (value) => (value.connectors[0]!.elements = []),
      "$input.connectors[0].elements",
    ],
    [
      "a carriage element that does not resolve",
      (value) =>
        (value.connectors[0]!.operation!.carriages[0]!.element = "missing"),
      "$input.connectors[0].operation.carriages[0].element",
    ],
    [
      "a carriage element outside the run it belongs to",
      (value) =>
        (value.connectors[0]!.operation!.carriages[0]!.element = "band"),
      "$input.connectors[0].operation.carriages[0].element",
    ],
    [
      "two carriages driving one element",
      (value) =>
        (value.connectors[0]!.operation!.carriages[1]!.element = "car"),
      "$input.connectors[0].operation.carriages[1].element",
    ],
    [
      "a duplicate carriage id",
      (value) => (value.connectors[0]!.operation!.carriages[1]!.id = "car"),
      "$input.connectors[0].operation.carriages[1].id",
    ],
    [
      "an empty carriage id",
      (value) => (value.connectors[0]!.operation!.carriages[0]!.id = " "),
      "$input.connectors[0].operation.carriages[0].id",
    ],
    [
      "a carriage travel axis of zero length",
      (value) =>
        (value.connectors[0]!.operation!.carriages[0]!.motion.axis = {
          x: 0,
          y: 0,
          z: 0,
        }),
      "$input.connectors[0].operation.carriages[0].motion.axis",
    ],
    [
      "a carriage travel that does not start at rest",
      (value) => (value.connectors[0]!.operation!.carriages[0]!.motion.min = 1),
      "$input.connectors[0].operation.carriages[0].motion.min",
    ],
    [
      "a carriage with no travel at all",
      (value) => (value.connectors[0]!.operation!.carriages[0]!.motion.max = 0),
      "$input.connectors[0].operation.carriages[0].motion.max",
    ],
    [
      "an operation with no named state",
      (value) => (value.connectors[0]!.operation!.states = []),
      "$input.connectors[0].operation.states",
    ],
    [
      "a duplicate state id",
      (value) => (value.connectors[0]!.operation!.states[1]!.id = "at-level-0"),
      "$input.connectors[0].operation.states[1].id",
    ],
    [
      "a state driving an unknown carriage",
      (value) =>
        (value.connectors[0]!.operation!.states[0]!.carriages[0]!.carriage =
          "ghost"),
      "$input.connectors[0].operation.states[0].carriages[0].carriage",
    ],
    [
      "a state driving one carriage twice",
      (value) =>
        (value.connectors[0]!.operation!.states[0]!.carriages[1]!.carriage =
          "car"),
      "$input.connectors[0].operation.states[0].carriages[1].carriage",
    ],
    [
      "a state that gives a carriage no value",
      (value) =>
        value.connectors[0]!.operation!.states[0]!.carriages.splice(1, 1),
      "$input.connectors[0].operation.states[0].carriages",
    ],
    [
      "a state driving a carriage past its own travel",
      (value) =>
        (value.connectors[0]!.operation!.states[0]!.carriages[0]!.value = 99),
      "$input.connectors[0].operation.states[0].carriages[0].value",
    ],
    [
      "a state driving a carriage to nowhere",
      (value) =>
        (value.connectors[0]!.operation!.states[0]!.carriages[0]!.value =
          Number.NaN),
      "$input.connectors[0].operation.states[0].carriages[0].value",
    ],
    [
      "an unknown drive",
      (value) =>
        (value.connectors[0]!.operation!.states[0]!.drive = "idle" as "still"),
      "$input.connectors[0].operation.states[0].drive",
    ],
    [
      "a reverse drive on a one-way run",
      (value) => (value.connectors[1]!.operation!.states[1]!.drive = "reverse"),
      "$input.connectors[1].operation.states[1].drive",
    ],
    [
      "a current state that does not resolve",
      (value) => (value.connectors[0]!.operation!.state = "parked"),
      "$input.connectors[0].operation.state",
    ],
    [
      "a stop the run does not make",
      (value) =>
        (value.connectors[0]!.operation!.states[0]!.carriages[0]!.serves =
          "whole"),
      "$input.connectors[0].operation.states[0].carriages[0].serves",
    ],
    [
      "a car that does not stand in the floor it claims",
      (value) =>
        (value.connectors[0]!.operation!.states[0]!.carriages[0]!.serves =
          "level-2"),
      "$input.connectors[0].operation.states[0].carriages[0].serves",
    ],
    [
      // At rest the wing is a clean scaled frame; half a turn later the same
      // hierarchy carries shear no staged node could hold, and a state that
      // cannot be staged is a state the viewer could never reproduce.
      "a state the scene could not stage even though the current one can",
      (value) =>
        (value.elements.find(
          (element) => element.id === "gate-drum",
        )!.transform.scale = { x: 2, y: 1, z: 1 }),
      "$input.connectors[3].operation.states[1]",
    ],
    [
      "an element a door leaf and a lift car both try to drive",
      (value) => {
        value.boundaries.push({
          id: "wall",
          kind: "wall",
          spaces: ["level-0", "level-1"],
          elements: ["shaft"],
        });
        value.openings.push({
          id: "hatch",
          kind: "door",
          boundary: "wall",
          fill: "car",
          operation: {
            panels: [
              {
                id: "leaf",
                element: "car",
                width: 1,
                height: 2,
                motion: {
                  kind: "revolute",
                  axis: { x: 0, y: 1, z: 0 },
                  pivot: { x: 0, y: 0, z: 0 },
                  min: 0,
                  max: Math.PI / 2,
                },
              },
            ],
            states: [{ id: "shut", panels: [{ panel: "leaf", value: 0 }] }],
            state: "shut",
            hardware: [],
          },
        });
      },
      "$input.connectors[0].operation.carriages[0].element",
    ],
  ];
  malformed.forEach(([name, mutate, path]) =>
    TestValidator.equals(
      `${name} is refused at ${path}`,
      refusalPaths(mutate).includes(path),
      true,
    ),
  );
};
