import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieBuildingObservationCensus } from "../../../../packages/engine/src/architecture/IAutoMovieBuildingObservationCensus";
import type { IAutoMovieBuiltEnvelopeCorner } from "../../../../packages/engine/src/architecture/IAutoMovieBuiltEnvelopeCorner";
import type { IAutoMovieBuiltEnvelopeFace } from "../../../../packages/engine/src/architecture/IAutoMovieBuiltEnvelopeFace";
import { builtEnvironmentBuildingCensus } from "../../../../packages/engine/src/architecture/builtEnvironmentBuildingCensus";
import {
  FACE_ROTATION,
  boxCell,
  originTransform,
  rectangularBuilding,
} from "../internal/envelopeFixtures";

/**
 * Census one building's facades, roof, underside, corners, entrances, volumetric spaces and connector identities.
 *
 * Scenarios:
 * 1. The rectangular hall reports its four facades, its roof, its ground slab, its four corners and the one opening cut through its envelope.
 * 2. Its space list carries the bounded hall and loft, and leaves out the named zone that bounds nothing.
 * 3. A connector landing in either of those spaces is named once.
 * 4. Two building units each answer for their own envelope only, in building-id order, and neither claims the other's face.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls builtEnvironmentBuildingCensus and compares projected building/face/corner/entrance/space/connector ids in declared expected order. Missing envelope members, including an extent-free zone as a volumetric room, duplicate stair membership or cross-unit face ownership would change the observed rows.
 * @evidence contracts/testing.md#independent-expectations The rectangular fixture declares four walls, one roof/slab/opening and two volumetric spaces; a named extent-free zone contributes no room, and two independent units determine separate code-unit-ordered rows without copying the census output.
 * @evidence contracts/testing.md#distinguishing-cases One unit, a stair serving two spaces, an extent-free zone and two units distinguish envelope ownership from room contents; geometric corner locations belong to the corner test.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_building_census imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_building_census(): void {
  const census: IAutoMovieBuildingObservationCensus[] =
    builtEnvironmentBuildingCensus(furnished());

  TestValidator.equals(
    "one unit answers for its own envelope, corners, entrances and rooms",
    census.map(
      (
        unit: IAutoMovieBuildingObservationCensus,
      ): {
        building: string;
        facades: string[];
        roofs: string[];
        undersides: string[];
        corners: string[];
        entrances: string[];
        spaces: string[];
        connectors: string[];
      } => ({
        building: unit.building,
        facades: unit.facades.map(
          (face: IAutoMovieBuiltEnvelopeFace): string => face.boundary,
        ),
        roofs: unit.roofs.map(
          (face: IAutoMovieBuiltEnvelopeFace): string => face.boundary,
        ),
        undersides: unit.undersides.map(
          (face: IAutoMovieBuiltEnvelopeFace): string => face.boundary,
        ),
        corners: unit.corners.map(
          (corner: IAutoMovieBuiltEnvelopeCorner): string => corner.id,
        ),
        entrances: unit.entrances,
        spaces: unit.spaces,
        connectors: unit.connectors,
      }),
    ),
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
    builtEnvironmentBuildingCensus(twoUnits()).map(
      (unit: IAutoMovieBuildingObservationCensus): (string | string[])[] => [
        unit.building,
        unit.facades.map(
          (face: IAutoMovieBuiltEnvelopeFace): string => face.boundary,
        ),
        unit.spaces,
      ],
    ),
    [
      ["east", ["east-wall"], ["east-hall"]],
      ["west", ["west-wall"], ["west-hall"]],
    ],
  );
}

/**
 * The rectangular hall with a room above it, a named zone, and a stair.
 *
 * `loft` states a volume and enters the room population; `west-wing` states none and does not. The stair lands in both real spaces and is named once.
 */
const furnished: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => {
    const record: IAutoMovieBuiltEnvironment = rectangularBuilding();
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
const twoUnits: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => ({
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
        cells: [
          boxCell("west-cell", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 6 }),
        ],
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
