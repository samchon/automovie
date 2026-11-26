import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshDeformationField,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";
import { throwsError } from "../../internal/throwsError";

/**
 * A deformation is admitted per triangle (`assertAutoMovieDeformedTriangles`):
 * endpoint Jacobians cannot certify the face between them, and orientation is
 * the transported one, not the source normal's.
 *
 * Fixture: the unit right triangle, +z normals; a field of radius 0.25 moving
 * only the origin by (d, d, 0). Every vertex Jacobian is the identity, yet the
 * face's twice-area is 1 - 2d.
 *
 * Scenarios:
 *
 * 1. Indexed, non-indexed, normal-free, reversed (winding and normals) and
 *    flipped-normal inputs: d = 0.2 keeps twice-area 0.6; d = 0.5 collapses
 *    ("finite nonzero source and output area"), d = 2 reverses ("opposes its
 *    transported surface orientation"); the input is unchanged.
 * 2. Local scales (0, -2, -2) over radius 1000 turn the face through 180 degrees
 *    with positive determinant: y of vertex 2 is 1 - 2 (1 - 1e-6)^3 < 0 and the
 *    normal turns to -z, admitted.
 * 3. A 1e-80 triangle passes unchanged (no absolute area floor); an empty index
 *    list moves the isolated origin to (2, 2, 0); an empty mesh stays empty.
 * 4. Two coordinates, two indices, index 0.5, -1 or 3, one normal, one point
 *    non-indexed, a collinear triangle and coordinates of 1e200 are refused
 *    ("Mesh deformation"); d = 1e308 overflows the area.
 * 5. The source normal (1, 1, 0) / sqrt(2) through cofactors whose transported
 *    components are about 1.48e308 (finite, norm overflowing) is admitted; an
 *    infinite cofactor is refused by name ("triangle 0 cannot transport its
 *    source orientation through vertex 0").
 */
export function test_engine_geometry_deformed_triangles(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    skin: null,
  };
  const field = (d: number): IAutoMovieMeshDeformationField => ({
    center: { x: 0, y: 0, z: 0 },
    radius: { x: 0.25, y: 0.25, z: 0.25 },
    displacement: { x: d, y: d, z: 0 },
    stretch: { x: 0, y: 0, z: 0 },
  });
  const flipped: number[] = mesh.normals!.map((v: number): number => -v);

  // 1.
  const before: string = JSON.stringify(mesh);
  for (const [label, variant] of [
    ["indexed", mesh],
    ["non-indexed", { ...mesh, indices: null }],
    ["normal-free", { ...mesh, normals: null }],
    ["reversed", { ...mesh, indices: [2, 1, 0], normals: flipped }],
    ["flipped normals", { ...mesh, normals: flipped }],
  ] satisfies [string, IAutoMovieMesh][]) {
    const p: number[] = AutoMovieEngineGeometry.createMeshDeformer([field(0.2)])(
      variant,
    ).positions;
    TestValidator.predicate(
      `${label} area`,
      nclose(
        (p[3]! - p[0]!) * (p[7]! - p[1]!) - (p[4]! - p[1]!) * (p[6]! - p[0]!),
        0.6,
      ),
    );
    TestValidator.predicate(
      `${label} collapse`,
      throwsError(
        (): unknown => AutoMovieEngineGeometry.createMeshDeformer([field(0.5)])(variant),
        "finite nonzero source and output area",
      ),
    );
    TestValidator.predicate(
      `${label} reversal`,
      throwsError(
        (): unknown => AutoMovieEngineGeometry.createMeshDeformer([field(2)])(variant),
        "opposes its transported surface orientation",
      ),
    );
  }
  TestValidator.equals("input kept", JSON.stringify(mesh), before);

  // 2.
  const turned: IAutoMovieMesh = AutoMovieEngineGeometry.createMeshDeformer([
    {
      ...field(0),
      radius: { x: 1000, y: 1000, z: 1000 },
      stretch: { x: 0, y: -2, z: -2 },
    },
  ])(mesh);
  TestValidator.predicate(
    "half turn",
    nclose(turned.positions[7]!, 1 - 2 * (1 - 1 / 1000 ** 2) ** 3) &&
      turned.positions[7]! < 0 &&
      turned.normals![2]! < 0,
  );

  // 3.
  const identity = AutoMovieEngineGeometry.createMeshDeformer([]);
  const tiny: IAutoMovieMesh = {
    ...mesh,
    positions: mesh.positions.map((v: number): number => v * 1e-80),
  };
  TestValidator.equals("tiny", identity(tiny).positions, tiny.positions);
  TestValidator.equals(
    "no faces",
    AutoMovieEngineGeometry.createMeshDeformer([field(2)])({ ...mesh, indices: [] }).positions,
    [2, 2, 0, 1, 0, 0, 0, 1, 0],
  );
  TestValidator.equals(
    "empty",
    identity({
      positions: [],
      normals: null,
      indices: null,
      uvs: null,
      skin: null,
    }).positions,
    [],
  );

  // 4.
  for (const [label, invalid] of [
    ["two coordinates", { ...mesh, positions: [0, 0] }],
    ["two indices", { ...mesh, indices: [0, 1] }],
    ["index 0.5", { ...mesh, indices: [0, 1, 0.5] }],
    ["index -1", { ...mesh, indices: [0, 1, -1] }],
    ["index 3", { ...mesh, indices: [0, 1, 3] }],
    ["one normal", { ...mesh, normals: [0, 0, 1] }],
    ["one point", { ...mesh, indices: null, positions: [0, 0, 0] }],
    ["collinear", { ...mesh, positions: [0, 0, 0, 1, 0, 0, 2, 0, 0] }],
    [
      "1e200",
      {
        ...mesh,
        positions: mesh.positions.map((v: number): number => v * 1e200),
      },
    ],
  ] satisfies [string, IAutoMovieMesh][])
    TestValidator.predicate(
      label,
      throwsError((): unknown => identity(invalid), "Mesh deformation"),
    );
  TestValidator.predicate(
    "area overflow",
    throwsError(
      (): unknown => AutoMovieEngineGeometry.createMeshDeformer([field(1e308)])(mesh),
      "finite nonzero source and output area",
    ),
  );

  // 5.
  const slanted: number[] = [0, 0, 0, 0, 0, 1, 1, -1, 0];
  const large: number[] = [1.5e308, 0.6e308, 0, 0.6e308, 1.5e308, 0, 0, 0, 1];
  const unit: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  AutoMovieEngineGeometry.assertDeformedTriangles(
    slanted,
    slanted,
    [0, 1, 2],
    [large, large, large],
  );
  TestValidator.predicate(
    "infinite cofactor",
    throwsError(
      (): unknown =>
        AutoMovieEngineGeometry.assertDeformedTriangles(
          slanted,
          slanted,
          [0, 1, 2],
          [[Infinity, 0, 0, 0, 1, 0, 0, 0, 1], unit, unit],
        ),
      "triangle 0 cannot transport its source orientation through vertex 0",
    ),
  );
}
