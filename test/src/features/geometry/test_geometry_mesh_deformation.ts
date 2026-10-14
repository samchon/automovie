import {
  type IAutoMovieMesh,
  type IAutoMovieMeshDeformationField,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieMeshDeformationInfluence } from "@automovie/engine";
import { createAutoMovieMeshDeformer } from "@automovie/engine";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Compact spatial fields move vertices and transform normals by their actual
 * Jacobian. The check uses independent polynomial derivatives on a flat plane.
 *
 * Scenarios:
 * 1. Unit Z displacement with radius 2 gives height (3/4)^3 and slope -27/32
 *    at X=1, while points at/outside support keep their coordinates.
 * 2. Empty and normal-free meshes remain valid; compiled fields own their
 *    inputs and geometry connectivity/UV/skin metadata are retained.
 * 3. Invalid field vectors/radii, local reflection/singularity and nonfinite
 *    accumulated geometry are refused, with a nearby positive Jacobian allowed.
 * 4. All six support faces and diagonals outside the ellipsoid retain their
 *    coordinates, including points inside its bounding box but outside its field.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes compiled compact-field deformation, checking polynomial displacement and transported normals, support-boundary identity, copied field ownership, preserved input/metadata and refusals for malformed or orientation-reversing maps. It detects incorrect gradients or silently mutated geometry while allowing an adjacent positive Jacobian.
 * @evidence contracts/testing.md#independent-expectations At x=1, the authored radius-two kernel gives (3/4)^3=27/64 and derivative -27/32; normalizing the independently derived plane normal gives the expected components. Identity outside compact support follows zero kernel weight. Endpoint differential and triangle checks do not prove global embedding, continuous collision freedom or GPU appearance.
 * @evidence contracts/testing.md#distinguishing-cases Retains center/interior/boundary/exterior samples, all six support faces and diagonals, empty and normal-free meshes, copied fields, metadata, invalid field parameters, reflection/singularity and overflow. Mask product derivatives, extreme scales and tessellated-face orientation have companion tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly calls portable deformation source with unchanged synthetic buffers and existing exception observation. It creates no Human asset or new case, starts no process, browser, GPU or native build and registers no dynamic tests.
 */
export function test_geometry_mesh_deformation(): void {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const field: IAutoMovieMeshDeformationField = {
    center: { ...zero },
    radius: { x: 2, y: 2, z: 2 },
    displacement: { x: 0, y: 0, z: 1 },
    stretch: { ...zero },
  };
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 2, 0, 0, 3, 0, 0, 0, 1, 0],
    indices: [0, 1, 4],
    normals: Array.from({ length: 5 }, (): number[] => [0, 0, 1]).flat(),
    uvs: new Array(10).fill(0),
    skin: null,
  };
  const before: IAutoMovieMesh = structuredClone(mesh),
    apply: (
      mesh: IAutoMovieMesh,
      influence?: readonly IAutoMovieMeshDeformationInfluence[],
    ) => IAutoMovieMesh = createAutoMovieMeshDeformer([field]);
  field.displacement.z = 100;
  const result: IAutoMovieMesh = apply(mesh),
    length: number = Math.hypot(27 / 32, 1);
  TestValidator.predicate(
    "independent displacement polynomial",
    nclose(result.positions[2], 1) &&
      nclose(result.positions[5], 27 / 64) &&
      nclose(result.positions[8], 0, 0) &&
      nclose(result.positions[11], 0, 0),
  );
  TestValidator.predicate(
    "inverse-transpose normal",
    nclose(result.normals![3], 27 / 32 / length) &&
      nclose(result.normals![4], 0) &&
      nclose(result.normals![5], 1 / length),
  );
  TestValidator.predicate(
    "input geometry retained",
    equalGeometryTestValues(mesh, before),
  );
  const boundaries: number[] = [
    2, 0, 0, -2, 0, 0, 0, 2, 0, 0, -2, 0, 0, 0, 2, 0, 0, -2, 1.6, 1.6, 0, 1.6,
    0, 1.6, 0, 1.6, 1.6,
  ];
  TestValidator.predicate(
    "support faces and exterior diagonals remain unchanged",
    equalGeometryTestValues(
      apply({
        ...mesh,
        positions: boundaries,
        normals: null,
        indices: null,
        uvs: null,
      }).positions,
      boundaries,
    ),
  );
  TestValidator.predicate(
    "attribute ownership retained",
    result.indices === mesh.indices &&
      result.uvs === mesh.uvs &&
      result.skin === mesh.skin,
  );
  TestValidator.predicate(
    "empty field geometry",
    equalGeometryTestValues(createAutoMovieMeshDeformer([])(mesh), mesh),
  );
  TestValidator.equals(
    "normal-free mesh",
    apply({ ...mesh, normals: null }).normals,
    null,
  );
  TestValidator.equals(
    "empty mesh",
    apply({ positions: [], indices: [], normals: [], uvs: null, skin: null })
      .positions,
    [],
  );
  for (const change of [
    { radius: { x: 0, y: 2, z: 2 } },
    { radius: { x: -1, y: 2, z: 2 } },
    { center: { x: NaN, y: 0, z: 0 } },
    { displacement: { x: 0, y: Infinity, z: 0 } },
    { stretch: { x: 0, y: 0, z: NaN } },
  ])
    TestValidator.predicate(
      "invalid field refused",
      throwsError(
        (): ((
          mesh: IAutoMovieMesh,
          influence?: readonly IAutoMovieMeshDeformationInfluence[],
        ) => IAutoMovieMesh) =>
          createAutoMovieMeshDeformer([{ ...field, ...change }]),
        "finite vectors and strictly positive radii",
      ),
    );
  for (const stretch of [-2, -1])
    TestValidator.predicate(
      "orientation reversal refused",
      throwsError(
        (): IAutoMovieMesh =>
          createAutoMovieMeshDeformer([
            {
              ...field,
              displacement: zero,
              stretch: { x: stretch, y: 0, z: 0 },
            },
          ])(mesh),
        "local surface orientation",
      ),
    );
  createAutoMovieMeshDeformer([
    { ...field, displacement: zero, stretch: { x: -0.99, y: 0, z: 0 } },
  ])(mesh);
  TestValidator.predicate(
    "overflowing Jacobian refused",
    throwsError(
      (): IAutoMovieMesh =>
        createAutoMovieMeshDeformer([
          {
            ...field,
            stretch: {
              x: Number.MAX_VALUE,
              y: Number.MAX_VALUE,
              z: Number.MAX_VALUE,
            },
          },
        ])(mesh),
      "local surface orientation",
    ),
  );
  const huge: {
    displacement: IAutoMovieVector3;
    center: IAutoMovieVector3;
    radius: IAutoMovieVector3;
    stretch: IAutoMovieVector3;
  } = { ...field, displacement: { x: 0, y: 0, z: Number.MAX_VALUE } };
  TestValidator.predicate(
    "nonfinite accumulated displacement refused",
    throwsError(
      (): IAutoMovieMesh => createAutoMovieMeshDeformer([huge, huge])(mesh),
      "local surface orientation",
    ),
  );
}
