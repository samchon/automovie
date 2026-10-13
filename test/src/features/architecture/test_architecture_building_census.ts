import { builtEnvironmentBuildingCensus } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  FACE_ROTATION,
  boxCell,
  originTransform,
  rectangularBuilding,
} from "../internal/envelopeFixtures";

/**
 *
 * A building is a denominator, and the census is what states the whole of it.
 *
 * A room-by-room survey is not a survey of a building: an exterior wall, a roof
 * and a foundation belong to no room, so a population counted over spaces leaves
 * out the envelope the exterior review is entirely about. The census answers for
 * one unit at once, with every population it owes derived from the record rather
 * than declared beside it.
 *
 * The space list is the one place a judgement is made, and it is made the same
 * way everywhere here: a space that states a volume is a room and a space that
 * states none is a name. A named zone with no extent has no inside to stand in,
 * so charging it nine interior views would charge a review for a heading.
 *
 * Scenarios:
 *
 * 1. The rectangular hall reports its four facades, its roof, its ground slab,
 *    its four corners and the one opening cut through its envelope.
 * 2. Its space list carries the storey and the room above it, and leaves out the
 *    named zone that bounds nothing.
 * 3. A connector landing in either of those spaces is named once.
 * 4. Two building units each answer for their own envelope only, in building-id
 *    order, and neither claims the other's face.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `builtEnvironmentBuildingCensus` and asserts each unit's facade, roof and underside boundaries, corner ids, entrances, volume-stating spaces and connectors; it catches an envelope face counted under the wrong aspect or the other unit, a missing corner, an opening off the envelope reported as an entrance, a volumeless zone charged as a room, a connector named twice for landing in two owned spaces, and units reported out of id order.
 * @evidence contracts/testing.md#independent-expectations Expectations are read off the hand-typed fixtures: `rectangularBuilding` has four walls, one roof, one floor and a door cut through the south wall, so four facades, one roof, one underside, the four `a+b` wall pairs that meet at its corners and one entrance; `loft` states a cell and `west-wing` none; the two-unit record gives each unit exactly its own wall and hall; ids are compared in the census's documented id order rather than copied from a run.
 * @evidence contracts/testing.md#distinguishing-cases Positive one-unit census with a room above, a volumeless named zone that must be left out, and a stair landing in two owned spaces that must be named once; a two-unit record where neither unit may claim the other's face; face aspect derivation and corner geometry themselves are owned by test_architecture_envelope_faces and test_architecture_envelope_corners, and descendant-space walking by test_architecture_descendant_spaces.
 */
export const test_architecture_building_census = (): void => {
  const census = builtEnvironmentBuildingCensus(furnished());

  TestValidator.equals(
    "one unit answers for its own envelope, corners, entrances and rooms",
    census.map((unit) => ({
      building: unit.building,
      facades: unit.facades.map((face) => face.boundary),
      roofs: unit.roofs.map((face) => face.boundary),
      undersides: unit.undersides.map((face) => face.boundary),
      corners: unit.corners.map((corner) => corner.id),
      entrances: unit.entrances,
      spaces: unit.spaces,
      connectors: unit.connectors,
    })),
    [
      {
        building: "house",
        facades: ["wall-east", "wall-north", "wall-south", "wall-west"],
        roofs: ["roof-top"],
        undersides: ["floor-slab"],
        corners: [
          "wall-east+wall-north",
          "wall-east+wall-south",
          "wall-north+wall-west",
          "wall-south+wall-west",
        ],
        entrances: ["door-main"],
        spaces: ["hall", "loft"],
        connectors: ["stair-1"],
      },
    ],
  );

  TestValidator.equals(
    "two units answer separately, in building-id order",
    builtEnvironmentBuildingCensus(twoUnits()).map((unit) => [
      unit.building,
      unit.facades.map((face) => face.boundary),
      unit.spaces,
    ]),
    [
      ["east", ["east-wall"], ["east-hall"]],
      ["west", ["west-wall"], ["west-hall"]],
    ],
  );
};

/**
 * The rectangular hall with a room above it, a named zone, and a stair.
 *
 * `loft` states a volume and enters the room population; `west-wing` states none
 * and does not. The stair lands in both real spaces and is named once.
 */
const furnished = (): IAutoMovieBuiltEnvironment => {
  const record = rectangularBuilding();
  return {
    ...record,
    spaces: [
      ...record.spaces,
      {
        id: "loft",
        kind: "room",
        parent: "hall",
        cells: [
          boxCell("loft-cell", { x: 0, y: 3, z: 0 }, { x: 4, y: 5, z: 6 }),
        ],
      },
      { id: "west-wing", kind: "zone", parent: "hall", cells: [] },
    ],
    connectors: [
      {
        id: "stair-1",
        kind: "stair",
        from: "hall",
        to: "loft",
        bidirectional: true,
        route: [
          { x: 3.5, y: 0, z: 5.5 },
          { x: 3.5, y: 3, z: 5.5 },
        ],
        width: 1,
        clearHeight: 2,
        elements: [],
      },
    ],
  };
};

/** Two independent units, each with exactly one exposed separation. */
const twoUnits = (): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: "pair",
  units: "meter",
  buildings: [
    { id: "west", element: "west-root", space: "west-hall" },
    { id: "east", element: "east-root", space: "east-hall" },
  ],
  models: [],
  modelReferences: [],
  elements: [
    {
      id: "west-root",
      kind: "building",
      parent: null,
      transform: originTransform(),
      model: null,
      space: "west-hall",
    },
    {
      id: "east-root",
      kind: "building",
      parent: null,
      transform: originTransform(),
      model: null,
      space: "east-hall",
    },
  ],
  spaces: [
    {
      id: "west-hall",
      kind: "room",
      parent: null,
      cells: [boxCell("west-cell", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 6 })],
    },
    {
      id: "east-hall",
      kind: "room",
      parent: null,
      cells: [
        boxCell("east-cell", { x: 10, y: 0, z: 0 }, { x: 14, y: 3, z: 6 }),
      ],
    },
  ],
  boundaries: [
    {
      id: "west-wall",
      kind: "wall",
      spaces: ["west-hall"],
      elements: [],
      face: {
        origin: { x: 0, y: 0, z: 6 },
        rotation: FACE_ROTATION.keepZ,
        outline: [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 3 },
          { x: 0, y: 3 },
        ],
        thickness: 0.2,
      },
    },
    {
      id: "east-wall",
      kind: "wall",
      spaces: ["east-hall"],
      elements: [],
      face: {
        origin: { x: 10, y: 0, z: 6 },
        rotation: FACE_ROTATION.keepZ,
        outline: [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 3 },
          { x: 0, y: 3 },
        ],
        thickness: 0.2,
      },
    },
  ],
  openings: [],
  connectors: [],
  surfaces: [],
  walkable: [],
});
