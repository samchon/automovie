import { sampleAutoMovieSurfaceNetwork } from "@automovie/engine";
import type {
  AutoMovieSurfaceTier,
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceNetwork,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepBottle } from "../../../internal/sweepBottle";
import { sweepBranchedBody } from "../../../internal/sweepBranchedBody";
import { sweepHoledNetwork } from "../../../internal/sweepHoledNetwork";
import { sweepManifold } from "../../../internal/sweepManifold";

/**
 * `sampleAutoMovieSurfaceNetwork` samples a surface network into a cage that is
 * a closed 2-manifold except at its declared rings, at every tier.
 *
 * Scenarios:
 *
 * 1. The bottle (Coons heel band, curve sides), the holed network and the branched
 *    body, at the lowest, low, medium and high tiers: every directed edge
 *    appears once, every edge borders one or two faces, the one-face edges are
 *    exactly the declared rings, and every vertex's faces form one fan.
 * 2. Dropping the bottle's rings leaves its mouth an undeclared opening, and the
 *    ring check reports it.
 * 3. Reshaping the branched body (breadth 1.15, branch 0.9) keeps every face, UV
 *    face, corner and ring of the cage at the lowest and high tiers while its
 *    target points move by more than 1e-3.
 */
export function test_unit_engine_geometry_sweep_network(): void {
  const tiers: AutoMovieSurfaceTier[] = ["lowest", "low", "medium", "high"];
  const bodies: [string, IAutoMovieSurfaceNetwork][] = [
    ["bottle", sweepBottle()],
    ["holed", sweepHoledNetwork()],
    ["branched", sweepBranchedBody()],
  ];
  for (const [name, network] of bodies)
    for (const tier of tiers)
      TestValidator.equals(
        `${name} ${tier}`,
        sweepManifold(sampleAutoMovieSurfaceNetwork({ network, tier })),
        {
          wound: true,
          twoFaced: true,
          boundaryIsRings: true,
          fans: true,
        },
      );
  const open: IAutoMovieSurfaceNetwork = { ...sweepBottle(), rings: [] };
  TestValidator.equals(
    "undeclared opening",
    sweepManifold(sampleAutoMovieSurfaceNetwork({ network: open, tier: "low" }))
      .boundaryIsRings,
    false,
  );
  const edges: AutoMovieSurfaceTier[] = ["lowest", "high"];
  const body: IAutoMovieSurfaceNetwork = sweepBranchedBody();
  const reshaped: IAutoMovieSurfaceNetwork = sweepBranchedBody({
    breadth: 1.15,
    branch: 0.9,
  });
  const topology = (cage: IAutoMovieSurfaceCage): string =>
    JSON.stringify([
      cage.cage.faces,
      cage.cage.uvFaces,
      cage.corners,
      cage.rings,
    ]);
  for (const tier of edges) {
    const a: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
      network: body,
      tier,
    });
    const b: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
      network: reshaped,
      tier,
    });
    TestValidator.equals(`topology ${tier}`, topology(a), topology(b));
    TestValidator.predicate(
      `points move ${tier}`,
      a.targets.some(
        (x: number, k: number): boolean => Math.abs(x - b.targets[k]!) > 1e-3,
      ),
    );
  }
}
