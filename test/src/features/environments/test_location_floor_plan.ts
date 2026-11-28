import {
  AutoMovieArchetypeEnvironment
} from "../../../../packages/archetypes/src/environments/AutoMovieArchetypeEnvironment";
import { AutoMovieEngineSpace, AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltEnvironment,
  IAutoMovieEnvironment,
  IAutoMoviePropSpec,
  IAutoMovieSpace,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { nclose } from "../internal/predicates";

/**
 * Exercise boundaries, voids and static passages as a prepared environment.
 *
 * Scenarios:
 *
 * 1. Two rectangles sharing only the centre of an edge produce one partition and
 *    two exposed wall remainders.
 * 2. The courtyard floor has no support in its interior void, while its
 *    surrounding floor and connector deck have the authored world elevation.
 * 3. Moving one landing vertically, oversizing the deck or crossing the opening
 *    obliquely refuses a bridge.
 * 4. Positive-area overlap refuses before generating either room.
 * 5. One stair run creates treads and the upper-floor void at the same
 *    coordinates, retaining adjacent support at the upper level.
 * 6. Open threshold support spans the wall depth while solid wall and a closed
 *    door leave gaps. A standard lever keeps both carried contacts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a real environment in memory and reads admitted boundaries, support heights and refusals through the normal composer and height queries.
 * @evidence contracts/development/testing.md#independent-expectations The shared interval [1,3] lies in [0,4], with a 1 m remainder on each side. Deck and courtyard probes use authored elevations. The sixth tread rises 6 times 0.17 m from the 3 m origin. A 2 m normal run and 3 m shift make the 1 m deck span sqrt(13)/2 m across a 1.4 m opening.
 * @evidence contracts/development/common.md#meaningful-documentation Enumerates the normalized plan and passage cases, expected dimensions, and each named refusal.
 */
export function test_location_floor_plan(): void {
  const first: ReturnType<typeof AutoMovieArchetypeEnvironment.building> =
    AutoMovieArchetypeEnvironment.building({
      type: "levels",
      levels: [
        {
          id: "ground",
          rooms: {
            hall: { type: "rectangle", value: { x: 0, z: 0, width: 6, depth: 4 } },
            office: { type: "rectangle", value: { x: 6, z: 1, width: 3, depth: 2 } },
            courtyard: {
              type: "polygon",
              value: {
                vertices: [
                  { x: 0, z: 10 },
                  { x: 6, z: 10 },
                  { x: 6, z: 16 },
                  { x: 0, z: 16 },
                ],
                holes: [
                  [
                    { x: 2, z: 12 },
                    { x: 4, z: 12 },
                    { x: 4, z: 14 },
                    { x: 2, z: 14 },
                  ],
                ],
              },
            },
          },
          openings: [
            {
              id: "inside",
              kind: "passage",
              between: { from: "hall", to: "office" },
              width: 1,
              height: 2,
            },
            {
              id: "landing",
              kind: "passage",
              between: { from: "hall", to: null },
              edge: {
                from: { x: 0, z: 0 },
                to: { x: 0, z: 4 },
              },
              width: 1.4,
              height: 2.2,
            },
            {
              id: "entrance",
              kind: "door",
              between: { from: "hall", to: null },
              edge: {
                from: { x: 0, z: 0 },
                to: { x: 6, z: 0 },
              },
            },
          ],
        },
        {
          id: "upper",
          elevation: 3.4,
          rooms: { hall: { type: "rectangle", value: { x: 0, z: 0, width: 6, depth: 4 } } },
        },
      ],
      stairs: [
        {
          id: "main",
          from: { level: "ground", room: "hall" },
          to: { level: "upper", room: "hall" },
          run: {
            from: { x: 1, z: 1.5 },
            to: { x: 5, z: 1.5 },
          },
          width: 1,
          steps: 20,
        },
      ],
    });
  const second: ReturnType<typeof AutoMovieArchetypeEnvironment.building> =
    AutoMovieArchetypeEnvironment.building({
      type: "levels",
      levels: [
        {
          id: "ground",
          rooms: { hall: { type: "rectangle", value: { x: 0, z: 0, width: 6, depth: 4 } } },
          openings: [
            {
              id: "landing",
              kind: "passage",
              between: { from: "hall", to: null },
              edge: {
                from: { x: 6, z: 0 },
                to: { x: 6, z: 4 },
              },
              width: 1.4,
              height: 2.2,
            },
          ],
        },
      ],
    });
  const span: ReturnType<typeof AutoMovieArchetypeEnvironment.passage> =
    AutoMovieArchetypeEnvironment.passage({
      kind: "bridge",
      from: { opening: "east/ground/landing" },
      to: { opening: "west/ground/landing" },
      width: 1,
      clearHeight: 2,
    });
  const east: {
    use: ReturnType<typeof AutoMovieArchetypeEnvironment.building>;
    at: { x: number; y: number; z: number };
  } = { use: first, at: { x: 0, y: 3, z: 0 } };
  const west: typeof east = { use: second, at: { x: -8, y: 3, z: 0 } };
  const site: IAutoMovieEnvironment = AutoMovieArchetypeEnvironment.create({
    id: "walkway-test",
    items: { east, west, bridge: { use: span } },
  });
  const shell: IAutoMovieBuiltEnvironment = site.builtEnvironments[0]!;
  const seam: IAutoMovieBuiltBoundary[] = shell.boundaries.filter(
    (wall: IAutoMovieBuiltBoundary): boolean => {
      const face: IAutoMovieBuiltBoundary["face"] = wall.face;
      if (face === undefined || face.origin.x !== 6 || face.origin.y !== 3)
        return false;
      const end: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        face.origin,
        AutoMovieEngineQuaternion.rotateVector(face.rotation, {
          x: face.outline[1]!.x,
          y: 0,
          z: 0,
        }),
      );
      return nclose(end.x, 6) && face.origin.z >= 0 && end.z <= 4;
    },
  );
  TestValidator.equals(
    "one partition and two exterior remainders",
    seam
      .map((wall: IAutoMovieBuiltBoundary): number[] => [
        wall.spaces.length,
        wall.face!.outline[1]!.x,
      ])
      .sort((a: number[], b: number[]): number => a[0]! - b[0]!),
    [
      [1, 1],
      [1, 1],
      [2, 2],
    ],
  );
  const space: IAutoMovieSpace = site.stage.space!;
  TestValidator.equals(
    "support observes the courtyard void, surrounding floor and skybridge",
    [
      AutoMovieEngineSpace.heightAt(space, 3, 13),
      AutoMovieEngineSpace.heightAt(space, 1, 13),
      AutoMovieEngineSpace.heightAt(space, -1, 2),
    ],
    [null, 3, 3],
  );
  TestValidator.equals(
    "only an open threshold supports a performer in a wall",
    [
      AutoMovieEngineSpace.heightAt(space, 6, 1.2),
      AutoMovieEngineSpace.heightAt(space, 6, 2),
      AutoMovieEngineSpace.heightAt(space, 3, 0),
    ],
    [null, 3, null],
  );
  const door: IAutoMoviePropSpec | undefined = site.runtime.props.find(
    (prop: IAutoMoviePropSpec): boolean =>
      prop.node === "walkway-test/east/ground/entrance",
  );
  TestValidator.equals(
    "both lever contacts ride the staged leaf root",
    door?.model.affordances?.map((contact): string => contact.id).sort(),
    ["pull", "push"],
  );
  const tread: number | null = AutoMovieEngineSpace.heightAt(space, 2.1, 1.5);
  const upper: number | null = AutoMovieEngineSpace.heightAt(space, 2.1, 3);
  TestValidator.predicate(
    "shaft leaves the sixth tread and upper floor independently supported",
    tread !== null &&
      nclose(tread, 4.02) &&
      upper !== null &&
      nclose(upper, 6.4),
  );
  assert.throws(
    (): IAutoMovieEnvironment =>
      AutoMovieArchetypeEnvironment.create({
        id: "displaced",
        items: {
          east,
          west: { ...west, at: { x: -8, y: 4, z: 0 } },
          bridge: { use: span },
        },
      }),
    /west\/ground\/landing.*level landings/,
  );
  assert.throws(
    (): IAutoMovieEnvironment =>
      AutoMovieArchetypeEnvironment.create({
        id: "overwide",
        items: {
          east,
          west,
          bridge: {
            use: AutoMovieArchetypeEnvironment.passage({
              kind: "bridge",
              from: { opening: "east/ground/landing" },
              to: { opening: "west/ground/landing" },
              width: 1.5,
            }),
          },
        },
      }),
    /does not fit the clear section of opening "east\/ground\/landing"/,
  );
  assert.throws(
    (): IAutoMovieEnvironment =>
      AutoMovieArchetypeEnvironment.create({
        id: "oblique",
        items: {
          east,
          west: { ...west, at: { x: -8, y: 3, z: 3 } },
          bridge: { use: span },
        },
      }),
    /passage "oblique\/bridge" must approach opening "east\/ground\/landing" perpendicular/,
  );
  assert.throws(
    (): ReturnType<typeof AutoMovieArchetypeEnvironment.building> =>
      AutoMovieArchetypeEnvironment.building({
        type: "levels",
        levels: [{ id: "ground", rooms: { a: { type: "rectangle", value: { x: 0, z: 0, width: 4, depth: 4 } }, b: { type: "rectangle", value: { x: 3, z: 3, width: 2, depth: 2 } } } }],
      }),
    /rooms "a" and "b" have overlapping interiors/,
  );
}
