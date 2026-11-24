import { physicalIcpPlanner, physicalIcpPlannerCmps } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * After a recovery step lands, the 201903 planner holds the capture point at
 * the centre of mass projected into the feet's support shrunk by 8 cm for the
 * 0.25 s final transfer, leaves the hold once done within 2.5 cm of it, and
 * then stands by the double-support cubic from the held point to the caller's
 * target over 0.25 s (`TransferToStandingState` l.42, l.64-117,
 * `BalanceManager.requestICPPlannerToHoldCurrentCoM` l.815-829,
 * `StandingState.onEntry` l.82-93, `initializeTransferTrajectory` l.543-564,
 * `VelocityConstrainedPositionTrajectoryGenerator` l.191-231).
 *
 * The feet are 22 x 10 cm rectangles facing world +x, the left sole at the
 * origin and the right at world (0, 0.2), so their support spans world x
 * [-0.11, 0.11] and z [-0.05, 0.25].
 *
 * 1. Shrunk by 8 cm the support spans x [-0.03, 0.03] and z [0.03, 0.17]; a centre
 *    of mass at world (0.1, 0) projects to the corner (0.03, 0.03), held at
 *    rest; one inside, at (0.01, 0.1), is held where it is.
 * 2. The hold is done from 0.25 s on.
 * 3. The exit test needs both: done and within 2.5 cm (2 cm passes, 3 cm fails),
 *    and not before 0.25 s.
 * 4. Standing from the hold to a target at rest at (0, 0.1): it starts at the held
 *    point, is at the Hermite midpoint (z0 + z1) / 2 at 0.125 s, reaches the
 *    target at rest at 0.25 s and stays; it is done from 0.25 s on.
 * 5. From a moving start to a moving target: it leaves with the start's rate,
 *    arrives with the target's point and rate at 0.25 s, passes the Hermite
 *    midpoint (z0 + z1) / 2 + T (v0 - v1) / 8, and rests at the target after.
 */
export function test_unit_engine_physics_physical_icp_planner_standing(): void {
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
  ): physicalIcpPlannerCmps.IFoot => ({
    side,
    frame: { origin: { x, z }, forward: { x: 1, z: 0 } },
    polygon: rectangle,
  });
  const left = foot("left", 0, 0);
  const right = foot("right", 0, 0.2);
  const soles: physicalIcpPlanner.ISoles = {
    left: left.frame,
    right: right.frame,
  };
  const near = (
    title: string,
    a: { x: number; z: number },
    b: { x: number; z: number },
  ): void =>
    TestValidator.predicate(
      `${title}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`,
      Math.abs(a.x - b.x) <= 1e-12 && Math.abs(a.z - b.z) <= 1e-12,
    );

  // 1. The hold.
  const hold = physicalIcpPlanner.toStanding({
    feet: { left, right },
    support: "left",
    desired: { x: 0, z: 0 },
    center: { x: 0.1, z: 0 },
  });
  for (const t of [0, 0.1, 0.25, 0.4]) {
    const o = physicalIcpPlanner(hold, t, soles);
    near(`held at ${t}`, o.position, { x: 0.03, z: 0.03 });
    near(`at rest at ${t}`, o.velocity, { x: 0, z: 0 });
  }
  near(
    "inside held in place",
    physicalIcpPlanner(
      physicalIcpPlanner.toStanding({
        feet: { left, right },
        support: "left",
        desired: { x: 0, z: 0 },
        center: { x: 0.01, z: 0.1 },
      }),
      0,
      soles,
    ).position,
    { x: 0.01, z: 0.1 },
  );

  // 2-3. Done and the exit test.
  TestValidator.equals(
    "hold not done",
    physicalIcpPlanner(hold, 0.24, soles).done,
    false,
  );
  TestValidator.equals(
    "hold done",
    physicalIcpPlanner(hold, 0.25, soles).done,
    true,
  );
  const exitTest = (t: number, error: number): boolean =>
    physicalIcpPlanner.toStandingDone({
      output: physicalIcpPlanner(hold, t, soles),
      capture: { x: 0.03 + error, z: 0.03 },
    });
  TestValidator.equals("2 cm passes", exitTest(0.25, 0.02), true);
  TestValidator.equals("3 cm fails", exitTest(0.25, 0.03), false);
  TestValidator.equals("too early", exitTest(0.2, 0), false);

  // 4. Standing to a target at rest.
  const from = physicalIcpPlanner(hold, 0.3, soles);
  const rest = { position: { x: 0, z: 0.1 }, velocity: { x: 0, z: 0 } };
  const standing = physicalIcpPlanner.standing({ soles, from, to: rest });
  near("standing start", physicalIcpPlanner(standing, 0, soles).position, {
    x: 0.03,
    z: 0.03,
  });
  near(
    "standing midpoint",
    physicalIcpPlanner(standing, 0.125, soles).position,
    {
      x: 0.015,
      z: 0.065,
    },
  );
  for (const t of [0.25, 0.5]) {
    const o = physicalIcpPlanner(standing, t, soles);
    near(`standing end at ${t}`, o.position, rest.position);
    near(`standing at rest at ${t}`, o.velocity, rest.velocity);
  }
  TestValidator.equals(
    "standing not done",
    physicalIcpPlanner(standing, 0.24, soles).done,
    false,
  );
  TestValidator.equals(
    "standing done",
    physicalIcpPlanner(standing, 0.25, soles).done,
    true,
  );

  // 5. A moving start and a moving target.
  const moving = { position: { x: 0.03, z: 0.03 }, velocity: { x: 0.2, z: 0 } };
  const target = {
    position: { x: 0.02, z: 0.12 },
    velocity: { x: 0.05, z: -0.1 },
  };
  const both = physicalIcpPlanner.standing({ soles, from: moving, to: target });
  near("leaves with the rate", physicalIcpPlanner(both, 0, soles).velocity, {
    x: 0.2,
    z: 0,
  });
  near(
    "arrives at the target",
    physicalIcpPlanner(both, 0.25, soles).position,
    {
      x: 0.02,
      z: 0.12,
    },
  );
  near("with its rate", physicalIcpPlanner(both, 0.25, soles).velocity, {
    x: 0.05,
    z: -0.1,
  });
  near("moving midpoint", physicalIcpPlanner(both, 0.125, soles).position, {
    x: (0.03 + 0.02) / 2 + (0.25 * (0.2 - 0.05)) / 8,
    z: (0.03 + 0.12) / 2 + (0.25 * (0 + 0.1)) / 8,
  });
  near("rests after its end", physicalIcpPlanner(both, 0.3, soles).velocity, {
    x: 0,
    z: 0,
  });
}
