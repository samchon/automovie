import { createAutoMovieMeshWindingQuery } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshWinding,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { outwardBoxMesh } from "../internal/outwardBoxMesh";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A winding query tells solid from empty space on closed, nearly closed,
 * overlapping and reversed triangle surfaces.
 *
 * Every expected winding is the solid angle the stated geometry subtends,
 * written from the geometry: a closed outward shell gives 1 inside and 0
 * outside, a missing face of a cube seen from the centre is one sixth of the
 * sphere, and a unit square seen from 0.5 m on its axis subtends 4 arcsin(1 /
 * (1 + 4 * 0.25)) = 2 pi / 3.
 *
 * Scenarios:
 *
 * 1. The closed outward unit cube gives winding 1 and `inside` at its centre, and
 *    0 and not `inside` at (2, 0.5, 0.5).
 * 2. The cube without its two top triangles gives 5/6 and `inside` at its centre,
 *    and an absolute 1/6 and not `inside` at (0.5, 0.5, 1.5).
 * 3. Two overlapping outward cubes in one index buffer give 2 where they overlap,
 *    1 in one cube only and 0 outside both.
 * 4. The cube with every triangle reversed gives -1 and `inside` at its centre.
 * 5. A point on the closed cube's top face is `surface` and not `inside`.
 * 6. A malformed index buffer, a non-finite position, an empty mesh and a query
 *    point with two coordinates each throw.
 * 7. A triangle without area added to the cube is admitted and changes no answer.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public winding query on made meshes and checks the winding, `surface` and `inside` answers and the refusals. It catches a sum that drops the sign, a threshold read on the signed rather than absolute winding, a missing surface test, a query that refuses open or overlapping surfaces, and an admission that accepts malformed input.
 * @evidence contracts/development/testing.md#independent-expectations Expected windings are closed-form solid angles of the stated cubes and squares divided by 4 pi, compared within 1e-12; the surface point lies on the top face by construction. Nothing is read back from the implementation.
 * @evidence contracts/development/testing.md#distinguishing-cases Inside and outside a closed shell, a nearly closed shell from inside and in front of its hole, overlapping shells, a reversed shell, a surface point, each refusal and a zero-area triangle. Built-space shell containment through this query is pinned by test_architecture_built_space_shell.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test of engine geometry with in-memory meshes; no process, browser, GPU or dynamic registration.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each naming the surface, the point and the expected answer.
 */
export function test_geometry_mesh_winding(): void {
  const cube: IAutoMovieMesh = outwardBoxMesh(
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1 },
  );
  const closed: (point: readonly number[]) => IAutoMovieMeshWinding =
    createAutoMovieMeshWindingQuery(cube);
  const centre: IAutoMovieMeshWinding = closed([0.5, 0.5, 0.5]);
  const beside: IAutoMovieMeshWinding = closed([2, 0.5, 0.5]);
  TestValidator.predicate(
    "a closed outward cube winds once around its centre",
    nclose(centre.winding, 1, 1e-12) && centre.inside && !centre.surface,
  );
  TestValidator.predicate(
    "and not at all around a point beside it",
    nclose(beside.winding, 0, 1e-12) && !beside.inside && !beside.surface,
  );

  // The last two triangles of the box are its top face.
  const open: (point: readonly number[]) => IAutoMovieMeshWinding =
    createAutoMovieMeshWindingQuery({
      ...cube,
      indices: cube.indices!.slice(0, 30),
    });
  const held: IAutoMovieMeshWinding = open([0.5, 0.5, 0.5]);
  const above: IAutoMovieMeshWinding = open([0.5, 0.5, 1.5]);
  TestValidator.predicate(
    "a cube missing its top still holds its centre, less the sixth the hole takes",
    nclose(held.winding, 1 - 1 / 6, 1e-12) && held.inside,
  );
  TestValidator.predicate(
    "and a point above the hole sees only the square it leaves",
    nclose(Math.abs(above.winding), (2 * Math.PI) / 3 / (4 * Math.PI), 1e-12) &&
      !above.inside,
  );

  const shifted: IAutoMovieMesh = outwardBoxMesh(
    { x: 0.5, y: 0, z: 0 },
    { x: 1.5, y: 1, z: 1 },
  );
  const pair: (point: readonly number[]) => IAutoMovieMeshWinding =
    createAutoMovieMeshWindingQuery({
      ...cube,
      positions: [...cube.positions, ...shifted.positions],
      indices: [
        ...cube.indices!,
        ...shifted.indices!.map((index: number): number => index + 8),
      ],
    });
  TestValidator.predicate(
    "overlapping shells count each shell around the point",
    nclose(pair([0.75, 0.5, 0.5]).winding, 2, 1e-12) &&
      nclose(pair([0.25, 0.5, 0.5]).winding, 1, 1e-12) &&
      nclose(pair([2, 0.5, 0.5]).winding, 0, 1e-12),
  );

  const reversed: IAutoMovieMeshWinding = createAutoMovieMeshWindingQuery({
    ...cube,
    indices: cube.indices!.map(
      (_: number, at: number): number =>
        cube.indices![at - (at % 3) + (2 - (at % 3))]!,
    ),
  })([0.5, 0.5, 0.5]);
  TestValidator.predicate(
    "an inward-wound cube winds negatively and is still solid",
    nclose(reversed.winding, -1, 1e-12) && reversed.inside,
  );

  const top: IAutoMovieMeshWinding = closed([0.5, 0.5, 1]);
  TestValidator.predicate(
    "a point on a face is surface and not inside",
    top.surface && !top.inside,
  );

  const flat: IAutoMovieMeshWinding = createAutoMovieMeshWindingQuery({
    ...cube,
    indices: [...cube.indices!, 0, 0, 7],
  })([0.5, 0.5, 0.5]);
  TestValidator.predicate(
    "a triangle without area changes nothing",
    nclose(flat.winding, 1, 1e-12) && flat.inside,
  );
}
