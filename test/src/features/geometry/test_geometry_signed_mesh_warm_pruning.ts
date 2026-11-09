import {
  type IAutoMovieSignedMeshQueryHit,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { closestTriangleDistanceSquaredOracle } from "../internal/closestTriangleDistanceSquaredOracle";
import { createSignedOctahedron } from "../internal/createSignedMeshFixture";
import { nclose } from "../internal/predicates";

/** Independent XY triangles give analytic plane ties and separated XYZ boxes. */
function sheets(): IAutoMovieMesh {
  const positions: number[] = [
    0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 1, 0, 2, 0, 1, 2,
  ];
  for (let index: number = 1; index <= 13; index++) {
    const x: number = 10 * index;
    const y: number = 3 * index;
    const z: number = 5 * index;
    positions.push(x, y, z, x + 1, y, z, x, y + 1, z);
  }
  return {
    positions,
    indices: Array.from(
      { length: positions.length / 3 },
      (_: unknown, index: number): number => index,
    ),
    normals: null,
    uvs: null,
    skin: null,
  };
}

/**
 * Current-point warm starts and strict box pruning preserve nearest witnesses,
 * including equal-distance candidates with lower original ordinals.
 *
 * Scenarios:
 * 1. A higher-ordinal open face is warmed at a different point, then an exact
 *    plane/edge/vertex tie must choose the lower ordinal and correct sign/rim.
 * 2. Fifteen separated sheets exercise multiple hierarchy leaves and abrupt
 *    current-point changes; every distance and witness matches an exhaustive
 *    independent triangle oracle in both traversal sequences.
 * 3. A mutable query point is reread on each call. Mutating the original mesh
 *    or a returned hit cannot change the retained immutable surface snapshot.
 * 4. A closed octahedron retains its analytic center tie, exterior vertex,
 *    surface boundary and signed face distance after unrelated warm starts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the unchanged public signed-query API on open and closed surfaces after deliberately different warm points. Asserts literal tie ordinals, feature/rim/sign/point data, exhaustive nearest and witness attainment, current mutable point reads and independent mesh/result ownership. Stale warm distances, nonstrict pruning and altered narrow-phase signs fail observable results.
 * @evidence contracts/development/testing.md#independent-expectations Parallel XY triangles at z=0 and z=2 have exactly equal unit distance at z=1; original ordinal zero wins and the nearest point/normal/rim follow their authored coordinates. The L1 ball center is -1/sqrt(3) from its faces, and an exterior axis point is one metre from its axis vertex. Ericson's independent seven-region oracle exhaustively checks every original triangle rather than reusing production bounds/projection; binary64 tolerances cover rounding only.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers equality rather than only strict improvement, different warm points, face/edge/vertex ties, exact surface points, open rims versus closed interior, XYZ-separated leaves, reverse query order, mutable current input and immutable resident/results. Existing signed-query refusal/topology units retain malformed buffers, winding/fan admission and overflow cases.
 * @evidence contracts/development/testing.md#execution-ownership This discoverable portable geometry unit uses public Engine queries, authored arrays and existing oracle/fixture helpers only. Its loops own local cases and start no browser, GPU, native compiler, process or benchmark.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A higher-ordinal open face is warmed at a different point, then an exact).
 */
export function test_geometry_signed_mesh_warm_pruning(): void {
  const source: IAutoMovieMesh = sheets();
  const sample: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    createAutoMovieSignedMeshQuery(source, { boundary: "open" });
  const ties: readonly {
    point: readonly number[];
    nearest: readonly number[];
    feature: IAutoMovieSignedMeshQueryHit["feature"];
    boundary: boolean;
    distance: number;
  }[] = [
    {
      point: [0.25, 0.25, 1],
      nearest: [0.25, 0.25, 0],
      feature: "face",
      boundary: false,
      distance: 1,
    },
    {
      point: [0.75, 0.75, 1],
      nearest: [0.5, 0.5, 0],
      feature: "edge",
      boundary: true,
      distance: Math.sqrt(1.125),
    },
    {
      point: [-0.25, -0.25, 1],
      nearest: [0, 0, 0],
      feature: "vertex",
      boundary: true,
      distance: Math.sqrt(1.125),
    },
  ];
  for (const scenario of ties) {
    TestValidator.equals(
      "warm the higher original triangle at another point",
      sample([0.25, 0.25, 1.75]).triangle,
      1,
    );
    const hit: IAutoMovieSignedMeshQueryHit = sample(scenario.point);
    TestValidator.equals(
      "equal-distance lower original ordinal survives",
      hit.triangle,
      0,
    );
    TestValidator.equals("tie feature", hit.feature, scenario.feature);
    TestValidator.equals("tie rim flag", hit.boundary, scenario.boundary);
    TestValidator.predicate(
      "analytic tie witness and oriented distance",
      hit.point.every((value: number, axis: number): boolean =>
        nclose(value, scenario.nearest[axis]!),
      ) &&
        hit.normal.every((value: number, axis: number): boolean =>
          nclose(value, axis === 2 ? 1 : 0),
        ) &&
        nclose(hit.distance, scenario.distance) &&
        nclose(hit.signedDistance, scenario.distance),
    );
  }
  const boundary: IAutoMovieSignedMeshQueryHit = sample([0.25, 0.25, 2]);
  TestValidator.equals(
    "exact upper surface retains its ordinal",
    boundary.triangle,
    1,
  );
  TestValidator.predicate(
    "exact face contact remains zero",
    nclose(boundary.distance, 0) && nclose(boundary.signedDistance, 0),
  );
  TestValidator.predicate(
    "open face's local negative side remains negative",
    nclose(sample([0.25, 0.25, 1.75]).signedDistance, -0.25),
  );

  const triangles: number[][][] = Array.from(
    { length: source.indices!.length / 3 },
    (_: unknown, ordinal: number): number[][] =>
      [0, 1, 2].map((corner: number): number[] => {
        const vertex: number = source.indices![3 * ordinal + corner]!;
        return source.positions.slice(3 * vertex, 3 * vertex + 3);
      }),
  );
  const probes: number[][] = [
    [0.25, 0.25, 1],
    [0.75, 0.75, 1],
    [-0.25, -0.25, 1],
  ];
  for (let index: number = 1; index <= 13; index++) {
    probes.push([10 * index + 0.25, 3 * index + 0.25, 5 * index + 0.5]);
    probes.push([10 * index + 1.25, 3 * index - 0.25, 5 * index - 0.5]);
  }
  for (const sequence of [probes, [...probes].reverse()])
    for (const point of sequence) {
      const hit: IAutoMovieSignedMeshQueryHit = sample(point);
      const distances: number[] = triangles.map((corners: number[][]): number =>
        closestTriangleDistanceSquaredOracle(
          point,
          corners[0]!,
          corners[1]!,
          corners[2]!,
        ),
      );
      const least: number = Math.sqrt(Math.min(...distances));
      TestValidator.predicate(
        "complete original surface minimum and attaining witness",
        nclose(hit.distance, least, 1e-9) &&
          nclose(Math.sqrt(distances[hit.triangle]!), least, 1e-9),
      );
    }

  const current: number[] = [0.25, 0.25, 1.75];
  TestValidator.equals(
    "mutable current point begins near upper face",
    sample(current).triangle,
    1,
  );
  current[2] = 0.25;
  const lower: IAutoMovieSignedMeshQueryHit = sample(current);
  TestValidator.equals(
    "same point object now reads the lower face",
    lower.triangle,
    0,
  );
  TestValidator.predicate(
    "current point uses new canonical distance",
    nclose(lower.signedDistance, 0.25),
  );
  source.positions.fill(999);
  source.indices!.fill(0);
  lower.point.fill(-999);
  lower.normal.fill(0);
  const retained: IAutoMovieSignedMeshQueryHit = sample([0.25, 0.25, 1]);
  TestValidator.equals(
    "resident/result mutation cannot change original tie",
    retained.triangle,
    0,
  );
  TestValidator.predicate(
    "resident/result mutation cannot change geometry or normal",
    nclose(retained.distance, 1) &&
      nclose(retained.point[2]!, 0) &&
      nclose(retained.normal[2]!, 1),
  );

  const closed: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    createAutoMovieSignedMeshQuery(createSignedOctahedron());
  for (const warm of [
    [-2, 0, 0],
    [0, -2, 0],
    [0, 0, -2],
    [0.2, 0.2, 0.2],
  ]) {
    closed(warm);
    const center: IAutoMovieSignedMeshQueryHit = closed([0, 0, 0]);
    TestValidator.equals(
      "closed center tie preserves original ordinal",
      center.triangle,
      0,
    );
    TestValidator.predicate(
      "closed center remains analytically inside",
      nclose(center.signedDistance, -1 / Math.sqrt(3)) && !center.boundary,
    );
    const outside: IAutoMovieSignedMeshQueryHit = closed([2, 0, 0]);
    TestValidator.equals(
      "closed exterior nearest vertex",
      outside.feature,
      "vertex",
    );
    TestValidator.predicate(
      "closed exterior remains one metre outside",
      nclose(outside.signedDistance, 1),
    );
    TestValidator.predicate(
      "closed boundary remains zero",
      nclose(closed([1, 0, 0]).distance, 0),
    );
  }
}
