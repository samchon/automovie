import { physicalIcpPlanner, physicalIcpPlannerCmps } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The 201903 single-support plan of a recovery step follows the capture point's
 * dynamics over its two pivots and chains into the final pivot, as
 * `ContinuousCMPBasedICPPlanner` with two pivots per support plans it
 * (l.372-392, l.452-502, l.667-718): swing 0.60 s, transfer and final transfer
 * 0.25 s, splits 0.5, a 0.5 s cubic across the pivot switch.
 *
 * The left support sole is at the origin facing world +x, the right foot lands
 * at world (0.3, 0.2); its pivots are entry (0, -0.005), exit (0.08, 0.025) and
 * final (0.15, 0.1) (see the pivot test).
 *
 * 1. Before the cubic (t < 0.05 s) the plan's pivot, xi - xi' / omega, is the
 *    entry pivot; after it (t > 0.55 s) the exit pivot.
 * 2. The plan is continuous through the cubic's ends: xi(t + h) = xi(t) + xi'(t) h
 *    to second order.
 * 3. Corner-point chaining: from the plan's initial capture point, diverging 0.3 s
 *    over the entry pivot and then 0.3 + 0.125 s over the exit pivot lands on
 *    the final pivot, the capture point the next transfer reaches after its
 *    split; the plan's own end of swing, diverged 0.125 s over the exit pivot,
 *    lands there too.
 * 4. The state is done from 0.6 s on, not before.
 * 5. A decay of 0.5 s halves the rate 0.25 s after the end; none is the code
 *    default.
 */
export function test_unit_engine_physics_physical_icp_planner_single_support(): void {
  const omega: number = Math.sqrt(9.81 / 0.9);
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
  const input = {
    support: foot("left", 0, 0),
    footstep: foot("right", 0.3, 0.2),
    omega,
  };
  const plan: physicalIcpPlanner.ISinglePlan =
    physicalIcpPlanner.singleSupport(input);
  const soles: physicalIcpPlanner.ISoles = {
    left: input.support.frame,
    right: input.footstep.frame,
  };
  const entry = { x: 0, z: -0.005 };
  const exit = { x: 0.08, z: 0.025 };
  const final = { x: 0.15, z: 0.1 };
  const pivotOf = (t: number): { x: number; z: number } => {
    const o = physicalIcpPlanner(plan, t, soles);
    return {
      x: o.position.x - o.velocity.x / omega,
      z: o.position.z - o.velocity.z / omega,
    };
  };
  const near = (
    title: string,
    a: { x: number; z: number },
    b: { x: number; z: number },
    tolerance: number,
  ): void =>
    TestValidator.predicate(
      `${title}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`,
      Math.abs(a.x - b.x) <= tolerance && Math.abs(a.z - b.z) <= tolerance,
    );
  const diverge = (
    t: number,
    from: { x: number; z: number },
    pivot: { x: number; z: number },
  ) => ({
    x: pivot.x + Math.exp(omega * t) * (from.x - pivot.x),
    z: pivot.z + Math.exp(omega * t) * (from.z - pivot.z),
  });

  // 1. The pivots outside the cubic.
  for (const t of [0, 0.02, 0.049])
    near(`entry pivot at ${t}`, pivotOf(t), entry, 1e-12);
  for (const t of [0.551, 0.58, 0.6])
    near(`exit pivot at ${t}`, pivotOf(t), exit, 1e-12);
  TestValidator.predicate(
    "the cubic blends the pivots",
    Math.abs(pivotOf(0.3).x - entry.x) > 1e-4 &&
      Math.abs(pivotOf(0.3).x - exit.x) > 1e-4,
  );

  // 2. Continuity through the cubic's ends.
  const h: number = 1e-6;
  for (const t of [0.05 - h / 2, 0.55 - h / 2]) {
    const a = physicalIcpPlanner(plan, t, soles);
    const b = physicalIcpPlanner(plan, t + h, soles);
    near(
      `continuous at ${t}`,
      b.position,
      {
        x: a.position.x + a.velocity.x * h,
        z: a.position.z + a.velocity.z * h,
      },
      1e-9,
    );
  }

  // 3. Corner-point chaining into the final pivot.
  const start = physicalIcpPlanner(plan, 0, soles).position;
  near(
    "unsmoothed chain",
    diverge(0.3 + 0.125, diverge(0.3, start, entry), exit),
    final,
    1e-12,
  );
  near(
    "end of swing",
    diverge(0.125, physicalIcpPlanner(plan, 0.6, soles).position, exit),
    final,
    1e-12,
  );

  // 4. Done from the swing's end.
  TestValidator.equals(
    "not done",
    physicalIcpPlanner(plan, 0.599, soles).done,
    false,
  );
  TestValidator.equals("done", physicalIcpPlanner(plan, 0.6, soles).done, true);

  // 5. The decay.
  const decaying = physicalIcpPlanner.singleSupport({
    ...input,
    parameters: { velocityDecay: 0.5 },
  });
  const late = physicalIcpPlanner(plan, 0.85, soles);
  near(
    "no decay by default",
    late.velocity,
    physicalIcpPlanner(plan, 0.6, soles).velocity,
    0,
  );
  near(
    "decay halves",
    physicalIcpPlanner(decaying, 0.85, soles).velocity,
    { x: late.velocity.x * 0.5, z: late.velocity.z * 0.5 },
    1e-12,
  );
}
