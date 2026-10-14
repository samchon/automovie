import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createAutoMovieMeshDepthSampler } from "@automovie/engine";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Axis-aligned attachment depths come from resident triangles and survive
 * winding, index layout and caller mutation rather than an inferred ellipsoid.
 *
 * Scenarios:
 * 1. Two parallel triangular planes with depth u+2v and u+2v+3 produce the
 *    independent interval [1.25,4.25] at (0.25,0.5), in all three axes.
 * 2. Edges/corners are included; exterior, triangle-exterior, empty-grid-cell,
 *    empty-mesh and edge-on-face queries return null. Winding is immaterial.
 * 3. Editing caller buffers cannot change a built sampler; nonindexed input
 *    produces the same intersections as indexed triangles.
 * 4. Incomplete/nonfinite/out-of-range buffers, unknown axes, unrepresentable
 *    projected arithmetic and nonfinite queries are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds and queries actual resident depth samplers, asserting plane intervals, inclusive edges/corners, null misses, copied buffer ownership, implicit-index equivalence and malformed/overflow refusals. It catches inferred-shape depths or hierarchy cells that lose actual triangles.
 * @evidence contracts/testing.md#independent-expectations The authored planes are d=u+2*v and d=u+2*v+3, giving [1.25,4.25] at (.25,.5) and the listed integer corner/edge intervals. Exterior and edge-on projections have no isolated intersection. This surface envelope does not prove a filled solid, exact contact everywhere or rendered alignment; projection-boundary slack remains an implementation policy.
 * @evidence contracts/testing.md#distinguishing-cases Keeps all three axes, reversed winding, indexed/nonindexed input, corners/edges/grid boundary, exterior and triangle-exterior misses, empty cells/meshes, edge-on faces, source mutation and every existing malformed/overflow/query refusal. Clearance ordering between two surfaces is covered elsewhere.
 * @evidence contracts/testing.md#execution-ownership The named entry directly invokes portable sampler source using unchanged synthetic buffers and exception observers. It installs no consumer, starts no process, browser or GPU, builds no native artifact and dynamically registers no cases.
 */
export function test_geometry_mesh_depth_sampler(): void {
  const mesh: (
    positions: number[],
    indices: number[] | null,
  ) => IAutoMovieMesh = (
    positions: number[],
    indices: number[] | null,
  ): IAutoMovieMesh => ({
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const uvDepth: number[][] = [
    [0, 0, 0],
    [2, 0, 2],
    [0, 2, 4],
    [0, 0, 3],
    [2, 0, 5],
    [0, 2, 7],
  ];
  for (const axis of ["x", "y", "z"] as const) {
    const positions: number[] = uvDepth.flatMap(
      ([u, v, d]: number[]): number[] =>
        axis === "x" ? [d, u, v] : axis === "y" ? [v, d, u] : [u, v, d],
    );
    const input: IAutoMovieMesh = mesh(positions, [0, 1, 2, 5, 4, 3]);
    const sample: (
      u: number,
      v: number,
    ) => { minimum: number; maximum: number } | null =
      createAutoMovieMeshDepthSampler(input, axis);
    const value: { minimum: number; maximum: number } | null = sample(
      0.25,
      0.5,
    );
    TestValidator.predicate(
      "independent two-plane intersection",
      value !== null &&
        nclose(value.minimum, 1.25) &&
        nclose(value.maximum, 4.25),
    );
    TestValidator.predicate(
      "vertex included",
      equalGeometryTestValues(sample(0, 0), {
        minimum: 0,
        maximum: 3,
      }),
    );
    TestValidator.predicate(
      "outer grid boundary included",
      equalGeometryTestValues(sample(2, 0), {
        minimum: 2,
        maximum: 5,
      }),
    );
    TestValidator.predicate(
      "triangle edge included",
      equalGeometryTestValues(sample(1, 1), {
        minimum: 3,
        maximum: 6,
      }),
    );
    for (const [u, v] of [
      [-1, 0],
      [3, 0],
      [0, -1],
      [0, 3],
      [1.75, 1.75],
    ])
      TestValidator.equals(
        "query misses projected triangle",
        sample(u, v),
        null,
      );
    input.positions.fill(900);
    input.indices!.fill(0);
    TestValidator.predicate(
      "sampler owns source values",
      equalGeometryTestValues(sample(0, 0), {
        minimum: 0,
        maximum: 3,
      }),
    );
    for (const [u, v] of [
      [NaN, 0],
      [0, Infinity],
    ])
      TestValidator.predicate(
        "invalid query refused",
        throwsError(
          (): { minimum: number; maximum: number } | null => sample(u, v),
          "Surface query coordinates must be finite",
        ),
      );
  }
  const triangle: number[] = [0, 0, 0, 2, 0, 2, 0, 2, 4];
  const tilted: (
    u: number,
    v: number,
  ) => { minimum: number; maximum: number } | null =
    createAutoMovieMeshDepthSampler(
      mesh([1, 0, 0, 0, 2, 0, 2, 2, 0], null),
      "z",
    );
  TestValidator.equals("outside left triangle edge", tilted(0.1, 0.1), null);
  TestValidator.equals("outside right triangle edge", tilted(1.9, 0.1), null);
  const verticalExtent: IAutoMovieMesh = mesh(
    [
      0,
      Number.MAX_VALUE,
      0,
      0,
      Number.MAX_VALUE * 0.999999999999999,
      0,
      1e-308,
      Number.MAX_VALUE,
      0,
      0,
      -Number.MAX_VALUE,
      0,
      0,
      -Number.MAX_VALUE * 0.999999999999999,
      0,
      1e-308,
      -Number.MAX_VALUE,
      0,
    ],
    null,
  );
  TestValidator.predicate(
    "unrepresentable vertical extent",
    throwsError(
      (): ((
        u: number,
        v: number,
      ) => { minimum: number; maximum: number } | null) =>
        createAutoMovieMeshDepthSampler(verticalExtent, "z"),
      "Projected mesh extent",
    ),
  );
  const extremeDepth: (
    u: number,
    v: number,
  ) => { minimum: number; maximum: number } | null =
    createAutoMovieMeshDepthSampler(
      mesh(
        [
          0,
          0,
          Number.MAX_VALUE,
          1,
          0,
          Number.MAX_VALUE,
          0,
          1,
          Number.MAX_VALUE,
          2,
          0,
          0,
          2,
          1,
          0,
          1,
          1,
          0,
        ],
        null,
      ),
      "z",
    );
  TestValidator.predicate(
    "unrepresentable interpolated depth",
    throwsError(
      (): { minimum: number; maximum: number } | null =>
        extremeDepth(1 + 1e-11, 0),
      "Interpolated surface depth",
    ),
  );
  TestValidator.predicate(
    "nonindexed triangle",
    equalGeometryTestValues(
      createAutoMovieMeshDepthSampler(mesh(triangle, null), "z")(0.25, 0.5),
      { minimum: 1.25, maximum: 1.25 },
    ),
  );
  const sparse: IAutoMovieMesh = mesh(
    [...triangle, 10, 10, 0, 11, 10, 0, 10, 11, 0],
    null,
  );
  TestValidator.equals(
    "empty spatial bin",
    createAutoMovieMeshDepthSampler(sparse, "z")(5, 5),
    null,
  );
  for (const source of [
    mesh([], null),
    mesh([0, 0, 0, 0, 1, 0, 0, 1, 1], null),
  ])
    TestValidator.equals(
      "no isolated projected triangles",
      createAutoMovieMeshDepthSampler(source, "z")(0, 0.5),
      null,
    );
  for (const [caseIndex, source] of [
    mesh([0], null),
    mesh([0, 0, 0], null),
    mesh(triangle, [0, 1]),
    mesh([NaN, 0, 0, 2, 0, 2, 0, 2, 4], null),
    ...[-1, 0.5, 3].map(
      (id: number): IAutoMovieMesh => mesh(triangle, [0, 1, id]),
    ),
    mesh([0, 0, 0, Number.MAX_VALUE, 0, 0, 0, Number.MAX_VALUE, 0], null),
    mesh(
      [
        Number.MAX_VALUE,
        0,
        0,
        Number.MAX_VALUE * 0.999999999999999,
        0,
        0,
        Number.MAX_VALUE,
        1e-308,
        0,
        -Number.MAX_VALUE,
        0,
        0,
        -Number.MAX_VALUE * 0.999999999999999,
        0,
        0,
        -Number.MAX_VALUE,
        1e-308,
        0,
      ],
      null,
    ),
  ].entries())
    TestValidator.predicate(
      "invalid triangle input refused",
      throwsError(
        (): ((
          u: number,
          v: number,
        ) => { minimum: number; maximum: number } | null) =>
          createAutoMovieMeshDepthSampler(source, "z"),
        caseIndex < 7 ? "Depth sampling" : "Projected",
      ),
    );
  TestValidator.predicate(
    "invalid axis refused",
    throwsError(
      (): ((
        u: number,
        v: number,
      ) => { minimum: number; maximum: number } | null) =>
        createAutoMovieMeshDepthSampler(mesh(triangle, null), "bad" as "x"),
      "depth sampling axis",
    ),
  );
}
