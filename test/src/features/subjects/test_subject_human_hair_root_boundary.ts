import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { closeHumanFaceHairContact } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createHumanFaceHairRootBoundary } from "../../../../packages/human/src/face/anatomy/hair/createHumanFaceHairRootBoundary";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Root incidence uses original closed-collider triangles and exact coincidence,
 * without treating sampler weights as a new geometry or normalization input.
 * Scenarios:
 * 1. A split-coordinate closed cube gives its face, diagonal edge, physical edge
 *    and vertex stars. Positive weight scaling and signed zero preserve support.
 * 2. A neck-like pyramid closure keeps four original sides before its cap fan;
 *    the boundary edge and vertex include their appended cap triangles.
 * 3. A rigid frame change retains ordinals. Two closed cubes separated by a
 *    sub-nanometre gap retain distinct stars rather than tolerance welding.
 * 4. Caller buffers, weights and returned arrays cannot rewrite the compiled
 *    index; invalid ordinals, support and degenerate buffers refuse.
 * 5. Actual original-triangle proximity measures face, edge and vertex distance
 *    independently of the whole collider and ignores the open query's sign.
 */
export const test_subject_human_hair_root_boundary = (): void => {
  // Original ordinals are defined here, before splitting all corner identities.
  // Triangles 0/1 face -X, 2/3 +X, 4/5 -Y, 6/7 +Y, 8/9 -Z, 10/11 +Z.
  const cubeMesh = () => {
    const vertices = [
      [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
      [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
    ];
    const triangles = [
      [0, 7, 3], [0, 4, 7], [1, 2, 6], [1, 6, 5],
      [0, 5, 4], [0, 1, 5], [3, 7, 6], [3, 6, 2],
      [0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7],
    ];
    return {
      positions: triangles.flatMap((triangle) => triangle.flatMap((id) => vertices[id])),
      indices: triangles.flatMap((_triangle, at) => [3 * at, 3 * at + 1, 3 * at + 2]),
      normals: null, uvs: null, skin: null,
    };
  };
  const cube = cubeMesh();
  const signed = createAutoMovieSignedMeshQuery(cube);
  TestValidator.predicate("the fixture is an admitted outward closed collider",
    signed([0.5, 0.5, 0.5]).signedDistance < 0,
  );
  const boundary = createHumanFaceHairRootBoundary({ positions: cube.positions, indices: cube.indices! });
  const resolve = boundary.resolve;
  TestValidator.predicate("original triangle distance measures both plane sides",
    nclose(boundary.distance(0, [-0.2, 0.75, 0.25]), 0.2) &&
    nclose(boundary.distance(0, [0.2, 0.75, 0.25]), 0.2),
  );
  TestValidator.predicate("triangle distance retains its edge and vertex limits",
    nclose(boundary.distance(0, [0, 0.25, 0.75]), 0.5 / Math.SQRT2) &&
    nclose(boundary.distance(0, [-1, -1, -1]), Math.sqrt(3)),
  );
  TestValidator.predicate("triangle identity does not become whole-collider proximity",
    nclose(boundary.distance(0, [1, 0.75, 0.25]), 1) &&
    signed([1, 0.75, 0.25]).distance === 0,
  );
  for (const triangle of [-1, 0.5, 12, NaN])
    TestValidator.predicate("distance requires an original resident ordinal",
      throwsError(() => boundary.distance(triangle, [0, 0, 0]), "ordinal"),
    );
  for (const point of [[0, 0], [0, NaN, 0]])
    TestValidator.predicate("triangle proximity requires finite XYZ",
      throwsError(() => boundary.distance(1, point), "finite XYZ"),
    );
  TestValidator.equals("face support names its original triangle",
    resolve({ triangle: 0, weights: [1, 1, 1] }), [0],
  );
  TestValidator.equals("a face diagonal meets its two original triangles",
    resolve({ triangle: 0, weights: [1, 1, 0] }), [0, 1],
  );
  TestValidator.equals("the cube's physical edge includes the adjacent face",
    resolve({ triangle: 0, weights: [0, 1, 1] }), [0, 6],
  );
  const vertexStar = [0, 1, 4, 5, 8, 9];
  TestValidator.equals("the origin vertex names its six incident triangles",
    resolve({ triangle: 0, weights: [1, 0, 0] }), vertexStar,
  );
  for (const weights of [[2, 5, 0], [Number.MIN_VALUE, Number.MAX_VALUE, -0]])
    TestValidator.equals("weight magnitudes need no normalization for incidence",
      resolve({ triangle: 0, weights }), [0, 1],
    );
  const open = {
    positions: [-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 0, 1, 0],
    indices: [0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0],
  };
  const closed = closeHumanFaceHairContact(open.positions, open.indices, [[[0, 1], [1, 2], [2, 3], [3, 0]]]);
  createAutoMovieSignedMeshQuery({ ...closed, normals: null, uvs: null, skin: null });
  const capped = createHumanFaceHairRootBoundary(closed).resolve;
  TestValidator.equals("closure retains the original side triangle",
    capped({ triangle: 0, weights: [1, 1, 1] }), [0],
  );
  TestValidator.equals("the source boundary edge shares its cap triangle",
    capped({ triangle: 0, weights: [1, 0, 1] }), [0, 4],
  );
  TestValidator.equals("the source vertex keeps side and appended cap identities",
    capped({ triangle: 0, weights: [1, 0, 0] }), [0, 3, 4, 7],
  );
  TestValidator.equals("the last admitted ordinal remains an original cap identity",
    capped({ triangle: 7, weights: [1, 1, 1] }), [7],
  );
  const moved = cube.positions.slice();
  for (let at = 0; at < moved.length; at += 3) {
    const [x, y, z] = moved.slice(at, at + 3);
    moved.splice(at, 3, z + 2, x - 3, y + 4);
  }
  const changedFrame = createHumanFaceHairRootBoundary({ positions: moved, indices: cube.indices! }).resolve;
  TestValidator.equals("rigid coordinates do not change feature incidence",
    changedFrame({ triangle: 0, weights: [1, 0, 0] }), vertexStar,
  );
  const next = cubeMesh();
  for (let at = 0; at < next.positions.length; at += 3) next.positions[at] += 1 + 1e-10;
  const separate = {
    positions: [...cube.positions, ...next.positions],
    indices: [...cube.indices!, ...next.indices!.map((id) => id + cube.positions.length / 3)],
  };
  createAutoMovieSignedMeshQuery({ ...separate, normals: null, uvs: null, skin: null });
  const exact = createHumanFaceHairRootBoundary(separate).resolve;
  TestValidator.equals("nearby coordinates do not introduce a second weld tolerance",
    exact({ triangle: 2, weights: [1, 0, 0] }), [2, 3, 5, 8],
  );
  TestValidator.equals("the neighbouring closed component keeps its own root star",
    exact({ triangle: 12, weights: [1, 0, 0] }), vertexStar.map((id) => id + 12),
  );
  const weights = [1, 1, 0];
  const owned = resolve({ triangle: 0, weights });
  weights.fill(0);
  TestValidator.equals("caller weights do not alias a returned star", owned, [0, 1]);
  owned.fill(100);
  cube.positions.fill(100);
  cube.indices!.fill(0);
  TestValidator.predicate("cached and new triangle readers retain the compiled snapshot",
    nclose(boundary.distance(0, [-0.2, 0.75, 0.25]), 0.2) &&
    nclose(boundary.distance(2, [0.8, 0.75, 0.25]), 0.2),
  );
  TestValidator.equals("caller and result mutations leave the compiled index unchanged",
    resolve({ triangle: 0, weights: [1, 1, 0] }), [0, 1],
  );
  for (const triangle of [-1, 12, 0.5, NaN, Infinity])
    TestValidator.predicate("out-of-domain original ordinals refuse",
      throwsError(() => resolve({ triangle, weights: [1, 1, 1] }), "ordinal"),
    );
  for (const weights of [[], [1, 0], [1, 0, 0, 0], [NaN, 1, 0], [Infinity, 1, 0], [-1, 1, 0]])
    TestValidator.predicate("malformed support refuses without normalization",
      throwsError(() => resolve({ triangle: 0, weights }), "support weights"),
    );
  TestValidator.predicate("all-zero support is not a root feature",
    throwsError(() => resolve({ triangle: 0, weights: [0, -0, 0] }), "positive support"),
  );
  const malformed = [
    { positions: [0, 0], indices: [0, 0, 0] },
    { positions: [0, 0, 0], indices: [] },
    { positions: [0, 0, 0], indices: [0] },
    { positions: [0, NaN, 0], indices: [0, 0, 0] },
    { positions: [0, 0, 0], indices: [0.5, 0, 0] },
    { positions: [0, 0, 0], indices: [-1, 0, 0] },
    { positions: [0, 0, 0], indices: [0, 1, 0] },
  ];
  for (const buffers of malformed)
    TestValidator.predicate("incomplete or invalid resident buffers refuse",
      throwsError(() => createHumanFaceHairRootBoundary(buffers), "resident triangles"),
    );
  TestValidator.predicate("coincident corners cannot form a triangle feature",
    throwsError(() => createHumanFaceHairRootBoundary({
      positions: [0, 0, 0, 0, 0, 0, 0, 1, 0], indices: [0, 1, 2],
    }), "distinct current vertices"),
  );
  for (const positions of [
    [0, 0, 0, 1, 0, 0, 2, 0, 0],
    [0, 0, 0, Number.MAX_VALUE, 0, 0, 0, Number.MAX_VALUE, 0],
  ])
    TestValidator.predicate("unrepresentable or zero-area geometry refuses",
      throwsError(() => createHumanFaceHairRootBoundary({ positions, indices: [0, 1, 2] }), "nondegenerate"),
    );
};
