import { createAutoMovieMeshDeformer } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshDeformationInfluence,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../../../internal/equalGeometryTestValues";
import { nclose } from "../../../internal/nclose";

/**
 * Scaling a compact field and its sample together preserves the normalized
 * displacement and unit normal. The independent derivative at half radius is
 * -6*(3/4)^2*(1/2)*(1/10) = -27/160, at every representable scale tested.
 *
 * Scenarios:
 * 1. Unit, 1e-200 and 1e160 radii give height/radius=27/640 and the same
 *    normal, without squaring the physical radius into zero or infinity.
 * 2. Zero displacement is identity, including at a tiny field's centre.
 */
export function test_unit_engine_geometry_geometry_mesh_deformation_scale(): void {
  for (const radius of [1, 1e-200, 1e160]) {
    for (const amount of [0, 0.1]) {
      const apply: (
        mesh: IAutoMovieMesh,
        influence?: readonly IAutoMovieMeshDeformationInfluence[],
      ) => IAutoMovieMesh = createAutoMovieMeshDeformer([
        {
          center: { x: 0, y: 0, z: 0 },
          radius: { x: radius, y: radius, z: radius },
          displacement: { x: 0, y: 0, z: amount * radius },
          stretch: { x: 0, y: 0, z: 0 },
        },
      ]);
      const result: IAutoMovieMesh = apply({
        positions: [radius / 2, 0, 0, 0, 0, 0],
        indices: [],
        normals: [0, 0, 1, 0, 0, 1],
        uvs: null,
        skin: null,
      });
      const slope: number = (amount * 27) / 16;
      TestValidator.predicate(
        "scale-independent normalized displacement",
        nclose(result.positions[2] / radius, (amount * 27) / 64),
      );
      TestValidator.predicate(
        "scale-independent field normal",
        nclose(result.normals![0], slope / Math.hypot(slope, 1)) &&
          nclose(result.normals![2], 1 / Math.hypot(slope, 1)),
      );
      TestValidator.predicate(
        "centre retains zero slope",
        equalGeometryTestValues(result.normals!.slice(3), [0, 0, 1]),
      );
    }
  }
}
