import { AutoMovieEngineWorld } from "@automovie/engine";
import type {
  IAutoMovieAssertWorldPlacements,
  IAutoMovieModel,
  IAutoMovieVector3,
  IAutoMovieWorldBlock,
  IAutoMovieWorldLandmark,
  IAutoMovieWorldRoute,
  IAutoMovieWorldSurface,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/** A typed model reference for validation, which consumes only the box bounds. */
const model: IAutoMovieModel = {
  id: "mass",
  name: null,
  origin: "generated",
  parts: [],
  skeleton: null,
  body: null,
  materials: [],
  asset: null,
};

/** A static occupied box with explicit world-space corners. */
function box(
  id: string,
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
): IAutoMovieWorldBlock {
  return {
    id,
    kind: "building",
    model,
    node: {
      id,
      model: model.id,
      transform: {
        translation: {
          x: (min.x + max.x) / 2,
          y: (min.y + max.y) / 2,
          z: (min.z + max.z) / 2,
        },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      motion: null,
      pose: null,
    },
    bounds: { min, max },
  };
}

/** A flat, square support centered at (3, 3) in the world XZ plane. */
function surface(
  id: string,
  half: number,
  height: number,
): IAutoMovieWorldSurface {
  return {
    id,
    polygon: [
      { x: 3 - half, z: 3 - half },
      { x: 3 + half, z: 3 - half },
      { x: 3 + half, z: 3 + half },
      { x: 3 - half, z: 3 + half },
    ],
    height: { kind: "constant", value: height },
    walkable: true,
  };
}

/**
 * World placement checks the support of box bases, route clearance, and
 * landmark access through either walkable terrain or a route.
 *
 * Scenarios:
 *
 * 1. A flat ground and a raised platform support the corresponding bases.
 * 2. A landmark on a ground edge and a landmark on a route each pass.
 * 3. Overlap, overhang, a float, widened route obstruction and an unreachable
 *    landmark each produce their own refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes two supported base heights, access at a ground edge or along a route, and five distinct reasons to refuse placement.
 * @evidence contracts/development/testing.md#behavioral-verification Passes explicit box bounds, support polygons, route segments, and landmarks to `AutoMovieEngineWorld.assertPlacements`. The valid arrangements complete and each isolated contradiction throws its expected diagnostic.
 * @evidence contracts/development/testing.md#independent-expectations The block spans X and Z from 2 to 4 m, so a square support from 2.5 to 3.5 m misses its corners. The elevated base at 1 m needs the platform. The road at Z 0 clears the block with its 1 m padding, while Z 1.25 enters the padded footprint starting at Z 1. The point at X 11 is exactly on the ground's edge.
 */
export function test_engine_space_assert_world_placements(): void {
  const a: IAutoMovieWorldBlock = box(
    "house",
    { x: 2, y: 0, z: 2 },
    { x: 4, y: 2, z: 4 },
  );
  const b: IAutoMovieWorldBlock = box(
    "wall",
    { x: 6, y: 0, z: 2 },
    { x: 7, y: 2, z: 4 },
  );
  const elevated: IAutoMovieWorldBlock = box(
    "deck-house",
    { x: 2, y: 1, z: 2 },
    { x: 4, y: 3, z: 4 },
  );
  const ground: IAutoMovieWorldSurface = surface("ground", 8, 0);
  const platform: IAutoMovieWorldSurface = surface("platform", 2, 1);
  const road: IAutoMovieWorldRoute = {
    id: "road",
    waypoints: [
      { x: 0, z: 0 },
      { x: 3, z: 0 },
      { x: 8, z: 0 },
    ],
    allowedFormationWidth: 2,
  };
  const mark: IAutoMovieWorldLandmark = {
    id: "square",
    position: { x: 3, y: 0, z: 3 },
    radius: 0,
    meaning: "A point claimed by ground or a route.",
  };
  const empty: IAutoMovieAssertWorldPlacements.IInput = {
    blocks: [],
    surfaces: [],
    routes: [],
    landmarks: [],
  };
  AutoMovieEngineWorld.assertPlacements({
    blocks: [a, b],
    surfaces: [ground],
    routes: [road],
    landmarks: [mark],
  });
  AutoMovieEngineWorld.assertPlacements({
    ...empty,
    blocks: [elevated],
    surfaces: [ground, platform],
  });
  AutoMovieEngineWorld.assertPlacements({
    ...empty,
    surfaces: [ground],
    landmarks: [{ ...mark, position: { x: 11, y: 0, z: 3 } }],
  });
  AutoMovieEngineWorld.assertPlacements({
    ...empty,
    routes: [road],
    landmarks: [{ ...mark, position: { x: 3, y: 0, z: 0 } }],
  });

  const rejected: readonly [IAutoMovieAssertWorldPlacements.IInput, string][] =
    [
      [
        { ...empty, blocks: [a, { ...a, id: "overlap" }], surfaces: [ground] },
        "overlap",
      ],
      [
        { ...empty, blocks: [a], surfaces: [surface("tiny", 0.5, 0)] },
        "floats or lacks a supporting surface",
      ],
      [
        { ...empty, blocks: [elevated], surfaces: [ground] },
        "floats or lacks a supporting surface",
      ],
      [
        {
          ...empty,
          blocks: [a],
          surfaces: [ground],
          routes: [
            {
              ...road,
              waypoints: [
                { x: 0, z: 1.25 },
                { x: 8, z: 1.25 },
              ],
            },
          ],
        },
        "is blocked by",
      ],
      [{ ...empty, landmarks: [mark] }, "is unreachable from walkable terrain"],
    ];
  for (const [input, error] of rejected)
    TestValidator.predicate(
      `the invalid placement ${input.blocks[0]?.id ?? input.landmarks[0]?.id} ${error}`,
      throwsError(() => AutoMovieEngineWorld.assertPlacements(input), error),
    );
}
