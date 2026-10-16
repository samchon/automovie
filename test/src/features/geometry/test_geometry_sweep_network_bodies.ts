import {
  type AutoMovieSurfaceTier,
  type IAutoMovieSurfaceNetwork,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { sweepBottle } from "../internal/sweepBottle";
import { sweepHoledNetwork } from "../internal/sweepHoledNetwork";
import { sweepManifold } from "../internal/sweepManifold";

const TIERS: AutoMovieSurfaceTier[] = ["lowest", "low", "medium", "high"];

/**
 * The bottle's and the holed network's sampled cages are closed
 * 2-manifolds except at their declared rings at every tier, and an
 * undeclared opening is caught.
 *
 * Scenarios:
 *
 * 1. The bottle and the holed network, with their Coons heel band, curve
 *    sides and holes, at all four tiers: every directed edge appears once, every
 *    edge borders one or two faces, the one-face edges are exactly the
 *    declared rings, and every vertex's faces form a single fan.
 * 2. A boundary missing a ring fails the manifold check: dropping the
 *    bottle's mouth ring leaves its mouth as an undeclared opening.
 *
 * @evidence contracts/testing.md#behavioral-verification Samples networks with `sampleAutoMovieSurfaceNetwork` and inspects the cages; welding that missed a shared side leaves a one-face edge off any ring, overlapping or flipped patches repeat a directed edge, and a pinched vertex splits its fan, while any closed, consistently wound layout passes.
 * @evidence contracts/testing.md#independent-expectations The manifold, ring and fan conditions are computed in this test from the faces and the published rings alone.
 * @evidence contracts/testing.md#distinguishing-cases Covers sweep, Coons and curve patches, reported rings and holes, every tier, and the negative of an undeclared opening; the branched body is owned by the network cage test, symmetry and shape invariance are owned by the network mirror test and positions by the rig and Gordon tests.
 * @evidence contracts/testing.md#execution-ownership A portable unit test reached through the discoverable `test_geometry_sweep_network_bodies` entry with no process, browser or GPU.
 */
export function test_geometry_sweep_network_bodies(): void {
  const bodies: Array<[string, IAutoMovieSurfaceNetwork]> = [
    ["bottle", sweepBottle()],
    ["holed", sweepHoledNetwork()],
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

  const open: IAutoMovieSurfaceNetwork = { ...sweepBottle(), rings: [] };
  TestValidator.equals(
    "an opening without a ring is caught",
    sweepManifold(sampleAutoMovieSurfaceNetwork({ network: open, tier: "low" }))
      .boundaryIsRings,
    false,
  );
}
