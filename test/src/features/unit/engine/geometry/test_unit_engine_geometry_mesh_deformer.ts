import { createAutoMovieMeshDeformer } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshDeformationInfluence,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

/**
 * `createAutoMovieMeshDeformer` applies compact-field influences to a mesh,
 * keeping unit normals where the geometry stays representable.
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
 */
export function test_unit_engine_geometry_mesh_deformer(): void {
  const triangle: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    skin: null,
  };
  for (const stretch of [1e150, 1e155]) {
    const apply = createAutoMovieMeshDeformer([
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
  for (const radius of [1, 1e-200, 1e160])
    for (const amount of [0, 0.1]) {
      const influence: IAutoMovieMeshDeformationInfluence = {
        center: { x: 0, y: 0, z: 0 },
        radius: { x: radius, y: radius, z: radius },
        displacement: { x: 0, y: 0, z: amount * radius },
        stretch: { x: 0, y: 0, z: 0 },
      };
      const result: IAutoMovieMesh = createAutoMovieMeshDeformer([influence])({
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
}
