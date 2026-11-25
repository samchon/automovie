import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshCrossing,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `measureAutoMovieMeshCrossings` lists the triangles of one mesh pierced by
 * the other, decided by a piercing edge (not nearness or a plane); coplanar
 * overlap is reported with `coplanar`, the complete-pair option keeps every
 * pair and the default a single witness.
 *
 * Reference: the unit right triangle F = (0,0,0), (1,0,0), (0,1,0). Every
 * expectation follows from the coordinates.
 *
 * Scenarios:
 *
 * 1. A blade through F's interior crosses once, either way round; lifted clear, or
 *    piercing the plane at (5, 5) beside F, it does not.
 * 2. A corner 1 mm under the plane crosses; 1 mm over, resting on F, or sharing
 *    F's whole edge, it does not.
 * 3. Coplanar overlap is `coplanar: true`; coplanar with overlapping bounds but no
 *    shared area (x + y >= 1.8), or far apart, is nothing.
 * 4. No index buffer means consecutive triples; a short position buffer, two
 *    indices or index 9 refuse ("complete triangle buffers"); an empty mesh on
 *    either side has nothing.
 * 5. Ordinals follow the first mesh's triangle order (the pierced triangle is its
 *    second) and the first mesh is not mutated.
 * 6. A neighbour sharing F's corner (1,0,0) and bending gently away, in each
 *    rotation of its corners, and a recorded pair of skin triangles sharing a
 *    corner, do not cross; a neighbour folding back through F does.
 * 7. Complete mode over two thin blades at x = 0.2 and 0.6 and one flat triangle
 *    names all three; the default and `allPairs: false` one; lifted 3 in z,
 *    none.
 * 8. Interior tolerance 1e-9 in both modes: a 1e-13 endpoint or edge perturbation
 *    is contact, a 1e-6 one crosses; tolerance 0 is the default; -1 and 0.5
 *    refuse ("a finite [0, 0.5) value").
 */
export function test_unit_engine_geometry_mesh_crossings(): void {
  const mesh = (
    positions: number[],
    indices: number[] | null,
  ): IAutoMovieMesh => ({
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const blade = (corners: number[][]): IAutoMovieMesh =>
    mesh(corners.flat(), [0, 1, 2]);
  const flat: IAutoMovieMesh = blade([
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
  ]);
  const one: IAutoMovieMeshCrossing[] = [
    { triangle: 0, other: 0, coplanar: false },
  ];
  const crossing = (
    label: string,
    corners: number[][],
    expected: IAutoMovieMeshCrossing[],
  ): void =>
    TestValidator.equals(
      label,
      measureAutoMovieMeshCrossings(flat, blade(corners)),
      expected,
    );
  const through: IAutoMovieMesh = blade([
    [0.25, 0.25, -1],
    [0.25, 0.25, 1],
    [0.75, 0.25, 1],
  ]);

  // 1.
  TestValidator.equals(
    "through",
    measureAutoMovieMeshCrossings(flat, through),
    one,
  );
  TestValidator.equals(
    "swapped",
    measureAutoMovieMeshCrossings(through, flat),
    one,
  );
  crossing(
    "lifted",
    [
      [0.25, 0.25, 1],
      [0.25, 0.25, 2],
      [0.75, 0.25, 2],
    ],
    [],
  );
  crossing(
    "beside",
    [
      [5, 5, -1],
      [5, 5, 1],
      [6, 5, 1],
    ],
    [],
  );

  // 2.
  crossing(
    "1 mm under",
    [
      [0.25, 0.25, -0.001],
      [0.25, 0.25, 1],
      [0.75, 0.25, 1],
    ],
    one,
  );
  crossing(
    "1 mm over",
    [
      [0.25, 0.25, 0.001],
      [0.25, 0.25, 1],
      [0.75, 0.25, 1],
    ],
    [],
  );
  crossing(
    "resting",
    [
      [0.25, 0.25, 0],
      [0.25, 0.25, 1],
      [0.75, 0.25, 1],
    ],
    [],
  );
  crossing(
    "shared edge",
    [
      [0, 0, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
    [],
  );

  // 3.
  crossing(
    "coplanar overlap",
    [
      [0.5, -0.5, 0],
      [0.5, 0.5, 0],
      [1.5, 0.5, 0],
    ],
    [{ triangle: 0, other: 0, coplanar: true }],
  );
  crossing(
    "coplanar bounds only",
    [
      [0.9, 0.9, 0],
      [1.5, 0.9, 0],
      [0.9, 1.5, 0],
    ],
    [],
  );
  crossing(
    "coplanar apart",
    [
      [5, 5, 0],
      [6, 5, 0],
      [5, 6, 0],
    ],
    [],
  );

  // 4.
  TestValidator.equals(
    "no index buffer",
    measureAutoMovieMeshCrossings(flat, { ...through, indices: null }),
    one,
  );
  const broken: IAutoMovieMesh[] = [
    { ...flat, positions: [0, 0, 0, 1, 0] },
    { ...flat, indices: [0, 1] },
    { ...flat, indices: [0, 1, 9] },
  ];
  broken.forEach((bad: IAutoMovieMesh, i: number): void =>
    TestValidator.predicate(
      `malformed ${i}`,
      throwsError(
        (): IAutoMovieMeshCrossing[] =>
          measureAutoMovieMeshCrossings(bad, through),
        "complete triangle buffers",
      ),
    ),
  );
  const empty: IAutoMovieMesh = mesh([], []);
  TestValidator.equals(
    "empty either side",
    [
      measureAutoMovieMeshCrossings(empty, through),
      measureAutoMovieMeshCrossings(flat, empty),
    ],
    [[], []],
  );

  // 5.
  const pair: IAutoMovieMesh = mesh(
    [5, 5, 0, 6, 5, 0, 5, 6, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    [0, 1, 2, 3, 4, 5],
  );
  const before: string = JSON.stringify(pair);
  TestValidator.equals(
    "ordinal",
    measureAutoMovieMeshCrossings(pair, through),
    [{ triangle: 1, other: 0, coplanar: false }],
  );
  TestValidator.equals("first mesh kept", JSON.stringify(pair), before);

  // 6.
  const bent: number[][] = [
    [1, 0, 0],
    [2, 0.01, 0.05],
    [1, 1.001, 0.03],
  ];
  for (const r of [0, 1, 2])
    crossing(
      `bent neighbour ${r}`,
      [...bent.slice(r), ...bent.slice(0, r)],
      [],
    );
  TestValidator.equals(
    "skin neighbours",
    measureAutoMovieMeshCrossings(
      blade([
        [-0.07281415909528732, -0.5830061435699463, -0.06736848503351212],
        [-0.08017368614673615, -0.5966654419898987, -0.07248512655496599],
        [-0.08033677190542221, -0.5835632681846619, -0.06539095193147659],
      ]),
      blade([
        [-0.07291097939014435, -0.5704334378242493, -0.05966000258922577],
        [-0.08033677190542221, -0.5835632681846619, -0.06539095193147659],
        [-0.08007320761680602, -0.5711591839790344, -0.05790312588214874],
      ]),
    ),
    [],
  );
  crossing(
    "fold",
    [
      [1, 0, 0],
      [0.2, 0.2, -0.1],
      [0.3, 0.3, 0.1],
    ],
    one,
  );

  // 7.
  const blades: IAutoMovieMesh = mesh(
    [
      0.2, 0.2, -1, 0.2, 0.2, 1, 0.3, 0.2, 1, 0.6, 0.2, -1, 0.6, 0.2, 1, 0.7,
      0.2, 1, 0.5, -0.1, 0, 0.5, 0.1, 0, 0.9, 0.1, 0,
    ],
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
  );
  TestValidator.equals(
    "complete",
    measureAutoMovieMeshCrossings(flat, blades, { allPairs: true }).sort(
      (a: IAutoMovieMeshCrossing, b: IAutoMovieMeshCrossing): number =>
        a.other - b.other,
    ),
    [
      { triangle: 0, other: 0, coplanar: false },
      { triangle: 0, other: 1, coplanar: false },
      { triangle: 0, other: 2, coplanar: true },
    ],
  );
  TestValidator.equals(
    "default",
    measureAutoMovieMeshCrossings(flat, blades).length,
    1,
  );
  TestValidator.equals(
    "explicit false",
    measureAutoMovieMeshCrossings(flat, blades, { allPairs: false }).length,
    1,
  );
  TestValidator.equals(
    "complete lifted",
    measureAutoMovieMeshCrossings(
      flat,
      {
        ...blades,
        positions: blades.positions.map((v: number, i: number): number =>
          i % 3 === 2 ? v + 3 : v,
        ),
      },
      { allPairs: true },
    ),
    [],
  );

  // 8.
  const vertical = (y: number, low: number): IAutoMovieMesh =>
    mesh([0.25, y, low, 0.25, y, 1, 0.75, y, 1], [0, 1, 2]);
  for (const allPairs of [false, true]) {
    const read = (y: number, low: number): IAutoMovieMeshCrossing[] =>
      measureAutoMovieMeshCrossings(flat, vertical(y, low), {
        allPairs,
        interiorTolerance: 1e-9,
      });
    TestValidator.equals(`endpoint 1e-13 ${allPairs}`, read(0.25, -1e-13), []);
    TestValidator.equals(`edge 1e-13 ${allPairs}`, read(1e-13, -1), []);
    TestValidator.equals(`endpoint 1e-6 ${allPairs}`, read(0.25, -1e-6), one);
    TestValidator.equals(`edge 1e-6 ${allPairs}`, read(1e-6, -1), one);
  }
  TestValidator.equals(
    "tolerance 0 is the default",
    measureAutoMovieMeshCrossings(flat, vertical(0.25, -1e-13), {
      interiorTolerance: 0,
    }),
    measureAutoMovieMeshCrossings(flat, vertical(0.25, -1e-13)),
  );
  for (const tolerance of [-1, 0.5])
    TestValidator.predicate(
      `tolerance ${tolerance} refused`,
      throwsError(
        (): IAutoMovieMeshCrossing[] =>
          measureAutoMovieMeshCrossings(flat, vertical(0.25, -1), {
            interiorTolerance: tolerance,
          }),
        "Mesh crossing interior tolerance needs a finite [0, 0.5) value.",
      ),
    );
}
