import {
  type IAutoMovieMeshDefect,
  measureAutoMovieMeshDefects,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * The unit cube with four vertices of its own per face, so no face shares a vertex index with another and every shared edge exists only after welding.
 *
 * Face `f` owns vertices `4 f` to `4 f + 3`, counter-clockwise seen from outside, in the order -z, +z, -y, +y, -x, +x.
 */
const BOX_POSITIONS: number[] = [
  ...[0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0],
  ...[0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
  ...[0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1],
  ...[0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0],
  ...[0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0],
  ...[1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
];

/** Two triangles per face: triangle `2 f` is corners 0, 1, 2 of face `f` and triangle `2 f + 1` is corners 0, 2, 3. */
const BOX_INDICES: number[] = [0, 1, 2, 3, 4, 5].flatMap(
  (face: number): number[] => [
    4 * face,
    4 * face + 1,
    4 * face + 2,
    4 * face,
    4 * face + 2,
    4 * face + 3,
  ],
);

/**
 * One expected defect, written on one line.
 *
 * @param kind Its class.
 * @param vertices Its stored vertex indices.
 * @returns The record.
 */
function defect(
  kind: IAutoMovieMeshDefect.Kind,
  vertices: number[],
): IAutoMovieMeshDefect {
  return { kind, vertices };
}

/**
 * `measureAutoMovieMeshDefects` returns each defect of a mesh with the stored vertex indices that carry it, in ascending order of first triangle.
 *
 * Scenarios:
 *
 * 1. A closed box whose faces own their vertices reports nothing, as does an empty mesh.
 * 2. The box without its first triangle reports exactly the three open edges of the hole, each named by the vertices of the neighbouring triangle that still uses it.
 * 3. A third triangle fanned on one box edge reports that edge non-manifold once, by the corners of its first user, and the fan's two free edges open.
 * 4. The box with its first triangle wound the other way reports that triangle's three edges inconsistent, in its own corner order.
 * 5. A triangle with two corners at one position reports degenerate and no edges, alone and inside the box, where its neighbours' edges open.
 * 6. A needle of aspect 100 reports sliver only with a limit below 100, the box's right triangles of aspect 2 only with a limit below 2, and three collinear corners at any limit.
 * 7. Typed arrays give the indexed answer unchanged, and the non-indexed twin gives the same kinds in the same order under its own vertex numbering.
 * 8. Two triangles whose shared edge is 0.0001 apart stay apart on the default lattice and share the edge on a lattice of 1000 cells per unit.
 * 9. Ragged positions, ragged corners, an index outside the buffer, a sliver limit or weld that is not positive and finite, a non-finite position and a vertex count past the exact key range are each refused by name.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public function on buffers written in this file and compares the whole returned list: kinds, stored vertex indices and their order. It fails for a census that loses a use, lists an edge once per user, reports welded ids instead of stored indices, orders by edge key instead of first triangle, counts a collapsed triangle's edges, tests winding on a non-manifold edge or rejects a typed array. Any key scheme or table layout that returns the same list passes.
 * @evidence contracts/development/testing.md#independent-expectations Each expected list is worked out by hand from the corner table above: which face triangles meet on each cube edge and in which direction each traverses it. Aspects come from the closed form, 100 squared over 100 times 1 for the needle and 2 over 1 for a right isosceles triangle, and the limits stand clear of both values. A non-indexed list numbers corner `c` of triangle `t` as `3 t + c` by definition. The oracle is one cube and a few small meshes: it shows no cost bound and probes lattice rounding at one spacing only.
 * @evidence contracts/development/testing.md#distinguishing-cases Each scenario isolates one kind on the same box, so a wrong vertex pair or order cannot hide behind another kind, and the typed, non-indexed and weld scenarios vary only the buffer form or the lattice. Counts, volume and non-finite attributes of `inspectAutoMovieMeshTopology` belong to `test_geometry_procedural_topology`.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit reached by `--include test_measure_mesh_defects`. Every buffer is authored in this file and every case runs inside this entry; it starts no process, browser or GPU, reads no file and replaces no global.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 9 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A closed box whose faces own their vertices reports nothing, as does an empty mesh.).
 */
export function test_measure_mesh_defects(): void {
  /** The expected answer for a mesh without defects. */
  const none: IAutoMovieMeshDefect[] = [];

  // 1. A closed, consistently wound box and an empty mesh have nothing to report.
  TestValidator.equals(
    "a closed box of face-local vertices reports nothing",
    measureAutoMovieMeshDefects({
      positions: BOX_POSITIONS,
      indices: BOX_INDICES,
    }),
    none,
  );
  TestValidator.equals(
    "an empty mesh reports nothing, indexed or not",
    [
      measureAutoMovieMeshDefects({ positions: [], indices: [] }),
      measureAutoMovieMeshDefects({ positions: [], indices: null }),
    ],
    [none, none],
  );

  // 2. Triangle 0 spans (0,0,0), (0,1,0), (1,1,0).
  TestValidator.equals(
    "a missing triangle leaves the three open edges of its hole",
    measureAutoMovieMeshDefects({
      positions: BOX_POSITIONS,
      indices: BOX_INDICES.slice(3),
    }),
    [
      // The face diagonal, still used by the -z face's second triangle (0, 2, 3).
      defect("open", [0, 2]),

      // (1,1,0) to (0,1,0), the closing edge of the +y face's second triangle (12, 14, 15).
      defect("open", [15, 12]),

      // (0,1,0) to (0,0,0), the closing edge of the -x face's second triangle (16, 18, 19).
      defect("open", [19, 16]),
    ],
  );

  /** The box with a thirteenth triangle standing on the edge from (0,0,0) to (1,0,0), on three new vertices. */
  const fin: { positions: number[]; indices: number[] } = {
    positions: [...BOX_POSITIONS, 0, 0, 0, 1, 0, 0, 0.5, -1, -0.5],
    indices: [...BOX_INDICES, 24, 25, 26],
  };

  /** The fin's defects: its foot edge is first used by triangle 1 as corners 3 to 0, then by triangle 4 and the fin, and is listed for triangle 1 only. */
  const finned: IAutoMovieMeshDefect[] = [
    defect("non-manifold", [3, 0]),
    defect("open", [25, 26]),
    defect("open", [26, 24]),
  ];

  // 3. One edge with three users, and the fin's two free edges.
  TestValidator.equals(
    "a third triangle on one edge makes that edge non-manifold",
    measureAutoMovieMeshDefects(fin),
    finned,
  );

  // 4. Triangle 0 as (0, 2, 1) runs each of its edges the way its neighbour does.
  TestValidator.equals(
    "a flipped triangle reports its three edges inconsistent",
    measureAutoMovieMeshDefects({
      positions: BOX_POSITIONS,
      indices: [0, 2, 1, ...BOX_INDICES.slice(3)],
    }),
    [
      defect("inconsistent", [0, 2]),
      defect("inconsistent", [2, 1]),
      defect("inconsistent", [1, 0]),
    ],
  );

  // 5. Vertex 19 of the -x face stands at (0,1,0), where vertex 1 does, so (0, 1, 19) has two corners in one cell.
  TestValidator.equals(
    "a collapsed triangle is degenerate and contributes no edges",
    [
      measureAutoMovieMeshDefects({
        positions: [0, 0, 0, 1, 0, 0, 1, 0, 0],
        indices: null,
      }),
      measureAutoMovieMeshDefects({
        positions: BOX_POSITIONS,
        indices: [0, 1, 19, ...BOX_INDICES.slice(3)],
      }),
    ],
    [
      [defect("degenerate", [0, 1, 2])],
      [
        defect("degenerate", [0, 1, 19]),
        defect("open", [0, 2]),
        defect("open", [15, 12]),
        defect("open", [19, 16]),
      ],
    ],
  );

  /** A lone triangle with base 100 and height 1, so its aspect is 100 squared over twice its area 100, which is 100. */
  const needle: { positions: number[]; indices: number[] } = {
    positions: [0, 0, 0, 100, 0, 0, 50, 1, 0],
    indices: [0, 1, 2],
  };

  /** The three open edges any lone triangle has. */
  const lone: IAutoMovieMeshDefect[] = [
    defect("open", [0, 1]),
    defect("open", [1, 2]),
    defect("open", [2, 0]),
  ];

  /** Three collinear corners on distinct cells: no area, so no finite aspect. */
  const collinear: { positions: number[]; indices: null } = {
    positions: [0, 0, 0, 1, 0, 0, 2, 0, 0],
    indices: null,
  };

  // 6. Slivers appear only with the option, only above the limit, and before the triangle's edges.
  TestValidator.equals(
    "a needle is a sliver only under a limit its aspect exceeds",
    [
      measureAutoMovieMeshDefects(needle),
      measureAutoMovieMeshDefects(needle, { sliver: 101 }),
      measureAutoMovieMeshDefects(needle, { sliver: 99 }),
    ],
    [lone, lone, [defect("sliver", [0, 1, 2]), ...lone]],
  );
  TestValidator.equals(
    "the box's right triangles of aspect 2 are slivers only under a limit below 2",
    [
      measureAutoMovieMeshDefects(
        { positions: BOX_POSITIONS, indices: BOX_INDICES },
        { sliver: 2.01 },
      ),
      measureAutoMovieMeshDefects(
        { positions: BOX_POSITIONS, indices: BOX_INDICES },
        { sliver: 1.99 },
      ),
    ],
    [
      none,
      Array.from(
        { length: 12 },
        (_: unknown, triangle: number): IAutoMovieMeshDefect =>
          defect("sliver", BOX_INDICES.slice(3 * triangle, 3 * triangle + 3)),
      ),
    ],
  );
  TestValidator.equals(
    "collinear corners on distinct cells are a sliver at any limit and not degenerate",
    [
      measureAutoMovieMeshDefects(collinear),
      measureAutoMovieMeshDefects(collinear, { sliver: 1e12 }),
    ],
    [lone, [defect("sliver", [0, 1, 2]), ...lone]],
  );

  /** The fin mesh in 32-bit positions, exact because every coordinate is a multiple of one half. */
  const single: Float32Array = new Float32Array(fin.positions);

  /** The fin mesh as a non-indexed list in a typed array: three vertices of its own per triangle. */
  const unrolled: Float64Array = new Float64Array(
    fin.indices.flatMap((vertex: number): number[] =>
      fin.positions.slice(3 * vertex, 3 * vertex + 3),
    ),
  );

  // 7. Typed buffers are read in place and answer as the plain arrays do.
  TestValidator.equals(
    "typed arrays give the indexed answer and are left unchanged",
    {
      narrow: measureAutoMovieMeshDefects({
        positions: single,
        indices: new Uint16Array(fin.indices),
      }),
      wide: measureAutoMovieMeshDefects({
        positions: new Float64Array(fin.positions),
        indices: new Uint32Array(fin.indices),
      }),
      kept: single.every(
        (value: number, at: number): boolean => value === fin.positions[at],
      ),
    },
    { narrow: finned, wide: finned, kept: true },
  );
  TestValidator.equals(
    "a typed non-indexed list names the same defects by its own numbering",
    measureAutoMovieMeshDefects({ positions: unrolled, indices: null }),

    // Triangle 1 owns vertices 3 to 5 and triangle 12 owns 36 to 38.
    [
      defect("non-manifold", [5, 3]),
      defect("open", [37, 38]),
      defect("open", [38, 36]),
    ],
  );

  /** Two triangles whose facing edges are 0.0001 apart in y: vertices 3 and 4 sit just above vertices 1 and 0. */
  const gap: { positions: number[]; indices: null } = {
    positions: [
      ...[0, 0, 0, 1, 0, 0, 0, 1, 0],
      ...[1, 0.0001, 0, 0, 0.0001, 0, 0, -1, 0],
    ],
    indices: null,
  };

  // 8. The default lattice holds 100 000 cells in the gap; at 1000 cells per unit it rounds onto one cell.
  TestValidator.equals(
    "the weld option decides whether a narrow gap is one edge or two",
    [
      measureAutoMovieMeshDefects(gap),
      measureAutoMovieMeshDefects(gap, { weld: 1000 }),
    ],
    [
      [
        defect("open", [0, 1]),
        defect("open", [1, 2]),
        defect("open", [2, 0]),
        defect("open", [3, 4]),
        defect("open", [4, 5]),
        defect("open", [5, 3]),
      ],
      [
        defect("open", [1, 2]),
        defect("open", [2, 0]),
        defect("open", [4, 5]),
        defect("open", [5, 3]),
      ],
    ],
  );

  /** One sound triangle's positions, for refusals that vary only the indices or the options. */
  const patch: number[] = [0, 0, 0, 1, 0, 0, 0, 1, 0];

  /** Each malformed input with a fragment of the message that names it. */
  const refusals: Array<readonly [string, () => unknown, string]> = [
    [
      "ragged positions",
      (): IAutoMovieMeshDefect[] =>
        measureAutoMovieMeshDefects({ positions: [0, 0, 0, 1], indices: null }),
      "positions hold 4 components",
    ],
    [
      "ragged indices",
      (): IAutoMovieMeshDefect[] =>
        measureAutoMovieMeshDefects({
          positions: patch,
          indices: [0, 1, 2, 0],
        }),
      "4 triangle corners are not in threes",
    ],
    [
      "four vertices without indices",
      (): IAutoMovieMeshDefect[] =>
        measureAutoMovieMeshDefects({
          positions: [...patch, 1, 1, 0],
          indices: null,
        }),
      "4 triangle corners are not in threes",
    ],
    [
      "index past the last vertex",
      (): IAutoMovieMeshDefect[] =>
        measureAutoMovieMeshDefects({ positions: patch, indices: [0, 1, 5] }),
      "index 5 at corner 2 is not one of the 3 vertices",
    ],
    [
      "negative index",
      (): IAutoMovieMeshDefect[] =>
        measureAutoMovieMeshDefects({ positions: patch, indices: [0, -1, 2] }),
      "index -1 at corner 1 is not one of the 3 vertices",
    ],
    [
      "fractional index",
      (): IAutoMovieMeshDefect[] =>
        measureAutoMovieMeshDefects({ positions: patch, indices: [1.5, 1, 2] }),
      "index 1.5 at corner 0 is not one of the 3 vertices",
    ],
    ...[0, -1, Number.NaN, Number.POSITIVE_INFINITY].map(
      (limit: number): readonly [string, () => unknown, string] => [
        `sliver limit ${limit}`,
        (): IAutoMovieMeshDefect[] =>
          measureAutoMovieMeshDefects(
            { positions: patch, indices: null },
            { sliver: limit },
          ),
        `sliver limit ${limit} is not a positive finite aspect`,
      ],
    ),
    ...[0, -1e9, Number.NaN, Number.POSITIVE_INFINITY].map(
      (weld: number): readonly [string, () => unknown, string] => [
        `weld ${weld}`,
        (): IAutoMovieMeshDefect[] =>
          measureAutoMovieMeshDefects(
            { positions: patch, indices: null },
            { weld },
          ),
        `weld ${weld} is not a positive finite cell count`,
      ],
    ),
    [
      "non-finite position",
      (): IAutoMovieMeshDefect[] =>
        measureAutoMovieMeshDefects({
          positions: [0, 0, 0, 1, Number.NaN, 0, 0, 1, 0],
          indices: null,
        }),
      "vertex 1 has no lattice cell, its component 1 is NaN",
    ],
    [
      // 94 906 266 squared is the first square past 2^53; the buffer is only a length, refused before any read.
      "more vertices than edge keys stay exact for",
      (): IAutoMovieMeshDefect[] =>
        measureAutoMovieMeshDefects({
          positions: { length: 3 * 94_906_266 },
          indices: null,
        }),
      "94906266 vertices exceed",
    ],
  ];

  // 9. Every refusal throws an Error that names its own cause.
  for (const [name, task, message] of refusals)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(task, message),
    );
}
