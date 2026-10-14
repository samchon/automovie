import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieMeshDeformationInfluence } from "@automovie/engine";
import { createAutoMovieMeshDeformer } from "@automovie/engine";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";

/**
 * Scaling a compact field and its sample together preserves the normalized
 * displacement and unit normal. The independent derivative at half radius is
 * -6*(3/4)^2*(1/2)*(1/10) = -27/160, at every representable scale tested.
 *
 * Scenarios:
 * 1. Unit, 1e-200 and 1e160 radii give height/radius=27/640 and the same
 *    normal, without squaring the physical radius into zero or infinity.
 * 2. Zero displacement is identity, including at a tiny field's centre.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs compact deformation at unit, tiny and huge radii, asserting normalized displacement, field normal and center zero-slope normal for zero and nonzero amounts. It catches physical-radius squaring that underflows or overflows despite representable normalized inputs.
 * @evidence contracts/testing.md#independent-expectations At half radius the weight is 27/64 and the displacement derivative for amount 0.1 is -27/160; normal direction follows the independently normalized plane slope. Scaling both radius and sample preserves these dimensionless quantities. The original nclose tolerances are retained and do not establish every representable scale or pixel equivalence.
 * @evidence contracts/testing.md#distinguishing-cases Keeps radii 1, 1e-200 and 1e160, amounts zero and 0.1, and center versus half-radius samples. Extreme cofactor normalization, malformed inputs and triangle orientation belong to the companion deformation tests.
 * @evidence contracts/testing.md#execution-ownership The named entry directly executes portable deformation source with the existing normal-bearing point buffers and no new geometry cases. It starts no process, browser, GPU or native build, installs no consumer and registers no dynamic cases.
 */
export function test_geometry_mesh_deformation_scale(): void {
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
