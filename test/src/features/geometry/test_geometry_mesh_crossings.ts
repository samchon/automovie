import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/** A mesh of one triangle from three hand-typed corners. */
const blade = (corners: number[][]): IAutoMovieMesh => ({
  positions: corners.flat(),
  indices: [0, 1, 2],
  normals: null,
  uvs: null,
  skin: null,
});

/** The unit right triangle on the z=0 plane, the fixed reference every case is read against. */
const flat = blade([
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
]);

/**
 * Triangle crossing is decided by a piercing edge, not by nearness or a plane.
 *
 * Every case here is answered from the coordinates before the function runs. A
 * blade through the interior crosses; the same blade lifted clear does not; the
 * same blade moved sideways pierces the plane but misses the triangle, which is
 * the case a plane test alone would get wrong. Coplanarity is split from
 * overlap deliberately: two triangles sharing a plane and sitting apart are not
 * a crossing, while two sharing a plane and overlapping are reported with
 * `coplanar` set, because an edge test alone cannot see them.
 *
 * Scenarios:
 * 1. A blade piercing the interior is reported once, naming both ordinals.
 * 2. The same blade clear of the surface, and the same blade beside it, report nothing.
 * 3. A vertex a millimetre inside crosses, a vertex a millimetre outside does not, and one resting exactly on the surface does not.
 * 4. Coplanar and overlapping is reported with coplanar true; coplanar and apart is not reported.
 * 5. An absent index buffer means consecutive position triples, and malformed buffers refuse.
 * 6. Ordinals follow the first mesh's own triangle order, and neither input is mutated.
 */
export const test_geometry_mesh_crossings = (): void => {
  const through = blade([
    [0.25, 0.25, -1],
    [0.25, 0.25, 1],
    [0.75, 0.25, 1],
  ]);
  TestValidator.equals(
    "a blade through the interior crosses once",
    measureAutoMovieMeshCrossings(flat, through),
    [{ triangle: 0, other: 0, coplanar: false }],
  );
  TestValidator.equals(
    "the crossing is symmetric in which mesh is asked",
    measureAutoMovieMeshCrossings(through, flat),
    [{ triangle: 0, other: 0, coplanar: false }],
  );
  TestValidator.equals(
    "the same blade lifted clear does not cross",
    measureAutoMovieMeshCrossings(
      flat,
      blade([
        [0.25, 0.25, 1],
        [0.25, 0.25, 2],
        [0.75, 0.25, 2],
      ]),
    ),
    [],
  );
  TestValidator.equals(
    "piercing the plane beside the triangle does not cross",
    measureAutoMovieMeshCrossings(
      flat,
      blade([
        [5, 5, -1],
        [5, 5, 1],
        [6, 5, 1],
      ]),
    ),
    [],
  );
  TestValidator.equals(
    "a corner a millimetre inside crosses",
    measureAutoMovieMeshCrossings(
      flat,
      blade([
        [0.25, 0.25, -0.001],
        [0.25, 0.25, 1],
        [0.75, 0.25, 1],
      ]),
    ).length,
    1,
  );
  TestValidator.equals(
    "a corner a millimetre outside does not",
    measureAutoMovieMeshCrossings(
      flat,
      blade([
        [0.25, 0.25, 0.001],
        [0.25, 0.25, 1],
        [0.75, 0.25, 1],
      ]),
    ),
    [],
  );
  TestValidator.equals(
    "coplanar and overlapping is reported as coplanar",
    measureAutoMovieMeshCrossings(
      flat,
      blade([
        [0.5, -0.5, 0],
        [0.5, 0.5, 0],
        [1.5, 0.5, 0],
      ]),
    ),
    [{ triangle: 0, other: 0, coplanar: true }],
  );
  // Its bounds overlap the reference's in the far corner, so the bounds filter
  // lets it through and the decision really is made in the plane: the reference
  // never reaches x+y=1.8, so the two share a plane and no area.
  TestValidator.equals(
    "coplanar with overlapping bounds but no shared area is not a crossing",
    measureAutoMovieMeshCrossings(
      flat,
      blade([
        [0.9, 0.9, 0],
        [1.5, 0.9, 0],
        [0.9, 1.5, 0],
      ]),
    ),
    [],
  );
  TestValidator.equals(
    "coplanar and far apart is not a crossing either",
    measureAutoMovieMeshCrossings(
      flat,
      blade([
        [5, 5, 0],
        [6, 5, 0],
        [5, 6, 0],
      ]),
    ),
    [],
  );
  // Two shells that meet along a seam share corners by construction; reporting
  // that as a collision would fire on every place surfaces are meant to meet.
  TestValidator.equals(
    "a triangle resting corner to corner on the reference does not cross",
    measureAutoMovieMeshCrossings(
      flat,
      blade([
        [0.25, 0.25, 0],
        [0.25, 0.25, 1],
        [0.75, 0.25, 1],
      ]),
    ),
    [],
  );
  TestValidator.equals(
    "a triangle sharing a whole edge with the reference does not cross",
    measureAutoMovieMeshCrossings(
      flat,
      blade([
        [0, 0, 0],
        [1, 0, 0],
        [0, 0, 1],
      ]),
    ),
    [],
  );
  const unindexed: IAutoMovieMesh = { ...through, indices: null };
  TestValidator.equals(
    "an absent index buffer means consecutive triples",
    measureAutoMovieMeshCrossings(flat, unindexed),
    [{ triangle: 0, other: 0, coplanar: false }],
  );
  for (const broken of [
    { ...flat, positions: [0, 0, 0, 1, 0] },
    { ...flat, positions: [0, 0, 0, 1, 0, 0, 0, Number.NaN, 0] },
    { ...flat, indices: [0, 1] },
    { ...flat, indices: [0, 1, 9] },
    { ...flat, indices: [0, 1, 1.5] },
  ] as IAutoMovieMesh[])
    TestValidator.predicate(
      "malformed triangle buffers refuse",
      throwsError(
        () => measureAutoMovieMeshCrossings(broken, through),
        "complete triangle buffers",
      ),
    );
  TestValidator.equals(
    "an empty mesh reports nothing on either side",
    [
      measureAutoMovieMeshCrossings(
        { ...flat, positions: [], indices: [] },
        through,
      ),
      measureAutoMovieMeshCrossings(flat, {
        ...flat,
        positions: [],
        indices: [],
      }),
    ],
    [[], []],
  );
  // Two triangles on the reference, the second of which is the one pierced, so a
  // report that ignored ordinals would name the wrong one.
  const pair: IAutoMovieMesh = {
    ...flat,
    positions: [5, 5, 0, 6, 5, 0, 5, 6, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2, 3, 4, 5],
  };
  const snapshot = JSON.stringify(pair);
  TestValidator.equals(
    "ordinals follow the first mesh's own triangle order",
    measureAutoMovieMeshCrossings(pair, through),
    [{ triangle: 1, other: 0, coplanar: false }],
  );
  TestValidator.equals(
    "neither input is mutated",
    JSON.stringify(pair),
    snapshot,
  );
};
