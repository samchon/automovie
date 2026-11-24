import {
  countAutoMovieMeshComponents,
  measureAutoMovieMeshPieces,
} from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieMeshPiece } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { outwardBoxMesh } from "../internal/outwardBoxMesh";
import { throwsError } from "../internal/predicates";

/**
 * Each mesh piece reports its welded counts, boundary loops, Euler
 * characteristic, manifoldness, orientability, stored winding and genus.
 *
 * Expected counts come from the stated triangulations: a tetrahedron has 4
 * vertices, 6 edges and 4 faces; a 4 by 4 wrapped grid of split quads has 16
 * vertices, 32 faces and 48 edges, so its Euler characteristic is 0 and its
 * genus 1; a cube missing its two top triangles keeps 8 vertices and 17 edges
 * around 10 faces and one square hole.
 *
 * Scenarios:
 *
 * 1. A tetrahedron is one closed piece of Euler characteristic 2 and genus 0, with
 *    a zero-area triangle beside it skipped.
 * 2. A 4 by 4 torus grid is one piece of Euler characteristic 0 and genus 1.
 * 3. A cube without its two top triangles is one piece with one loop, Euler
 *    characteristic 1 and genus 0.
 * 4. A cube whose faces carry their own corners is six index components but one
 *    welded piece of genus 0.
 * 5. Two disjoint tetrahedra are two pieces in first-triangle order, each of genus
 *    0.
 * 6. Two tetrahedra sharing one edge are one piece that is not manifold, with null
 *    orientability and genus.
 * 7. A closed cube with one triangle reversed is orientable with genus 0 but not
 *    consistently wound.
 * 8. A malformed index buffer throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public piece census on made meshes and compares whole records. It catches pieces split by index identity instead of welding, a wrong edge or loop count, a genus from a non-manifold or non-orientable piece, orientability confused with stored winding, a wrong piece order and an accepted malformed buffer.
 * @evidence contracts/development/testing.md#independent-expectations Every count is read from the stated triangulation and the genus from the classification of compact surfaces, not from the implementation; the six-component count of the split cube comes from its index graph.
 * @evidence contracts/development/testing.md#distinguishing-cases Closed, holed, toroidal, split-corner, disjoint, edge-joined and mis-wound meshes, a degenerate triangle and a malformed buffer. Whole-mesh edge census and watertightness belong to the inspectAutoMovieMeshTopology tests and index components to test_mesh_components.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test of engine geometry with in-memory meshes; no process, browser, GPU or dynamic registration.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 8 numbered scenarios it runs, each naming the mesh and its expected topology.
 */
export function test_geometry_mesh_pieces(): void {
  const closed: Omit<IAutoMovieMeshPiece, "firstTriangle"> = {
    vertices: 4,
    edges: 6,
    faces: 4,
    boundaryLoops: 0,
    euler: 2,
    manifold: true,
    orientable: true,
    consistentlyWound: true,
    genus: 0,
  };
  TestValidator.equals(
    "a tetrahedron is one closed piece of genus 0",
    measureAutoMovieMeshPieces(
      mesh(TETRAHEDRON, [...TETRAHEDRON_TRIANGLES, 0, 0, 1]),
    ),
    [{ firstTriangle: 0, ...closed }],
  );

  TestValidator.equals(
    "a wrapped grid is one torus",
    measureAutoMovieMeshPieces(torus()),
    [
      {
        firstTriangle: 0,
        vertices: 16,
        edges: 48,
        faces: 32,
        boundaryLoops: 0,
        euler: 0,
        manifold: true,
        orientable: true,
        consistentlyWound: true,
        genus: 1,
      },
    ],
  );

  const cube: IAutoMovieMesh = outwardBoxMesh(
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1 },
  );
  TestValidator.equals(
    "a cube without its top has one loop",
    measureAutoMovieMeshPieces({
      ...cube,
      indices: cube.indices!.slice(0, 30),
    }),
    [
      {
        firstTriangle: 0,
        vertices: 8,
        edges: 17,
        faces: 10,
        boundaryLoops: 1,
        euler: 1,
        manifold: true,
        orientable: true,
        consistentlyWound: true,
        genus: 0,
      },
    ],
  );

  const split: IAutoMovieMesh = splitFaces(cube);
  const whole: Omit<IAutoMovieMeshPiece, "firstTriangle"> = {
    vertices: 8,
    edges: 18,
    faces: 12,
    boundaryLoops: 0,
    euler: 2,
    manifold: true,
    orientable: true,
    consistentlyWound: true,
    genus: 0,
  };
  TestValidator.equals(
    "a cube of face-local corners has six index components",
    countAutoMovieMeshComponents(split),
    6,
  );
  TestValidator.equals(
    "but welds into one piece",
    measureAutoMovieMeshPieces(split),
    [{ firstTriangle: 0, ...whole }],
  );

  TestValidator.equals(
    "two disjoint tetrahedra are two pieces in first-triangle order",
    measureAutoMovieMeshPieces(
      mesh(
        [
          ...TETRAHEDRON,
          ...TETRAHEDRON.map((value: number, at: number): number =>
            at % 3 === 0 ? value + 5 : value,
          ),
        ],
        [
          ...TETRAHEDRON_TRIANGLES,
          ...TETRAHEDRON_TRIANGLES.map((index: number): number => index + 4),
        ],
      ),
    ),
    [
      { firstTriangle: 0, ...closed },
      { firstTriangle: 4, ...closed },
    ],
  );

  // The second tetrahedron is the first turned half a turn about X, so the
  // two share the edge from corner 0 to corner 1 and nothing else.
  TestValidator.equals(
    "tetrahedra sharing an edge are one piece that is not manifold",
    measureAutoMovieMeshPieces(
      mesh(
        [...TETRAHEDRON, 0, -1, 0, 0, 0, -1],
        [...TETRAHEDRON_TRIANGLES, 0, 4, 1, 0, 1, 5, 0, 5, 4, 1, 4, 5],
      ),
    ),
    [
      {
        firstTriangle: 0,
        vertices: 6,
        edges: 11,
        faces: 8,
        boundaryLoops: 0,
        euler: 3,
        manifold: false,
        orientable: null,
        consistentlyWound: true,
        genus: null,
      },
    ],
  );

  TestValidator.equals(
    "a cube with one reversed triangle is orientable but not consistently wound",
    measureAutoMovieMeshPieces({
      ...cube,
      indices: [
        cube.indices![2]!,
        cube.indices![1]!,
        cube.indices![0]!,
        ...cube.indices!.slice(3),
      ],
    }),
    [{ firstTriangle: 0, ...whole, consistentlyWound: false }],
  );

  TestValidator.predicate(
    "a malformed index buffer is refused",
    throwsError(() => measureAutoMovieMeshPieces(mesh(TETRAHEDRON, [0, 1]))),
  );
}

/** A unit tetrahedron's corners: the origin and the three unit axis points. */
const TETRAHEDRON: readonly number[] = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];

/** The tetrahedron's four triangles, counter-clockwise seen from outside. */
const TETRAHEDRON_TRIANGLES: readonly number[] = [
  0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3,
];

/** A mesh of the given positions and indices without attributes. */
const mesh: (
  positions: readonly number[],
  indices: readonly number[],
) => IAutoMovieMesh = (
  positions: readonly number[],
  indices: readonly number[],
): IAutoMovieMesh => ({
  positions: [...positions],
  indices: [...indices],
  normals: null,
  uvs: null,
  skin: null,
});

/**
 * A torus of radii 2 m and 0.5 m sampled on a 4 by 4 grid wrapping in both
 * directions, each quad split into two triangles.
 */
const torus: () => IAutoMovieMesh = (): IAutoMovieMesh => {
  const positions: number[] = [];
  for (let i: number = 0; i < 4; ++i)
    for (let j: number = 0; j < 4; ++j) {
      const u: number = (Math.PI / 2) * i;
      const v: number = (Math.PI / 2) * j;
      const ring: number = 2 + 0.5 * Math.cos(v);
      positions.push(ring * Math.cos(u), ring * Math.sin(u), 0.5 * Math.sin(v));
    }
  const at: (i: number, j: number) => number = (i: number, j: number): number =>
    (i % 4) * 4 + (j % 4);
  const indices: number[] = [];
  for (let i: number = 0; i < 4; ++i)
    for (let j: number = 0; j < 4; ++j)
      indices.push(
        at(i, j),
        at(i + 1, j),
        at(i + 1, j + 1),
        at(i, j),
        at(i + 1, j + 1),
        at(i, j + 1),
      );
  return mesh(positions, indices);
};

/** The same box with each face's two triangles given their own four corners. */
const splitFaces: (box: IAutoMovieMesh) => IAutoMovieMesh = (
  box: IAutoMovieMesh,
): IAutoMovieMesh => {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let face: number = 0; face < 6; ++face) {
    const [a, b, c, , , d]: number[] = box.indices!.slice(
      face * 6,
      face * 6 + 6,
    );
    const base: number = positions.length / 3;
    for (const corner of [a!, b!, c!, d!])
      positions.push(...box.positions.slice(corner * 3, corner * 3 + 3));
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return mesh(positions, indices);
};
