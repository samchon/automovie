import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshDeformationField,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";
import { throwsError } from "../../internal/throwsError";

/**
 * `createMeshDeformer` applies compact-field influences to a mesh,
 * moving each vertex by displacement (1 - |x - c|^2 / r^2)^3 and transforming
 * normals by the map's inverse transpose, keeping unit normals where the
 * geometry stays representable.
 *
 * Scenarios:
 *
 * 1. Stretching the XY triangle (0,0,0), (1,0,0), (0,1,0) along X by 1e150 and by
 *    1e155 keeps its +Z unit normals (0,0,1) even though the cofactor magnitude
 *    exceeds what squares in Float64; a mesh without normals stays without.
 * 2. A field and its sample scaled together keep the normalized displacement and
 *    unit normal: at half radius the height over radius is 27 / 640 for amount
 *    0.1 (derivative -6 (3/4)^2 (1/2) (1/10) = -27/160 per radius) at radii 1,
 *    1e-200 and 1e160; amount 0 is the identity, and the centre keeps zero
 *    slope.
 * 3. Unit z displacement, radius 2, on points x = 0, 1, 2, 3: heights 1, 27/64, 0,
 *    0; the normal at x = 1 is (27/32, 0, 1) normalized (slope -27/32).
 *    Changing the field after compiling changes nothing; the input mesh is
 *    unchanged and its indices, UVs and skin are passed through.
 * 4. The six support poles (+-2 on each axis) and the diagonals (1.6, 1.6, 0),
 *    inside the bounding box but outside the ellipsoid, stay put; no fields is
 *    the identity; no normals stays null; an empty mesh stays empty.
 * 5. Radii (0, 2, 2) and (-1, 2, 2) ("finite vectors and strictly positive
 *    radii"), local x stretches -2 and -1, a MAX_VALUE stretch and two
 *    MAX_VALUE displacements ("local surface orientation") are refused; stretch
 *    -0.99 is admitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names extreme finite stretch and gradient scale, compact support, buffer ownership and rejected orientation inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Deforms real triangles and vertices through compiled fields, then reads coordinates, normals and pass-through data before and after input edits.
 * @evidence contracts/development/testing.md#independent-expectations The written cubic falloff is 27/64 at half radius. Its derivative yields the expected tilted normal. Outside the ellipsoid the field is zero.
 */
export function test_engine_geometry_mesh_deformer(): void {
  const triangle: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    skin: null,
  };

  // 1.
  for (const stretch of [1e150, 1e155]) {
    const apply = AutoMovieEngineGeometry.createMeshDeformer([
      {
        center: { x: 0, y: 0, z: 0 },
        radius: { x: 1e160, y: 1e160, z: 1e160 },
        displacement: { x: 0, y: 0, z: 0 },
        stretch: { x: stretch, y: 0, z: 0 },
      },
    ]);
    TestValidator.equals(
      `normals ${stretch}`,
      apply(triangle).normals,
      triangle.normals,
    );
    TestValidator.equals(
      `no normals ${stretch}`,
      apply({ ...triangle, normals: null }).normals,
      null,
    );
  }

  // 2.
  for (const radius of [1, 1e-200, 1e160])
    for (const amount of [0, 0.1]) {
      const influence: IAutoMovieMeshDeformationField = {
        center: { x: 0, y: 0, z: 0 },
        radius: { x: radius, y: radius, z: radius },
        displacement: { x: 0, y: 0, z: amount * radius },
        stretch: { x: 0, y: 0, z: 0 },
      };
      const result: IAutoMovieMesh = AutoMovieEngineGeometry.createMeshDeformer([influence])({
        positions: [radius / 2, 0, 0, 0, 0, 0],
        indices: [],
        normals: [0, 0, 1, 0, 0, 1],
        uvs: null,
        skin: null,
      });
      const slope: number = (amount * 27) / 16;
      TestValidator.predicate(
        `height ${radius}/${amount}`,
        nclose(result.positions[2]! / radius, (amount * 27) / 64, 1e-12),
      );
      TestValidator.predicate(
        `normal x ${radius}/${amount}`,
        nclose(result.normals![0]!, slope / Math.hypot(slope, 1), 1e-12),
      );
      TestValidator.predicate(
        `normal z ${radius}/${amount}`,
        nclose(result.normals![2]!, 1 / Math.hypot(slope, 1), 1e-12),
      );
      TestValidator.equals(
        `centre ${radius}/${amount}`,
        result.normals!.slice(3),
        [0, 0, 1],
      );
    }

  // 3.
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const field: IAutoMovieMeshDeformationField = {
    center: { ...zero },
    radius: { x: 2, y: 2, z: 2 },
    displacement: { x: 0, y: 0, z: 1 },
    stretch: { ...zero },
  };
  const line: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0, 0, 1, 0],
    indices: [0, 1, 4],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: new Array(10).fill(0),
    skin: null,
  };
  const before: string = JSON.stringify(line);
  const apply = AutoMovieEngineGeometry.createMeshDeformer([field]);
  field.displacement.z = 100;
  const lifted: IAutoMovieMesh = apply(line);
  const length: number = Math.hypot(27 / 32, 1);
  TestValidator.predicate(
    "heights",
    nclose(lifted.positions[2]!, 1) &&
      nclose(lifted.positions[5]!, 27 / 64) &&
      lifted.positions[8] === 0 &&
      lifted.positions[11] === 0,
  );
  TestValidator.predicate(
    "inverse-transpose normal",
    nclose(lifted.normals![3]!, 27 / 32 / length) &&
      nclose(lifted.normals![4]!, 0) &&
      nclose(lifted.normals![5]!, 1 / length),
  );
  TestValidator.equals("input kept", JSON.stringify(line), before);
  TestValidator.predicate(
    "attributes passed",
    lifted.indices === line.indices &&
      lifted.uvs === line.uvs &&
      lifted.skin === line.skin,
  );

  // 4.
  const outside: number[] = [
    2, 0, 0, -2, 0, 0, 0, 2, 0, 0, -2, 0, 0, 0, 2, 0, 0, -2, 1.6, 1.6, 0, 1.6,
    0, 1.6, 0, 1.6, 1.6,
  ];
  TestValidator.equals(
    "outside support",
    apply({
      ...line,
      positions: outside,
      normals: null,
      indices: null,
      uvs: null,
    }).positions,
    outside,
  );
  TestValidator.equals(
    "no fields",
    AutoMovieEngineGeometry.createMeshDeformer([])(line),
    line,
  );
  TestValidator.equals(
    "no normals",
    apply({ ...line, normals: null }).normals,
    null,
  );
  TestValidator.equals(
    "empty",
    apply({ positions: [], indices: [], normals: [], uvs: null, skin: null })
      .positions,
    [],
  );

  // 5.
  const base: IAutoMovieMeshDeformationField = {
    ...field,
    displacement: { x: 0, y: 0, z: 1 },
  };
  for (const radius of [
    { x: 0, y: 2, z: 2 },
    { x: -1, y: 2, z: 2 },
  ])
    TestValidator.predicate(
      `radius ${radius.x}`,
      throwsError(
        (): unknown => AutoMovieEngineGeometry.createMeshDeformer([{ ...base, radius }]),
        "finite vectors and strictly positive radii",
      ),
    );
  const M: number = Number.MAX_VALUE;
  const huge: IAutoMovieMeshDeformationField = {
    ...base,
    displacement: { x: 0, y: 0, z: M },
  };
  for (const [label, fields] of [
    [
      "stretch -2",
      [{ ...base, displacement: zero, stretch: { x: -2, y: 0, z: 0 } }],
    ],
    [
      "stretch -1",
      [{ ...base, displacement: zero, stretch: { x: -1, y: 0, z: 0 } }],
    ],
    ["stretch MAX", [{ ...base, stretch: { x: M, y: M, z: M } }]],
    ["displacement MAX twice", [huge, huge]],
  ] satisfies [string, IAutoMovieMeshDeformationField[]][])
    TestValidator.predicate(
      label,
      throwsError(
        (): unknown => AutoMovieEngineGeometry.createMeshDeformer(fields)(line),
        "local surface orientation",
      ),
    );
  AutoMovieEngineGeometry.createMeshDeformer([
    { ...base, displacement: zero, stretch: { x: -0.99, y: 0, z: 0 } },
  ])(line);
}
