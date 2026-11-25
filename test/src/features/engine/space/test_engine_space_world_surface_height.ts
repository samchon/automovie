import {
  worldGroundHeight,
  worldGroundSurface,
  worldSurfaceHeight,
} from "@automovie/engine";
import type { IAutoMovieWorldSurface } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * Read world heights from resident surface records.
 *
 * Scenarios:
 *
 * 1. Asymmetric samples interpolate on both axes and clamp at the edges.
 * 2. Constant, plane, and incomplete heightfield records return known heights.
 * 3. Ground selection retains declaration order, edges, corners and absence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sampling, incomplete-corner and ground-selection contracts for resident surfaces.
 * @evidence contracts/development/testing.md#behavioral-verification Reads authored constant, plane and lattice rules through the world API, then checks ordered support, edge admission and null absence.
 * @evidence contracts/development/testing.md#independent-expectations Literal heights 0/1/4/10 give center 3.75, edge means 0.5 and 2, and distinct corners. Plane, sparse corner and first-match expectations are explicit.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all four stored corners, both blend axes, each off-lattice direction, missing samples and overlapping, edge-only or absent ground.
 * @evidence contracts/development/testing.md#execution-ownership Uses typed surface records without calling any producer, materializer or external host.
 */
export function test_engine_space_world_surface_height(): void {
  const flat: IAutoMovieWorldSurface = {
    id: "floor",
    polygon: [
      { x: -8, z: -8 },
      { x: 8, z: -8 },
      { x: 8, z: 8 },
      { x: -8, z: 8 },
    ],
    height: { kind: "constant", value: 2.5 },
    walkable: true,
  };
  const ramp: IAutoMovieWorldSurface = {
    ...flat,
    id: "ramp",
    height: { kind: "plane", originHeight: 1, slopeX: 0, slopeZ: 0.5 },
  };
  const asymmetric: IAutoMovieWorldSurface = {
    ...flat,
    id: "lattice",
    height: {
      kind: "heightfield",
      originX: 0,
      originZ: 0,
      spacingX: 10,
      spacingZ: 10,
      columns: 2,
      rows: 2,
      samples: [0, 1, 4, 10],
    },
  };
  const sparse: IAutoMovieWorldSurface = {
    ...asymmetric,
    id: "sparse",
    height: {
      kind: "heightfield",
      originX: 0,
      originZ: 0,
      spacingX: 10,
      spacingZ: 10,
      columns: 2,
      rows: 2,
      samples: [3],
    },
  };
  const cases: readonly [
    IAutoMovieWorldSurface,
    readonly (readonly [number, number, number])[],
  ][] = [
    [
      asymmetric,
      [
        [0, 0, 0],
        [10, 0, 1],
        [0, 10, 4],
        [10, 10, 10],
        [5, 5, 3.75],
        [0, 5, 2],
        [5, 0, 0.5],
        [-15, -15, 0],
        [25, 25, 10],
        [-15, 5, 2],
        [5, -15, 0.5],
        [25, 0, 1],
        [0, -15, 0],
        [-15, 25, 4],
      ],
    ],
    [
      flat,
      [
        [3, -3, 2.5],
        [-1, 4, 2.5],
      ],
    ],
    [
      ramp,
      [
        [0, 0, 1],
        [0, 10, 6],
        [2, 5, 3.5],
      ],
    ],
    [
      sparse,
      [
        [0, 0, 3],
        [10, 10, 0],
        [5, 0, 1.5],
      ],
    ],
  ];
  for (const [surface, queries] of cases)
    for (const [x, z, expected] of queries)
      TestValidator.predicate(
        `${surface.id} at (${x}, ${z})`,
        nclose(worldSurfaceHeight(surface, { x, z }), expected, 0),
      );

  const step: IAutoMovieWorldSurface = {
    ...flat,
    id: "step",
    polygon: [
      { x: -2, z: -2 },
      { x: 2, z: -2 },
      { x: 2, z: 2 },
      { x: -2, z: 2 },
    ],
    height: { kind: "constant", value: 1.5 },
  };
  TestValidator.predicate(
    "the first declared containing surface supplies the height",
    worldGroundSurface([step, flat], { x: 0, z: 0 }) === step &&
      worldGroundSurface([flat, step], { x: 0, z: 0 }) === flat &&
      worldGroundHeight([step, flat], { x: 0, z: 0 }) === 1.5,
  );
  TestValidator.predicate(
    "an edge and corner count as ground, while absence stays null",
    worldGroundSurface([step], { x: 2, z: 0 }) === step &&
      worldGroundSurface([step], { x: -2, z: 2 }) === step &&
      worldGroundSurface([step], { x: 40, z: 0 }) === null &&
      worldGroundHeight([step], { x: 40, z: 0 }) === null &&
      worldGroundHeight([], { x: 0, z: 0 }) === null,
  );
}
