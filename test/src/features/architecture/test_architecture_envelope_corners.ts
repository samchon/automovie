import type {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieBuiltEnvelopeCorner } from "../../../../packages/engine/src/architecture/IAutoMovieBuiltEnvelopeCorner";
import { builtEnvironmentEnvelopeCorners } from "../../../../packages/engine/src/architecture/builtEnvironmentEnvelopeCorners";
import { validateBuiltEnvironment } from "../../../../packages/engine/src/architecture/validateBuiltEnvironment";
import {
  FACE_ROTATION,
  boxCell,
  lFootprintBuilding,
  originTransform,
  rectangularBuilding,
} from "../internal/envelopeFixtures";
import { namedFacts, vclose } from "../internal/predicates";

/**
 * Derive exterior and reentrant corners from adjacent facade frames within one building unit.
 *
 * Scenarios:
 * 1. The rectangle produces exactly its four corners, all exterior; its two parallel opposite-wall pairs contribute none under this query's exclusion rule.
 * 2. One corner's meeting point and outward bisector match hand-authored values under the existing vector tolerance.
 * 3. The L-shaped wing is a legal building whose six facades produce six corners: five exterior and exactly one re-entrant, standing in the notch.
 * 4. The rectangle/L-wing's complete expected populations exclude their nonmeeting facade pairs; no separate wall-thickness threshold pair is authored.
 * 5. Two facades of different building units produce nothing even when they share a point.
 * 6. A facade whose own centroid is the meeting point produces nothing, because there is no direction from the corner into its body to read.
 * 7. A meeting whose second body sits exactly on the first's outward plane produces nothing, because it turns neither way.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls builtEnvironmentEnvelopeCorners on rectangle/L-wing and the three explicit excluded-meeting fixtures, with L-wing admission checked separately. Complete id/kind/owner populations, selected position/normal/facade ids and zero result counts expose omitted reentrant classification, cross-unit pairing or guessed turns for arealess/flat meetings; the query reports CPU proximity proxies rather than proven edge intersections.
 * @evidence contracts/testing.md#independent-expectations Literal rectangular face frames give north-east (4,1.5,6) and bisector (sqrt(1/2),0,sqrt(1/2)); the authored L footprint gives six expected pairs with its only reentrant position (2,1.5,2), under the original vclose tolerance. Separate unit ids, zero-area centroid and the triangular flat-turn coordinates determine the three exclusions without using the corner output as an oracle.
 * @evidence contracts/testing.md#distinguishing-cases Rectangle/L-wing populations include exterior/reentrant meetings and exclude their other pairs; different units, an arealess facade and a flat turn have explicit zero-result controls. No separately isolated near-thickness threshold, arbitrary curved envelope, complete global topology or photographed coverage is certified.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_envelope_corners imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_envelope_corners(): void {
  const rectangle: IAutoMovieBuiltEnvelopeCorner[] =
    builtEnvironmentEnvelopeCorners(rectangularBuilding());

  TestValidator.equals(
    "the rectangle owes one corner per pair of meeting walls",
    rectangle.map((corner: IAutoMovieBuiltEnvelopeCorner): string[] => [
      corner.id,
      corner.kind,
      corner.building,
    ]),
    [
      ["wall-east+wall-north", "exterior", "house"],
      ["wall-east+wall-south", "exterior", "house"],
      ["wall-north+wall-west", "exterior", "house"],
      ["wall-south+wall-west", "exterior", "house"],
    ],
  );

  TestValidator.equals(
    "the north-east corner stands where its two walls meet",
    namedFacts([
      [
        "the meeting point is the middle of the shared vertical edge",
        (): boolean => vclose(rectangle[0]!.position, { x: 4, y: 1.5, z: 6 }),
      ],
      [
        "and the bisector points off the envelope",
        (): boolean =>
          vclose(rectangle[0]!.normal, {
            x: Math.SQRT1_2,
            y: 0,
            z: Math.SQRT1_2,
          }),
      ],
      [
        "naming both walls in code-unit order",
        (): boolean =>
          rectangle[0]!.facades[0] === "wall-east" &&
          rectangle[0]!.facades[1] === "wall-north",
      ],
    ]),
    {
      "the meeting point is the middle of the shared vertical edge": true,
      "and the bisector points off the envelope": true,
      "naming both walls in code-unit order": true,
    },
  );

  const wing: IAutoMovieBuiltEnvironment = lFootprintBuilding();

  TestValidator.equals(
    "the L-shaped wing is a legal building",
    validateBuiltEnvironment({ environment: wing }).success,
    true,
  );

  const notched: IAutoMovieBuiltEnvelopeCorner[] =
    builtEnvironmentEnvelopeCorners(wing);

  TestValidator.equals(
    "its notch is the one corner an observer walks into",
    notched.map((corner: IAutoMovieBuiltEnvelopeCorner): string[] => [
      corner.id,
      corner.kind,
    ]),
    [
      ["wall-0+wall-1", "exterior"],
      ["wall-0+wall-5", "exterior"],
      ["wall-1+wall-2", "exterior"],
      ["wall-2+wall-3", "reentrant"],
      ["wall-3+wall-4", "exterior"],
      ["wall-4+wall-5", "exterior"],
    ],
  );

  TestValidator.equals(
    "the re-entrant corner stands at the inside angle of the footprint",
    vclose(
      notched.find(
        (corner: IAutoMovieBuiltEnvelopeCorner): boolean =>
          corner.kind === "reentrant",
      )!.position,
      {
        x: 2,
        y: 1.5,
        z: 2,
      },
    ),
    true,
  );

  TestValidator.equals(
    "a meeting that is not one building's own corner produces nothing",
    namedFacts([
      [
        "two units touching at a point share no corner",
        (): boolean =>
          builtEnvironmentEnvelopeCorners(differentUnits()).length === 0,
      ],
      [
        "a facade standing on its own meeting point contributes none",
        (): boolean =>
          builtEnvironmentEnvelopeCorners(pointlessFacade()).length === 0,
      ],
      [
        "and a meeting that turns neither way contributes none",
        (): boolean => builtEnvironmentEnvelopeCorners(flatTurn()).length === 0,
      ],
    ]),
    {
      "two units touching at a point share no corner": true,
      "a facade standing on its own meeting point contributes none": true,
      "and a meeting that turns neither way contributes none": true,
    },
  );
}

/** One enclosing separation with a hand-written face frame. */
const facade: (props: {
  id: string;
  space: string;
  origin: { x: number; y: number; z: number };
  rotation: IAutoMovieQuaternion;
  outline: Array<{ x: number; y: number }>;
}) => IAutoMovieBuiltBoundary = (props: {
  id: string;
  space: string;
  origin: { x: number; y: number; z: number };
  rotation: IAutoMovieQuaternion;
  outline: Array<{ x: number; y: number }>;
}): IAutoMovieBuiltBoundary => ({
  id: props.id,
  kind: "wall",
  spaces: [props.space],
  elements: [],
  face: {
    origin: props.origin,
    rotation: props.rotation,
    outline: props.outline,
    thickness: 0.2,
  },
});

/** The rectangle outline every small fixture below reuses. */
const panel: (
  width: number,
  height: number,
) => Array<{ x: number; y: number }> = (
  width: number,
  height: number,
): Array<{ x: number; y: number }> => [
  { x: 0, y: 0 },
  { x: width, y: 0 },
  { x: width, y: height },
  { x: 0, y: height },
];

/** One record shell holding hand-written spaces and boundaries. */
const shell: (props: {
  id: string;
  units: Array<{ id: string; space: string }>;
  spaces: IAutoMovieBuiltEnvironment["spaces"];
  boundaries: IAutoMovieBuiltBoundary[];
}) => IAutoMovieBuiltEnvironment = (props: {
  id: string;
  units: Array<{ id: string; space: string }>;
  spaces: IAutoMovieBuiltEnvironment["spaces"];
  boundaries: IAutoMovieBuiltBoundary[];
}): IAutoMovieBuiltEnvironment => ({
  version: 1,
  id: props.id,
  units: "meter",
  buildings: props.units.map(
    (unit: {
      id: string;
      space: string;
    }): { id: string; element: string; space: string } => ({
      id: unit.id,
      element: `${unit.id}-root`,
      space: unit.space,
    }),
  ),
  models: [],
  modelReferences: [],
  elements: props.units.map(
    (unit: {
      id: string;
      space: string;
    }): {
      id: string;
      kind: string;
      parent: null;
      transform: IAutoMovieTransform;
      model: null;
      space: string;
    } => ({
      id: `${unit.id}-root`,
      kind: "building",
      parent: null,
      transform: originTransform(),
      model: null,
      space: unit.space,
    }),
  ),
  spaces: props.spaces,
  boundaries: props.boundaries,
  openings: [],
  connectors: [],
  surfaces: [],
  walkable: [],
});

/**
 * Two building units whose facades meet at the world origin.
 *
 * A corner belongs to one envelope, so two works standing against each other share a seam rather than a corner, and neither owes the other's observation.
 */
const differentUnits: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment =>
    shell({
      id: "neighbours",
      units: [
        { id: "a", space: "a-hall" },
        { id: "b", space: "b-hall" },
      ],
      spaces: [
        {
          id: "a-hall",
          kind: "room",
          parent: null,
          cells: [
            boxCell("a-cell", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 6 }),
          ],
        },
        {
          id: "b-hall",
          kind: "room",
          parent: null,
          cells: [
            boxCell("b-cell", { x: -4, y: 0, z: -6 }, { x: 0, y: 3, z: 0 }),
          ],
        },
      ],
      boundaries: [
        facade({
          id: "north-a",
          space: "a-hall",
          origin: { x: 4, y: 0, z: 0 },
          rotation: FACE_ROTATION.halfTurnY,
          outline: panel(4, 3),
        }),
        facade({
          id: "west-b",
          space: "b-hall",
          origin: { x: 0, y: 0, z: 0 },
          rotation: FACE_ROTATION.quarterY,
          outline: panel(6, 3),
        }),
      ],
    });

/**
 * One arealess separation sharing a point with a real one.
 *
 * Its own centroid is the meeting point, so nothing states which way its body lies and the meeting cannot be classified either way.
 */
const pointlessFacade: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment =>
    shell({
      id: "pointless",
      units: [{ id: "a", space: "a-hall" }],
      spaces: [
        {
          id: "a-hall",
          kind: "room",
          parent: null,
          cells: [
            boxCell("a-cell", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 6 }),
          ],
        },
      ],
      boundaries: [
        facade({
          id: "flat-x",
          space: "a-hall",
          origin: { x: 0, y: 0, z: 0 },
          rotation: FACE_ROTATION.quarterMinusY,
          outline: panel(6, 3),
        }),
        facade({
          id: "pointless",
          space: "a-hall",
          origin: { x: 0, y: 0, z: 0 },
          rotation: FACE_ROTATION.halfTurnY,
          outline: [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
          ],
        }),
      ],
    });

/**
 * Two separations meeting with the second's body on the first's outward plane.
 *
 * The triangular face's centroid sits directly below the shared point, so the direction from the corner into it is perpendicular to the other facade's normal and the meeting turns neither out of nor into the envelope.
 */
const flatTurn: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment =>
    shell({
      id: "flat",
      units: [{ id: "a", space: "a-hall" }],
      spaces: [
        {
          id: "a-hall",
          kind: "room",
          parent: null,
          cells: [
            boxCell("a-cell", { x: 0, y: 0, z: 0 }, { x: 4, y: 3, z: 6 }),
          ],
        },
      ],
      boundaries: [
        facade({
          id: "flat-x",
          space: "a-hall",
          origin: { x: 0, y: 0, z: 0 },
          rotation: FACE_ROTATION.quarterMinusY,
          outline: panel(6, 3),
        }),
        facade({
          id: "tri-z",
          space: "a-hall",
          origin: { x: 1, y: 0, z: 0 },
          rotation: FACE_ROTATION.halfTurnY,
          outline: [
            { x: 0, y: 0 },
            { x: 2, y: 0 },
            { x: 1, y: 3 },
          ],
        }),
      ],
    });
