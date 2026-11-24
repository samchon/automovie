import { physicalIcpPlannerTools } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The 201903 planner's closed forms obey their definitions (`CapturePointTools`
 * l.601-642, l.678-733; `VelocityConstrainedPositionTrajectoryGenerator`
 * l.191-231).
 *
 * Scenarios, omega = sqrt(9.81 / 0.9):
 *
 * 1. A capture point over a constant pivot: its offset from the pivot grows by
 *    e^(omega t), and its rate is omega times that offset, the capture point's
 *    dynamics.
 * 2. A capture point within 1e-15 m of its pivot stays there at rest.
 * 3. A cubic meets both ends' points and rates, sits at its Hermite midpoint (z0 +
 *    z1) / 2 + T (v0 - v1) / 8, rests at its ends outside its time, and a zero
 *    duration gives the initial point and rate.
 * 4. Corner points: diverging from the exit corner over the exit pivot for the
 *    exit time reaches the next entry corner, and from the entry corner over
 *    the entry pivot for the entry time reaches the exit corner; a step with no
 *    swing has no corners and hands its entry pivot back.
 */
export function test_unit_engine_physics_physical_icp_planner_tools(): void {
  const tools = physicalIcpPlannerTools;
  const omega: number = Math.sqrt(9.81 / 0.9);
  const near = (
    title: string,
    a: { x: number; z: number },
    b: { x: number; z: number },
  ): void =>
    TestValidator.predicate(
      `${title}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`,
      Math.abs(a.x - b.x) <= 1e-12 && Math.abs(a.z - b.z) <= 1e-12,
    );

  // 1. Divergence over a pivot.
  const pivot = { x: 0.05, z: -0.02 };
  const initial = { x: 0.08, z: 0.01 };
  const at = tools.capturePoint(omega, 0.2, initial, pivot);
  const growth: number = Math.exp(omega * 0.2);
  near("offset grows", at.position, {
    x: pivot.x + growth * (initial.x - pivot.x),
    z: pivot.z + growth * (initial.z - pivot.z),
  });
  near("dynamics", at.velocity, {
    x: omega * (at.position.x - pivot.x),
    z: omega * (at.position.z - pivot.z),
  });

  // 2. On the pivot.
  TestValidator.equals(
    "on the pivot",
    tools.capturePoint(omega, 0.3, pivot, { x: pivot.x + 1e-16, z: pivot.z }),
    {
      position: pivot,
      velocity: { x: 0, z: 0 },
    },
  );

  // 3. The cubic.
  const cubic: physicalIcpPlannerTools.ICubic = {
    duration: 0.4,
    initial: { x: 0.1, z: -0.2 },
    initialVelocity: { x: 0.3, z: 0.1 },
    final: { x: -0.05, z: 0.15 },
    finalVelocity: { x: -0.2, z: 0.4 },
  };
  near("cubic start", tools.cubic(cubic, 0).position, cubic.initial);
  near(
    "cubic start rate",
    tools.cubic(cubic, 0).velocity,
    cubic.initialVelocity,
  );
  near("cubic end", tools.cubic(cubic, 0.4).position, cubic.final);
  near("cubic end rate", tools.cubic(cubic, 0.4).velocity, cubic.finalVelocity);
  near("cubic midpoint", tools.cubic(cubic, 0.2).position, {
    x: (0.1 - 0.05) / 2 + (0.4 * (0.3 + 0.2)) / 8,
    z: (-0.2 + 0.15) / 2 + (0.4 * (0.1 - 0.4)) / 8,
  });
  TestValidator.equals("before", tools.cubic(cubic, -0.1), {
    position: cubic.initial,
    velocity: { x: 0, z: 0 },
  });
  TestValidator.equals("after", tools.cubic(cubic, 0.5), {
    position: cubic.final,
    velocity: { x: 0, z: 0 },
  });
  TestValidator.equals(
    "zero duration",
    tools.cubic({ ...cubic, duration: 0 }, 0),
    {
      position: cubic.initial,
      velocity: cubic.initialVelocity,
    },
  );

  // 4. Corner points.
  const entries = [
    { x: 0, z: 0 },
    { x: 0.3, z: 0.2 },
    { x: 0.6, z: 0 },
  ];
  const exits = [
    { x: 0.08, z: 0.02 },
    { x: 0.38, z: 0.18 },
    { x: 0.6, z: 0 },
  ];
  const swings = [0.6, 0.5];
  const swingSplits = [0.5, 0.4];
  const transfers = [0.25, 0.2, 0.3];
  const transferSplits = [0.5, 0.6, 0.5];
  const corners = tools.cornerPoints({
    entries,
    exits,
    swings,
    swingSplits,
    transfers,
    transferSplits,
    count: 2,
    omega,
  });
  for (const i of [0, 1]) {
    const onEntry: number =
      swings[i]! * swingSplits[i]! + transfers[i]! * (1 - transferSplits[i]!);
    const onExit: number =
      swings[i]! * (1 - swingSplits[i]!) +
      transfers[i + 1]! * transferSplits[i + 1]!;
    const next = i === 1 ? entries[2]! : corners.entries[1]!;
    near(
      `exit corner ${i} reaches the next entry`,
      tools.capturePoint(omega, onExit, corners.exits[i]!, exits[i]!).position,
      next,
    );
    near(
      `entry corner ${i} reaches the exit corner`,
      tools.capturePoint(omega, onEntry, corners.entries[i]!, entries[i]!)
        .position,
      corners.exits[i]!,
    );
  }
  const skipped = tools.cornerPoints({
    entries,
    exits,
    swings: [0.6, undefined],
    swingSplits,
    transfers,
    transferSplits,
    count: 2,
    omega,
  });
  TestValidator.predicate(
    "no swing, no corner",
    skipped.entries[1] === undefined && skipped.exits[1] === undefined,
  );
  const onExit: number = 0.6 * 0.5 + 0.2 * 0.6;
  near(
    "the skipped step's entry pivot is the next entry",
    tools.capturePoint(omega, onExit, skipped.exits[0]!, exits[0]!).position,
    entries[1]!,
  );
}
