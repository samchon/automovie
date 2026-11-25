import { physicalIcpPlanner, physicalIcpPlannerCmps } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The 201903 reference pivots land where IHMC's calculator puts them
 * (`ReferenceCentroidalMomentumPivotLocationsCalculator` l.546-797), with the
 * planner's parameters: Atlas's offsets and bounds, the code's 1/3 step share
 * and 1 cm safe distance.
 *
 * Feet are 22 x 10 cm rectangles centred on their soles, facing world +x; a
 * sole's left is world -z. The left support sole is at the origin and the right
 * foot steps to world (0.3, 0.2), 0.3 m ahead and 0.2 m right.
 *
 * 1. The left foot's entry pivot: no forward offset (1/3 of the zero step to its
 *    own origin, within [0, 0.03]) and the -0.005 inside offset negated for the
 *    left side, 5 mm outward: world (0, -0.005).
 * 2. Its exit pivot: 1/3 of the 0.3 m step clamped to 0.08 forward, and 0.025
 *    inward, toward the right: world (0.08, 0.025).
 * 3. The right foot mirrors the inside offsets: entry world (0, 0.205) on a right
 *    sole at (0, 0.2), 5 mm further right.
 * 4. An offset outside the foot shrunk by 1 cm is projected onto it.
 * 5. The final pivot between the feet, chicken 0.5, is the joint hull's centroid,
 *    by symmetry their midpoint (0.15, 0.1); chicken 0 and 1 are the feet's
 *    centroids and 0.25 halfway to the middle.
 * 6. A foot of one point puts the exit pivot on it.
 */
export function test_unit_engine_physics_physical_icp_planner_cmps(): void {
  const cmps = physicalIcpPlannerCmps;
  const p: physicalIcpPlannerCmps.IParameters = physicalIcpPlanner.DEFAULTS;
  const rectangle = [
    { x: -0.11, y: -0.05 },
    { x: 0.11, y: -0.05 },
    { x: 0.11, y: 0.05 },
    { x: -0.11, y: 0.05 },
  ];
  const foot = (
    side: "left" | "right",
    x: number,
    z: number,
    polygon = rectangle,
  ): physicalIcpPlannerCmps.IFoot => ({
    side,
    frame: { origin: { x, z }, forward: { x: 1, z: 0 } },
    polygon,
  });
  const near = (
    title: string,
    a: { x: number; z: number },
    b: { x: number; z: number },
  ): void =>
    TestValidator.predicate(
      `${title}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`,
      Math.abs(a.x - b.x) <= 1e-12 && Math.abs(a.z - b.z) <= 1e-12,
    );
  const left = foot("left", 0, 0);
  const right = foot("right", 0.3, 0.2);

  // 1-2. The left support's pivots.
  near("left entry", cmps.entry(left, p), { x: 0, z: -0.005 });
  near("left exit", cmps.exit(left, cmps.centroid(right), p), {
    x: 0.08,
    z: 0.025,
  });

  // 3. The right foot mirrors the inside offsets.
  near("right entry", cmps.entry(foot("right", 0, 0.2), p), { x: 0, z: 0.205 });

  // 4. An offset past the shrunk foot is projected onto it.
  near(
    "projected",
    cmps.entry(left, { ...p, entryOffset: { x: 0, y: -0.2 } }),
    { x: 0, z: -0.04 },
  );

  // 5. The final pivot.
  near("between", cmps.between(left, right, p), { x: 0.15, z: 0.1 });
  near("chicken 0", cmps.between(left, right, { ...p, chicken: 0 }), {
    x: 0,
    z: 0,
  });
  near("chicken 1", cmps.between(left, right, { ...p, chicken: 1 }), {
    x: 0.3,
    z: 0.2,
  });
  near("chicken 0.25", cmps.between(left, right, { ...p, chicken: 0.25 }), {
    x: 0.075,
    z: 0.05,
  });

  // 6. A point foot.
  near(
    "point foot",
    cmps.exit(
      foot("left", 0, 0, [{ x: 0.02, y: 0.01 }]),
      cmps.centroid(right),
      p,
    ),
    { x: 0.02, z: -0.01 },
  );
}
