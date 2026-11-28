import {
  AutoMovieEngineCurve,
  AutoMovieEngineGeometry,
} from "@automovie/engine";
import type {
  IAutoMovieCubicBezierCurve64,
  IAutoMovieMesh,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Length and spatial measurements reject invalid numbers at their owning
 * boundaries while retaining valid curve, convex hull, and mesh results.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names physical integration, projection enclosures, winding, typed feature buffers and pure topology identifiers.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the five public boundaries with valid authored examples and independently malformed panels, points, directions, positions, reach and indices. Covers both ArrayLike typed buffers and large geometry-free identities.
 * @evidence contracts/development/testing.md#independent-expectations Unit-speed linear cubic length is one millimetre. Two points separated by two metres along X admit a positive conservative bound and zero direction proves nothing. A closed outward tetrahedron winds once around its interior. Two correctly wound perpendicular triangles meeting at the authored edge give one concave feature. An oriented loop around one triangle selects its original ordinal.
 */
export function test_engine_geometry_numeric_query_admission(): void {
  const curve = AutoMovieEngineCurve;
  const geometry = AutoMovieEngineGeometry;
  const line: IAutoMovieCubicBezierCurve64 = {
    type: "cubicBezier",
    name: "unit-line",
    closed: false,
    unit: "mm",
    phaseUnit: "normalized",
    phaseIntervals: [1],
    spans: [
      [
        [0, 0, 0],
        [1 / 3, 0, 0],
        [2 / 3, 0, 0],
        [1, 0, 0],
      ],
    ],
  };
  TestValidator.equals(
    "unit-speed cubic length",
    curve.measureCubicCurveLength64(line),
    { lengthMm: 1, differenceMm: 0 },
  );
  TestValidator.predicate(
    "largest admitted panel count",
    Math.abs(curve.measureCubicCurveLength64(line, 1024).lengthMm - 1) < 1e-12,
  );
  for (const panels of [1.5, NaN, Infinity])
    TestValidator.predicate(
      "invalid panel count",
      throwsError(
        () => curve.measureCubicCurveLength64(line, panels),
        "integer in [1,1024]",
      ),
    );
  const large = Number.MAX_VALUE;
  TestValidator.predicate(
    "nonfinite integrated result from finite coefficients",
    throwsError(
      () =>
        curve.measureCubicCurveLength64({
          ...line,
          spans: [
            [
              [-large, 0, 0],
              [large, 0, 0],
              [-large, 0, 0],
              [large, 0, 0],
            ],
          ],
        }),
      "Cubic speed integration overflow",
    ),
  );

  const a = [{ x: 0, y: 0, z: 0 }];
  const b = [{ x: 2, y: 0, z: 0 }];
  const direction = { x: 1, y: 0, z: 0 };
  const bound = geometry.boundProjectionSeparation(a, b, direction);
  TestValidator.predicate(
    "conservative two-metre separation",
    bound > 1.99 && bound <= 2,
  );
  TestValidator.equals(
    "touching and zero-direction sentinels",
    [
      geometry.boundProjectionSeparation(a, a, direction),
      geometry.boundProjectionSeparation(a, b, { x: -0, y: 0, z: 0 }),
    ],
    [0, 0],
  );
  for (const [left, raw] of [
    [[{ x: 0, y: NaN, z: 0 }], direction],
    [a, { ...direction, z: NaN }],
    [[{ x: 0, y: 0, z: Infinity }], { x: 0, y: 0, z: 0 }],
  ] as const)
    TestValidator.predicate(
      "nonfinite projection coordinate refuses before inactive directions",
      throwsError(
        () => geometry.boundProjectionSeparation(left, b, raw),
        "nonempty finite points and direction",
      ),
    );

  const positions: number[] = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
  const tetraIndices: number[] = [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3];
  const triangle: IAutoMovieMesh = {
    positions: positions.slice(0, 9),
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
  const tetra: IAutoMovieMesh = {
    ...triangle,
    positions,
    indices: tetraIndices,
  };
  const open = geometry.createMeshWindingQuery(triangle);
  const near = open([0.2, 0.2, 1]);
  TestValidator.predicate(
    "oriented open triangle",
    near.winding < 0 && near.winding > -0.5 && !near.inside && !near.surface,
  );
  const inside = geometry.createMeshWindingQuery(tetra)([0.1, 0.1, 0.1]);
  TestValidator.predicate(
    "closed tetrahedron winds once",
    Math.abs(inside.winding - 1) < 1e-15 && inside.inside && !inside.surface,
  );
  TestValidator.equals("representable far point", open([0.2, 0.2, 1e200]), {
    winding: 0,
    surface: false,
    inside: false,
  });
  TestValidator.predicate(
    "nonfinite winding snapshot",
    throwsError(
      () =>
        geometry.createMeshWindingQuery({
          ...triangle,
          positions: [NaN, ...triangle.positions.slice(1)],
        }),
      "finite mesh positions",
    ),
  );
  const hole = new Array<number>(3);
  hole[0] = 0;
  hole[2] = 2;
  for (const point of [[NaN, 0.2, 1], [0.2, Infinity, 1], hole])
    TestValidator.predicate(
      "nonfinite or missing query coordinate",
      throwsError(() => open(point), "finite XYZ coordinates"),
    );

  const feature = {
    positions: new Float32Array(positions),
    indices: new Uint16Array([0, 1, 2, 1, 0, 3]),
    reach: 0.1,
  };
  const measured = geometry.measureFeatureEdges(feature);
  TestValidator.equals("one concave shared edge from typed indices", measured, {
    edges: [
      { a: { x: 0, y: 0, z: 0 }, b: { x: 1, y: 0, z: 0 }, convex: false },
    ],
    triangles: [[0], [0]],
    reach: 0.1,
  });
  for (const reach of [NaN, Infinity])
    TestValidator.predicate(
      "nonfinite feature reach",
      throwsError(
        () => geometry.measureFeatureEdges({ ...feature, reach }),
        "reach must be finite",
      ),
    );
  TestValidator.predicate(
    "incomplete feature rows",
    throwsError(
      () => geometry.measureFeatureEdges({ ...feature, indices: [0, 1, 2, 3] }),
      "complete triples",
    ),
  );
  TestValidator.predicate(
    "nonfinite feature positions",
    throwsError(
      () =>
        geometry.measureFeatureEdges({
          ...feature,
          positions: [NaN, ...positions.slice(1)],
        }),
      "finite XYZ coordinates",
    ),
  );
  for (const indices of [[0.5, 1, 2], hole])
    TestValidator.predicate(
      "invalid feature vertex address",
      throwsError(
        () => geometry.measureFeatureEdges({ ...feature, indices }),
        "index out of range",
      ),
    );

  const highest = Number.MAX_SAFE_INTEGER;
  const boundary = [highest - 2, highest - 1, highest];
  TestValidator.equals(
    "admitted open surface identities and closed boundary",
    [
      geometry.selectTriangleRegion({ indices: boundary, boundary }),
      geometry.selectTriangleRegion({
        indices: tetraIndices,
        boundary: [0, 2, 1],
      }),
    ],
    [[0], [0]],
  );
  for (const indices of [[0.5, 1, 2], [0, Infinity, 2], hole])
    TestValidator.predicate(
      "invalid triangle region identity",
      throwsError(
        () => geometry.selectTriangleRegion({ indices, boundary: [0, 1, 2] }),
        "nonnegative safe integer indices",
      ),
    );
  TestValidator.predicate(
    "invalid boundary identity in valid triangle region",
    throwsError(
      () =>
        geometry.selectTriangleRegion({
          indices: [0, 1, 2],
          boundary: [0, 1, 1.5],
        }),
      "nonnegative safe integer indices",
    ),
  );
}
