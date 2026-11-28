import { TestValidator } from "@nestia/e2e";

import { ConstructionSplitSeam as S } from "../../internal/construction/ConstructionSplitSeam";

/**
 * The curved-seam split's skin is watertight.
 *
 * Fixture: `ConstructionSplitSeam` with its profile, realized with its skin at
 * chord 1e-4 m.
 *
 * Scenarios:
 *
 * 1. Every edge of the skin is used by exactly two triangles except the edges on
 *    the free ends (z = 0.06 and z = -0.11 m), and none by more.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the closed curved-seam interior and two specified free-end planes.
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the profiled split at the stated chord and counts incidences on its emitted triangle edges.
 * @evidence contracts/development/testing.md#independent-expectations Each interior edge of the watertight surface must have exactly two uses. The specified free-end planes explain the permitted boundary edges.
 */
export function test_engine_geometry_split_seam_skin(): void {
  const real = S.realize(S.split(S.profile()), true);
  TestValidator.equals("diagnostics", real.diagnostics.length, 0);
  const uses: Map<string, number> = new Map();
  const ix: number[] = real.mesh.indices;
  for (let t: number = 0; t + 2 < ix.length; t += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = ix[t + e]!;
      const b: number = ix[t + ((e + 1) % 3)]!;
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const free = (v: number): boolean =>
    [0.06, -0.11].some(
      (z: number): boolean =>
        Math.abs(real.mesh.positions[3 * v + 2]! - z) < 1e-7,
    );
  let open: number = 0;
  let over: number = 0;
  for (const [key, count] of uses) {
    if (count > 2) ++over;
    if (
      count === 1 &&
      !key.split(",").every((v: string): boolean => free(Number(v)))
    )
      ++open;
  }
  TestValidator.equals("open edges", open, 0);
  TestValidator.equals("over-used edges", over, 0);
}
