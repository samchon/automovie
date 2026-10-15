import { type AutoMovieSurfaceTier, type IAutoMovieSurfaceCage, type IAutoMovieSurfaceNetwork, sampleAutoMovieSurfaceNetwork } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { sweepBranchedBody } from "../internal/sweepBranchedBody";

/**
 * A tier's topology does not depend on the network's shape: a reshaped body
 * keeps every face, UV face, face coordinate and ring vertex while its
 * points move.
 *
 * Scenarios:
 *
 * 1. The branched body with its breadth and branch size changed, at the
 *    lowest and high tiers.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples two shapes of one layout with `sampleAutoMovieSurfaceNetwork` and compares their topology; shape-dependent welding or counts change the faces, while a layout-determined sampling passes.
 * @evidence contracts/testing.md#independent-expectations Both samplings come from the same layout, so their topology must agree exactly; the targets must differ, ruling out comparing one shape with itself.
 * @evidence contracts/testing.md#distinguishing-cases Covers the coarsest and finest tiers and a shape change across every patch kind; symmetry is owned by the network mirror test and closure by the network cage test.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_network_topology` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_network_topology(): void {
  const body: IAutoMovieSurfaceNetwork = sweepBranchedBody();
  const reshaped: IAutoMovieSurfaceNetwork = sweepBranchedBody({ breadth: 1.15, branch: 0.9 });
  TestValidator.equals(
    "a reshaped body keeps every tier's topology",
    (["lowest", "high"] as AutoMovieSurfaceTier[]).map((tier: AutoMovieSurfaceTier): boolean => {
      const a: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({ network: body, tier });
      const b: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({ network: reshaped, tier });
      return (
        JSON.stringify([a.cage.faces, a.cage.uvFaces, a.corners, a.rings]) === JSON.stringify([b.cage.faces, b.cage.uvFaces, b.corners, b.rings]) &&
        a.targets.some((x: number, k: number): boolean => Math.abs(x - b.targets[k]!) > 1e-3)
      );
    }),
    [true, true],
  );
}
