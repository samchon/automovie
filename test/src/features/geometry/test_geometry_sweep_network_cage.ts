import {
  type AutoMovieSurfaceTier,
  type IAutoMovieSurfaceNetwork,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { sweepBranchedBody } from "../internal/sweepBranchedBody";
import { sweepManifold } from "../internal/sweepManifold";

const TIERS: AutoMovieSurfaceTier[] = ["lowest", "low", "medium", "high"];

/**
 * The branched body's sampled cage is a closed 2-manifold except at its
 * declared rings at every tier.
 *
 * Scenarios:
 *
 * 1. The branched body at all four tiers, with its sweep, bridge and curve
 *    patches, pinned and reported rings, guides and features: every directed edge appears once, every
 *    edge borders one or two faces, the one-face edges are exactly the
 *    declared rings, and every vertex's faces form a single fan.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples networks with `sampleAutoMovieSurfaceNetwork` and inspects the cages; welding that missed a shared side leaves a one-face edge off any ring, overlapping or flipped patches repeat a directed edge, and a pinched vertex splits its fan, while any closed, consistently wound layout passes.
 * @evidence contracts/testing.md#independent-expectations The manifold, ring and fan conditions are computed in this test from the faces and the published rings alone.
 * @evidence contracts/testing.md#distinguishing-cases Covers sweep, bridge and curve patches, pinned and reported rings, every tier, guides and features; Coons patches and the negative of an undeclared opening are owned by the network bodies test, symmetry and shape invariance are owned by the network mirror test and positions by the rig and Gordon tests.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_network_cage` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_network_cage(): void {
  const bodies: Array<[string, IAutoMovieSurfaceNetwork]> = [
    ["branched", sweepBranchedBody()],
  ];
  for (const [name, network] of bodies)
    TestValidator.equals(
      `the ${name} cage is closed except at its rings at every tier`,
      TIERS.map(
        (tier: AutoMovieSurfaceTier): Record<string, boolean> =>
          sweepManifold(sampleAutoMovieSurfaceNetwork({ network, tier })),
      ),
      TIERS.map(
        (): Record<string, boolean> => ({
          wound: true,
          twoFaced: true,
          boundaryIsRings: true,
          fans: true,
        }),
      ),
    );
}
