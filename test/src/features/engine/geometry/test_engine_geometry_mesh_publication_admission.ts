import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshDefect,
  IAutoMovieMeshTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Mesh placement and measurement retain valid empty and represented extreme
 * values while refusing invalid coordinates, topology addresses and options.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names reflection, inverse normals, signed-volume recovery, finite-cell addressing and empty groups.
 * @evidence contracts/development/testing.md#behavioral-verification Measures ordinary and extreme placed meshes, open and closed volumes, typed triangle buffers, and malformed values at all three public boundaries. The assembly also exercises a transformed zero-count group.
 * @evidence contracts/development/testing.md#independent-expectations Reflection reverses triangle order. The inverse of a positive axis scale preserves that axis's normal direction. An axis tetrahedron occupies one sixth of its box. A right isosceles triangle's dimensionless aspect is two at every scale, and a collinear triple on distinct cells has infinite aspect. Empty topology carries zero volume and no edge incidence.
 */
export function test_engine_geometry_mesh_publication_admission(): void {
  const geometry = AutoMovieEngineGeometry;
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
  const empty: IAutoMovieMesh = { ...mesh, positions: [], indices: [] };
  const normalMesh: IAutoMovieMesh = {
    ...mesh,
    normals: [1, 0, 0, 1, 0, 0, 1, 0, 0],
    uvs: [0, 0, 1, 0, 0, 1],
  };
  const reflected = geometry.transformMesh(normalMesh, {
    scale: { x: -2, y: 3, z: 4 },
    translation: { x: 2, y: 0, z: 0 },
  });
  TestValidator.equals(
    "finite reflected position and index order",
    [reflected.positions, reflected.indices!],
    [
      [2, 0, 0, 0, 0, 0, 2, 3, 0],
      [0, 2, 1],
    ],
  );
  TestValidator.equals(
    "inverse normals and source chart",
    [reflected.normals!, reflected.uvs!],
    [[-1, 0, 0, -1, 0, 0, -1, 0, 0], normalMesh.uvs!],
  );
  TestValidator.equals(
    "subnormal axis still gives a finite unit normal",
    geometry.transformMesh(normalMesh, {
      scale: { x: Number.MIN_VALUE, y: 1, z: 1 },
    }).normals,
    normalMesh.normals,
  );
  const tiny = Number.MIN_VALUE;
  const inverseSmall = geometry.transformMesh(
    { ...mesh, normals: [tiny, tiny, 0, tiny, tiny, 0, tiny, tiny, 0] },
    { scale: { x: 3, y: 1, z: 1 } },
  ).normals!;
  TestValidator.predicate(
    "small reciprocal ratios retain their relative direction",
    Math.abs(inverseSmall[0]! - 1 / Math.sqrt(10)) < 1e-15 &&
      Math.abs(inverseSmall[1]! - 3 / Math.sqrt(10)) < 1e-15,
  );
  TestValidator.equals(
    "finite zero normals stay zero",
    geometry.transformMesh(
      { ...mesh, normals: new Array<number>(9).fill(0) },
      {},
    ).normals,
    new Array<number>(9).fill(0),
  );
  const badTransforms: [IAutoMovieMeshTransform, string][] = [
    [{ rotation: { x: NaN, y: 0, z: 0, w: 1 } }, "unit quaternion"],
    [
      { translation: { x: Infinity, y: 0, z: 0 } },
      "translation and scale must be finite",
    ],
    [
      { scale: { x: Infinity, y: 1, z: 1 } },
      "translation and scale must be finite",
    ],
  ];
  for (const [placement, message] of badTransforms)
    TestValidator.predicate(
      "placement field refusal",
      throwsError(() => geometry.transformMesh(mesh, placement), message),
    );
  TestValidator.predicate(
    "finite affine overflow refuses publication",
    throwsError(
      () =>
        geometry.transformMesh(
          {
            ...mesh,
            positions: [Number.MAX_VALUE, ...mesh.positions.slice(1)],
          },
          { scale: { x: 2, y: 1, z: 1 } },
        ),
      "positions must remain finite",
    ),
  );
  const assembly = geometry.mergeMeshParts([
    { id: "", mesh, transform: {} },
    { id: "empty", mesh: empty, transform: {} },
  ]);
  TestValidator.equals("exact string names and zero group", assembly.groups, [
    { id: "", start: 0, count: 3 },
    { id: "empty", start: 3, count: 0 },
  ]);

  const tetra = (side: number): IAutoMovieMesh => ({
    ...mesh,
    positions: [0, 0, 0, side, 0, 0, 0, side, 0, 0, 0, side],
    indices: [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3],
  });
  const unit = geometry.inspectMeshTopology(tetra(1));
  TestValidator.equals(
    "unit tetrahedral measure",
    [unit.volume, unit.boundaryEdges, unit.triangles],
    [1 / 6, 0, 4],
  );
  const side = 1e103;
  const expectedVolume = (side / 6) * side * side;
  const large = geometry.inspectMeshTopology(tetra(side));
  TestValidator.predicate(
    "exact final volume survives an overflowing six-volume",
    large.watertight && Math.abs(large.volume / expectedVolume - 1) < 1e-15,
  );
  const opposite = tetra(side);
  opposite.indices = [...opposite.indices!].reverse();
  TestValidator.equals(
    "volume keeps its winding sign",
    geometry.inspectMeshTopology(opposite).volume,
    -large.volume,
  );
  TestValidator.predicate(
    "truly unrepresentable volume refuses",
    throwsError(
      () => geometry.inspectMeshTopology(tetra(1e104)),
      "signed volume is outside finite range",
    ),
  );
  TestValidator.equals(
    "origin plane remains exact zero after intermediate overflow",
    geometry.inspectMeshTopology({
      ...mesh,
      positions: [0, 0, 0, 1e200, 0, 0, 0, 1e200, 0],
    }).volume,
    0,
  );
  const emptyTopology = geometry.inspectMeshTopology({
    ...empty,
    positions: [Number.MAX_VALUE, 0, 0],
  });
  TestValidator.equals(
    "unused finite vertex leaves empty incidence",
    [
      emptyTopology.triangles,
      emptyTopology.boundaryEdges,
      emptyTopology.volume,
    ],
    [0, 0, 0],
  );
  TestValidator.predicate(
    "nonfinite topology positions refuse",
    throwsError(
      () =>
        geometry.inspectMeshTopology({
          ...mesh,
          positions: [NaN, ...mesh.positions.slice(1)],
        }),
      "positions must be finite",
    ),
  );
  TestValidator.predicate(
    "finite coordinate with a nonfinite weld cell refuses",
    throwsError(
      () =>
        geometry.inspectMeshTopology({
          ...mesh,
          positions: [Number.MAX_VALUE, ...mesh.positions.slice(1)],
        }),
      "unrepresentable weld cell",
    ),
  );

  const defects: IAutoMovieMeshDefect[] = [
    { kind: "sliver", vertices: [0, 1, 2] },
    { kind: "open", vertices: [0, 1] },
    { kind: "open", vertices: [1, 2] },
    { kind: "open", vertices: [2, 0] },
  ];
  TestValidator.equals(
    "typed buffers preserve aspect and defect order",
    geometry.measureMeshDefects(
      {
        positions: new Float32Array(mesh.positions),
        indices: new Uint16Array([0, 1, 2]),
      },
      { sliver: 1.5 },
    ),
    defects,
  );
  for (const [edge, weld] of [
    [1e160, 1e9],
    [1e-180, 1e200],
  ])
    TestValidator.equals(
      "right triangle keeps its dimensionless aspect",
      geometry.measureMeshDefects(
        {
          positions: [0, 0, 0, edge!, 0, 0, 0, edge!, 0],
          indices: null,
        },
        { weld, sliver: 1.5 },
      ),
      defects,
    );
  TestValidator.equals(
    "collinear infinite aspect remains a legitimate defect",
    geometry.measureMeshDefects(
      { positions: [0, 0, 0, 1, 0, 0, 2, 0, 0], indices: null },
      { sliver: 3 },
    ),
    defects,
  );
  TestValidator.equals(
    "empty mesh has no located defects",
    geometry.measureMeshDefects(empty),
    [],
  );
  TestValidator.predicate(
    "fractional vertex cannot create an incidence record",
    throwsError(
      () => geometry.measureMeshDefects({ ...mesh, indices: [0.5, 1, 2] }),
      "at corner 0",
    ),
  );
  for (const coordinate of [NaN, Number.MAX_VALUE])
    TestValidator.predicate(
      "invalid weld cell",
      throwsError(
        () =>
          geometry.measureMeshDefects({
            ...mesh,
            positions: [coordinate, ...mesh.positions.slice(1)],
          }),
        "no finite lattice cell",
      ),
    );
  for (const invalid of [NaN, Infinity])
    for (const options of [{ weld: invalid }, { sliver: invalid }])
      TestValidator.predicate(
        "options require finite positive values",
        throwsError(
          () => geometry.measureMeshDefects(mesh, options),
          "not a positive finite",
        ),
      );
}
