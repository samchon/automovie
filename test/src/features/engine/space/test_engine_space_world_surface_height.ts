import { AutoMovieEngineWorld } from "@automovie/engine";
import type { IAutoMovieWorldSurface } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * Read world heights from resident surface records.
 *
 * Scenarios:
 *
 * 1. An offset lattice interpolates on both axes and clamps at the edges.
 * 2. Constant, plane, and incomplete heightfield records return known heights.
 * 3. Ground selection retains declaration order, edges, corners and absence.
 * 4. A rounded sample position reads its own height, and the intervals on either
 *    side interpolate over their represented widths.
 * 5. Cancellation at a large offset can misidentify a cell. Opposite finite
 *    extreme samples still interpolate to zero at their center.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names constant, planar, and lattice reads, clamping, missing samples, precision cases, and first-containing ground selection.
 * @evidence contracts/development/testing.md#behavioral-verification Passes typed resident surface records to `surfaceHeight`, `groundSurface`, and `groundHeight`. The queries exercise corners, off-grid clamping, a missing sample, large magnitudes, swapped ground order, a footprint edge and corner, and empty or absent ground.
 * @evidence contracts/development/testing.md#independent-expectations The (-4, -6) grid with 10 m pitches and samples 0, 1, 4, and 10 has center 3.75 and edge means 0.5 and 2. Opposite finite extremes cancel at the midpoint. The represented knot offsets around 2^53 yield exact values 18, 6, 11, and 40. At X -11/8 the local cell fraction rounds to 1 - 2^-53, yielding 2^53 - 1.
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
      originX: -4,
      originZ: -6,
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
  const limit: number = Number.MAX_VALUE;
  const opposing: IAutoMovieWorldSurface = {
    ...asymmetric,
    id: "opposing",
    height: {
      kind: "heightfield",
      originX: 0,
      originZ: 0,
      spacingX: 1,
      spacingZ: 1,
      columns: 2,
      rows: 2,
      samples: [-limit, limit, -limit, limit],
    },
  };
  // The binary64 spacing at 2^53 m is two metres. A three-metre pitch
  // rounds to opposite sides of its midpoint on the two offset axes.
  const coarseOrigin: number = 2 ** 53;
  const rounded: IAutoMovieWorldSurface = {
    ...asymmetric,
    id: "rounded-knots",
    height: {
      kind: "heightfield",
      originX: coarseOrigin,
      originZ: coarseOrigin + 2,
      spacingX: 3,
      spacingZ: 3,
      columns: 3,
      rows: 3,
      samples: [0, 12, 24, 6, 18, 30, 16, 28, 40],
    },
  };
  // The first four world knots are -2^53, -2^52, -1, and 2^52 - 2.
  // At -11/8, subtracting the global origin rounds to 2^53 - 1 and
  // estimates cell 2 even though the query is in cell 1. The local
  // fraction is (2^52 - 1.5) / (2^52 - 1), rounded to 1 - 2^-53.
  const correctedCell: IAutoMovieWorldSurface = {
    ...asymmetric,
    id: "rounded-cell-estimate",
    height: {
      kind: "heightfield",
      originX: -coarseOrigin,
      originZ: 0,
      spacingX: 2 ** 52 - 0.5,
      spacingZ: 1,
      columns: 4,
      rows: 2,
      samples: [0, 0, coarseOrigin, 0, 0, 0, coarseOrigin, 0],
    },
  };
  const cases: readonly [
    IAutoMovieWorldSurface,
    readonly (readonly [number, number, number])[],
  ][] = [
    [
      asymmetric,
      [
        [-4, -6, 0],
        [6, -6, 1],
        [-4, 4, 4],
        [6, 4, 10],
        [1, -1, 3.75],
        [-4, -1, 2],
        [1, -6, 0.5],
        [-19, -21, 0],
        [21, 19, 10],
        [-19, -1, 2],
        [1, -21, 0.5],
        [21, -6, 1],
        [-4, -21, 0],
        [-19, 19, 4],
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
    [
      opposing,
      [
        [0, 0, -limit],
        [1, 0, limit],
        [0.5, 0.5, 0],
      ],
    ],
    [
      rounded,
      [
        [coarseOrigin + 4, coarseOrigin + 4, 18],
        [coarseOrigin + 2, coarseOrigin + 2, 6],
        [coarseOrigin, coarseOrigin + 6, 11],
        [coarseOrigin + 8, coarseOrigin + 10, 40],
      ],
    ],
    [correctedCell, [[-11 / 8, 0, coarseOrigin - 1]]],
  ];
  for (const [surface, queries] of cases)
    for (const [x, z, expected] of queries)
      TestValidator.predicate(
        `${surface.id} at (${x}, ${z})`,
        nclose(
          AutoMovieEngineWorld.surfaceHeight(surface, { x, z }),
          expected,
          0,
        ),
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
    AutoMovieEngineWorld.groundSurface([step, flat], { x: 0, z: 0 }) === step &&
      AutoMovieEngineWorld.groundSurface([flat, step], { x: 0, z: 0 }) ===
        flat &&
      AutoMovieEngineWorld.groundHeight([step, flat], { x: 0, z: 0 }) === 1.5,
  );
  TestValidator.predicate(
    "an edge and corner count as ground, while absence stays null",
    AutoMovieEngineWorld.groundSurface([step], { x: 2, z: 0 }) === step &&
      AutoMovieEngineWorld.groundSurface([step], { x: -2, z: 2 }) === step &&
      AutoMovieEngineWorld.groundSurface([step], { x: 40, z: 0 }) === null &&
      AutoMovieEngineWorld.groundHeight([step], { x: 40, z: 0 }) === null &&
      AutoMovieEngineWorld.groundHeight([], { x: 0, z: 0 }) === null,
  );
}
