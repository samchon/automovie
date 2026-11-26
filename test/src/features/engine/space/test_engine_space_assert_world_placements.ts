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
 * World placement admits independent authored boxes, supports and routes.
 *
 * Scenarios:
 *
 * 1. A flat ground and a raised platform support the corresponding bases.
 * 2. An edge point and a point on a route are reachable under their own rule.
 * 3. Overlap, overhang, a float, widened route obstruction and an unreachable
 *    landmark each produce their own refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names support, reachability and the five independent contradictions.
 * @evidence contracts/development/testing.md#behavioral-verification Calls assertWorldPlacements on authored bounds, support and routes, admitting valid combinations and checking each invalid case's diagnostic. A lost widening, support or reachability check fails.
 * @evidence contracts/development/testing.md#independent-expectations Exact box corners place the base at 0 or 1 m. The 0.5 m half-width cannot support the 2 m box and the route at z=1.25 clears z=2 before its 1 m widening. Exact coordinates separate the acceptance and refusal regions.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers flat, raised, edge-only and route-only support and independently distinguishes overlapping, overhanging, hovering, blocked and unreachable records.
 * @evidence contracts/development/testing.md#execution-ownership The named synchronous test owns resident box bounds, support records, route polylines and landmarks and calls the direct world placement admission function.
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
