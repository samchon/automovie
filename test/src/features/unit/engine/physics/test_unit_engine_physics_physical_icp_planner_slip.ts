import {
  physicalIcpPlanner,
  physicalIcpPlannerCmps,
  physicalIcpPlannerTools,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A slipping stance foot carries the 201903 plan with it, as the reference
 * attaches the plan's points to the support sole, the transfer-from sole and
 * the mid-feet frame (`ICPPlannerSegmentedTrajectoryGenerator` l.214-228,
 * l.338-446; `ICPPlannerTrajectoryGenerator` l.44-64, l.80-85;
 * `ContinuousCMPBasedICPPlanner` l.517-538, l.701).
 *
 * Feet are 22 x 10 cm rectangles facing world +x; a sole's left is world -z.
 *
 * 1. The mid-feet frame (`MovingMidFrameZUpFrame` l.37-60): halfway between the
 *    soles, its forward axis perpendicular to the left-to-right vector with the
 *    left sole on its left; turned 90 degrees with the feet; and the fallback's
 *    axis for coincident soles.
 * 2. Single support on the left sole, stepping to (0.3, 0.2): a 1 cm slip of the
 *    support sole moves the plan by (1 - t / 0.6) cm outside the cubic, the
 *    sole copy's share of the blend: the full 1 cm at the start and none at the
 *    swing's end. The rate does not change, as the slip is a translation. A
 *    slip of the swing foot changes nothing.
 * 3. The hold with both soles slipped 1 cm moves by the full 1 cm.
 * 4. The hold whose last desired capture point was on the support sole starts on
 *    that sole: a 1 cm outward slip of that sole moves its start 1 cm and its
 *    end, on the mid-feet frame, 0.5 cm. Nearer the mid-feet origin, both ends
 *    move 0.5 cm.
 */
export function test_unit_engine_physics_physical_icp_planner_slip(): void {
  const omega: number = Math.sqrt(9.81 / 0.9);
  const rectangle = [
    { x: -0.11, y: -0.05 },
    { x: 0.11, y: -0.05 },
    { x: 0.11, y: 0.05 },
    { x: -0.11, y: 0.05 },
  ];
  const frame = (x: number, z: number) => ({
    origin: { x, z },
    forward: { x: 1, z: 0 },
  });
  const foot = (
    side: "left" | "right",
    x: number,
    z: number,
  ): physicalIcpPlannerCmps.IFoot => ({
    side,
    frame: frame(x, z),
    polygon: rectangle,
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
  const shift = (
    a: { x: number; z: number },
    b: { x: number; z: number },
  ): { x: number; z: number } => ({ x: b.x - a.x, z: b.z - a.z });

  // 1. The mid-feet frame.
  const tools = physicalIcpPlannerTools;
  const anywhere = frame(0, 0);
  const mid = tools.midFeet(frame(0, -0.1), frame(0.2, 0.1), anywhere);
  near("mid origin", mid.origin, { x: 0.1, z: 0 });
  near("mid forward", mid.forward, {
    x: 0.2 / Math.hypot(0.2, 0.2),
    z: -0.2 / Math.hypot(0.2, 0.2),
  });
  near(
    "mid facing +x",
    tools.midFeet(frame(0, -0.1), frame(0, 0.1), anywhere).forward,
    {
      x: 1,
      z: 0,
    },
  );
  near(
    "mid fallback",
    tools.midFeet(frame(0, 0), frame(0, 0.0001), {
      origin: { x: 5, z: 5 },
      forward: { x: 0, z: 1 },
    }).forward,
    { x: 0, z: 1 },
  );

  // 2. Single support.
  const support = foot("left", 0, 0);
  const footstep = foot("right", 0.3, 0.2);
  const plan = physicalIcpPlanner.singleSupport({ support, footstep, omega });
  const planted = { left: support.frame, right: footstep.frame };
  const slipped = { left: frame(0.01, 0), right: footstep.frame };
  for (const t of [0, 0.02, 0.05, 0.55, 0.58, 0.6]) {
    const a = physicalIcpPlanner(plan, t, planted);
    const b = physicalIcpPlanner(plan, t, slipped);
    near(`support slip at ${t}`, shift(a.position, b.position), {
      x: 0.01 * (1 - t / 0.6),
      z: 0,
    });
    near(`rate at ${t}`, b.velocity, a.velocity);
  }
  const swung = { left: support.frame, right: frame(0.31, 0.2) };
  near(
    "swing slip",
    physicalIcpPlanner(plan, 0.3, swung).position,
    physicalIcpPlanner(plan, 0.3, planted).position,
  );

  // 3. The hold with both soles slipped.
  const left = foot("left", 0, 0);
  const right = foot("right", 0, 0.2);
  const soles = { left: left.frame, right: right.frame };
  const hold = (desired: { x: number; z: number }) =>
    physicalIcpPlanner.toStanding({
      feet: { left, right },
      support: "left",
      desired,
      center: { x: 0.1, z: 0 },
    });
  const both = { left: frame(0.01, 0), right: frame(0.01, 0.2) };
  for (const t of [0, 0.1, 0.25])
    near(
      `both slip at ${t}`,
      shift(
        physicalIcpPlanner(hold({ x: 0, z: 0.1 }), t, soles).position,
        physicalIcpPlanner(hold({ x: 0, z: 0.1 }), t, both).position,
      ),
      { x: 0.01, z: 0 },
    );

  // 4. The hold's start frame.
  const outward = { left: frame(0, -0.01), right: right.frame };
  const onSole = hold({ x: 0, z: 0.01 });
  near(
    "sole start moves 1 cm",
    shift(
      physicalIcpPlanner(onSole, 0, soles).position,
      physicalIcpPlanner(onSole, 0, outward).position,
    ),
    { x: 0, z: -0.01 },
  );
  near(
    "mid-feet end moves 0.5 cm",
    shift(
      physicalIcpPlanner(onSole, 0.25, soles).position,
      physicalIcpPlanner(onSole, 0.25, outward).position,
    ),
    { x: 0, z: -0.005 },
  );
  const onMiddle = hold({ x: 0, z: 0.11 });
  near(
    "mid-feet start moves 0.5 cm",
    shift(
      physicalIcpPlanner(onMiddle, 0, soles).position,
      physicalIcpPlanner(onMiddle, 0, outward).position,
    ),
    { x: 0, z: -0.005 },
  );
}
