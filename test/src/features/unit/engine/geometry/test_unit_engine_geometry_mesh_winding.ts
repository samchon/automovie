import { createAutoMovieMeshWindingQuery } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshWinding,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { outwardBoxMesh } from "../../../internal/outwardBoxMesh";

/**
 * `createAutoMovieMeshWindingQuery` reads a point's generalized winding number:
 * the solid angle the surface subtends over 4 pi, telling solid from empty
 * space on closed, nearly closed, overlapping and reversed surfaces.
 *
 * Fixture: the outward unit cube [0, 1]^3 (`outwardBoxMesh`), its top face its
 * last two triangles. A missing face seen from the centre is a sixth of the
 * sphere; a unit square seen from 0.5 m on its axis subtends 2 pi / 3.
 *
 * Scenarios:
 *
 * 1. The centre winds 1 (inside, not surface); (2, 0.5, 0.5) winds 0.
 * 2. Without its top, the centre winds 5/6 (still inside) and (0.5, 0.5, 1.5)
 *    winds +-1/6, outside.
 * 3. The cube and a copy shifted 0.5 along x in one buffer wind 2 where they
 *    overlap, 1 in one only, 0 outside.
 * 4. Every triangle reversed: the centre winds -1 and is still inside.
 * 5. A point on the top face is surface, not inside.
 * 6. A zero-area triangle added changes nothing.
 */
export function test_unit_engine_geometry_mesh_winding(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-12;
  const cube: IAutoMovieMesh = outwardBoxMesh({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });
  const closed = createAutoMovieMeshWindingQuery(cube);

  // 1.
  const centre: IAutoMovieMeshWinding = closed([0.5, 0.5, 0.5]);
  TestValidator.predicate("centre", close(centre.winding, 1) && centre.inside && !centre.surface);
  const beside: IAutoMovieMeshWinding = closed([2, 0.5, 0.5]);
  TestValidator.predicate("beside", close(beside.winding, 0) && !beside.inside && !beside.surface);

  // 2.
  const open = createAutoMovieMeshWindingQuery({ ...cube, indices: cube.indices!.slice(0, 30) });
  const held: IAutoMovieMeshWinding = open([0.5, 0.5, 0.5]);
  TestValidator.predicate("held", close(held.winding, 5 / 6) && held.inside);
  const above: IAutoMovieMeshWinding = open([0.5, 0.5, 1.5]);
  TestValidator.predicate("above the hole", close(Math.abs(above.winding), 1 / 6) && !above.inside);

  // 3.
  const shifted: IAutoMovieMesh = outwardBoxMesh({ x: 0.5, y: 0, z: 0 }, { x: 1.5, y: 1, z: 1 });
  const pair = createAutoMovieMeshWindingQuery({
    ...cube,
    positions: [...cube.positions, ...shifted.positions],
    indices: [...cube.indices!, ...shifted.indices!.map((i: number): number => i + 8)],
  });
  TestValidator.equals(
    "overlap",
    [pair([0.75, 0.5, 0.5]).winding, pair([0.25, 0.5, 0.5]).winding, pair([2, 0.5, 0.5]).winding].map(
      (w: number): number => Math.round(w * 1e9) / 1e9,
    ),
    [2, 1, 0],
  );

  // 4.
  const reversed: IAutoMovieMeshWinding = createAutoMovieMeshWindingQuery({
    ...cube,
    indices: cube.indices!.map((_: number, at: number): number => cube.indices![at - (at % 3) + (2 - (at % 3))]!),
  })([0.5, 0.5, 0.5]);
  TestValidator.predicate("reversed", close(reversed.winding, -1) && reversed.inside);

  // 5.
  const top: IAutoMovieMeshWinding = closed([0.5, 0.5, 1]);
  TestValidator.predicate("on the face", top.surface && !top.inside);

  // 6.
  const flat: IAutoMovieMeshWinding = createAutoMovieMeshWindingQuery({
    ...cube,
    indices: [...cube.indices!, 0, 0, 7],
  })([0.5, 0.5, 0.5]);
  TestValidator.predicate("zero area", close(flat.winding, 1) && flat.inside);
}
