import {
  type IAutoMovieMesh,
  type IAutoMovieMeshDeformationField,
  type IAutoMovieMeshPhysicalVertices,
  type IAutoMovieMeshSkin,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieMeshDeformationInfluence } from "../../../../packages/engine/src/geometry/IAutoMovieMeshDeformationInfluence";
import { assertAutoMovieDeformedTriangles } from "../../../../packages/engine/src/geometry/assertAutoMovieDeformedTriangles";
import { createAutoMovieMeshDeformer } from "../../../../packages/engine/src/geometry/createAutoMovieMeshDeformer";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Endpoint derivatives cannot certify the triangles connecting those endpoints.
 * The independent planar area is 1-2d when a compact field moves only the
 * origin of a unit right triangle by (d,d,0). Every endpoint Jacobian is the
 * identity, including when that triangle collapses or reverses its winding.
 *
 * Scenarios:
 * 1. d=0.2 retains area 0.3; d=0.5 collapses and d=2 reverses. Indexed,
 *    non-indexed, reversed-winding and normal-free inputs obey the same rule.
 * 2. A field with two negative local scales turns a face through 180 degrees
 *    with positive determinant. Transported orientation permits it, whereas
 *    comparing the unchanged source normal with the output would reject it.
 * 3. Empty triangle populations and a microscopic valid triangle are accepted.
 *    Malformed attributes/indices, degenerate source and overflowing face area
 *    refuse explicitly. The failed operation leaves input buffers untouched.
 * 4. The triangle admission itself keeps a corner whose transported normal has
 *    finite components but an overflowing norm, so three such corners still
 *    admit an unchanged face, and names the vertex whose cofactor cannot
 *    transport the normal at all instead of reporting an opposed face.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes the deformer and its actual exported triangle-admission owner directly, checking retained positive orientation, collapse/reversal refusals, accepted transported half-turn, tiny/empty geometry and named malformed/overflow/cofactor failures without input mutation. It catches reliance on endpoint Jacobians alone.
 * @evidence contracts/testing.md#independent-expectations Moving only the unit triangle's origin by (d,d,0) gives twice-area 1-2*d, hence d=.2 stays positive, .5 collapses and 2 reverses despite identity endpoint Jacobians. Two negative local scales preserve determinant and transported orientation. These discrete face expectations cannot certify between-vertex geometry or global collision freedom.
 * @evidence contracts/testing.md#distinguishing-cases Preserves indexed/nonindexed, reversed-winding and normal-free variants; positive/collapsed/reversed face; transported half-turn; empty/microscopic input; malformed attributes/indices; source degeneracy; area overflow; extreme finite cofactor normals and failed transport. Mask and scale derivatives belong to their companion tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry uses ordinary direct imports of portable product source, including the existing triangle-admission export, without source loaders or module replacement. It starts no process, browser, GPU or native build and adds no Human test, fixture or dynamic case.
 */
export function test_geometry_mesh_deformation_topology(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    skin: null,
  };
  const field: (d: number) => IAutoMovieMeshDeformationField = (
    d: number,
  ): IAutoMovieMeshDeformationField => ({
    center: { x: 0, y: 0, z: 0 },
    radius: { x: 0.25, y: 0.25, z: 0.25 },
    displacement: { x: d, y: d, z: 0 },
    stretch: { x: 0, y: 0, z: 0 },
  });
  const before: IAutoMovieMesh = structuredClone(mesh);
  for (const variant of [
    mesh,
    { ...mesh, indices: null },
    { ...mesh, normals: null },
    {
      ...mesh,
      indices: [2, 1, 0],
      normals: mesh.normals!.map((v: number): number => -v),
    },
    // Shading normals do not own topological orientation.
    { ...mesh, normals: mesh.normals!.map((v: number): number => -v) },
  ]) {
    const result: IAutoMovieMesh = createAutoMovieMeshDeformer([field(0.2)])(
      variant,
    );
    const p: number[] = result.positions;
    const twiceArea: number =
      (p[3] - p[0]) * (p[7] - p[1]) - (p[4] - p[1]) * (p[6] - p[0]);
    TestValidator.predicate(
      "positive independent area",
      nclose(twiceArea, 0.6),
    );
    for (const d of [0.5, 2])
      TestValidator.predicate(
        "endpoint-positive collapse and reversal refuse",
        throwsError(
          (): IAutoMovieMesh =>
            createAutoMovieMeshDeformer([field(d)])(variant),
          d === 0.5
            ? "finite nonzero source and output area"
            : "opposes its transported surface orientation",
        ),
      );
  }
  TestValidator.predicate(
    "failed deformation retains input",
    equalGeometryTestValues(mesh, before),
  );

  const radius: number = 1000;
  const turn: IAutoMovieMeshDeformationField = {
    ...field(0),
    radius: { x: radius, y: radius, z: radius },
    stretch: { x: 0, y: -2, z: -2 },
  };
  const turned: IAutoMovieMesh = createAutoMovieMeshDeformer([turn])(mesh);
  TestValidator.predicate(
    "a positive-Jacobian half-turn is not a fold",
    nclose(turned.positions[7], 1 - 2 * (1 - 1 / radius ** 2) ** 3) &&
      turned.positions[7] < 0 &&
      turned.normals![2] < 0,
  );

  const identity: (
    mesh: IAutoMovieMesh,
    influence?: readonly IAutoMovieMeshDeformationInfluence[],
  ) => IAutoMovieMesh = createAutoMovieMeshDeformer([]);
  const tiny: {
    positions: number[];
    physicalVertices?: IAutoMovieMeshPhysicalVertices;
    normals: number[] | null;
    uvs: number[] | null;
    colors?: number[];
    reliefWeights?: number[];
    indices: number[] | null;
    skin: IAutoMovieMeshSkin | null;
  } = {
    ...mesh,
    positions: mesh.positions.map((v: number): number => v * 1e-80),
  };
  TestValidator.predicate(
    "no absolute area floor",
    equalGeometryTestValues(identity(tiny).positions, tiny.positions),
  );
  TestValidator.predicate(
    "an explicit empty face population retains isolated samples",
    equalGeometryTestValues(
      createAutoMovieMeshDeformer([field(2)])({ ...mesh, indices: [] })
        .positions,
      [2, 2, 0, 1, 0, 0, 0, 1, 0],
    ),
  );
  TestValidator.equals(
    "empty implicit triangle population",
    identity({
      positions: [],
      normals: null,
      indices: null,
      uvs: null,
      skin: null,
    }).positions,
    [],
  );
  for (const invalid of [
    { ...mesh, positions: [0, 0] },
    { ...mesh, positions: [NaN, ...mesh.positions.slice(1)] },
    { ...mesh, indices: [0, 1] },
    { ...mesh, indices: [0, 1, 0.5] },
    { ...mesh, indices: [0, 1, -1] },
    { ...mesh, indices: [0, 1, 3] },
    { ...mesh, normals: [0, 0, 1] },
    { ...mesh, normals: [NaN, ...mesh.normals!.slice(1)] },
    { ...mesh, indices: null, positions: [0, 0, 0] },
    { ...mesh, positions: [0, 0, 0, 1, 0, 0, 2, 0, 0] },
    {
      ...mesh,
      positions: mesh.positions.map((v: number): number => v * 1e200),
    },
  ])
    TestValidator.predicate(
      "invalid resident triangles refuse",
      throwsError((): IAutoMovieMesh => identity(invalid), "Mesh deformation"),
    );
  TestValidator.predicate(
    "finite vertices can still overflow the emitted area",
    throwsError(
      (): IAutoMovieMesh => createAutoMovieMeshDeformer([field(1e308)])(mesh),
      "finite nonzero source and output area",
    ),
  );

  // Source normal (1, 1, 0) / sqrt(2): each transported component is about
  // 1.48e308, finite, while their Euclidean norm exceeds the binary64 range.
  const slanted: number[] = [0, 0, 0, 0, 0, 1, 1, -1, 0];
  const large: number[] = [1.5e308, 0.6e308, 0, 0.6e308, 1.5e308, 0, 0, 0, 1];
  TestValidator.predicate(
    "an overflowing transport norm keeps its corner's direction",
    throwsError((): void =>
      assertAutoMovieDeformedTriangles(
        slanted,
        slanted,
        [0, 1, 2],
        [large, large, large],
      ),
    ) === false,
  );
  const identityCofactor: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  TestValidator.predicate(
    "a non-finite cofactor names the vertex it cannot transport through",
    throwsError(
      (): void =>
        assertAutoMovieDeformedTriangles(
          slanted,
          slanted,
          [0, 1, 2],
          [
            [Infinity, 0, 0, 0, 1, 0, 0, 0, 1],
            identityCofactor,
            identityCofactor,
          ],
        ),
      "triangle 0 cannot transport its source orientation through vertex 0",
    ),
  );
}
