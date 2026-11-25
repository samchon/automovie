import { physicalIcpPlanner, physicalIcpPlannerCmps } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** A floor point or rate, world metres. */
interface IFloor {
  x: number;
  z: number;
}

/** Rounding of a few closed-form products, metres. */
const ROUNDING: number = 1e-12;

/** The capture point's natural frequency for a 0.9 m pendulum, 1/s. */
const OMEGA: number = Math.sqrt(9.81 / 0.9);

/** A 22 x 10 cm sole in its own frame. */
const RECTANGLE = [
  { x: -0.11, y: -0.05 },
  { x: 0.11, y: -0.05 },
  { x: 0.11, y: 0.05 },
  { x: -0.11, y: 0.05 },
];

/** A sole frame at a floor point facing world +x. */
function frame(x: number, z: number): physicalIcpPlanner.ISoles["left"] {
  return { origin: { x, z }, forward: { x: 1, z: 0 } };
}

/** A foot facing world +x with its sole at a floor point. */
function foot(
  side: "left" | "right",
  x: number,
  z: number,
): physicalIcpPlannerCmps.IFoot {
  return { side, frame: frame(x, z), polygon: RECTANGLE };
}

/** Assert two floor points or rates agree within a bound. */
function near(
  title: string,
  a: IFloor,
  b: IFloor,
  tolerance: number = ROUNDING,
): void {
  TestValidator.predicate(
    `${title}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`,
    Math.abs(a.x - b.x) <= tolerance && Math.abs(a.z - b.z) <= tolerance,
  );
}

/** The capture point diverging `t` seconds from a point over a fixed pivot. */
function diverge(t: number, from: IFloor, pivot: IFloor): IFloor {
  return {
    x: pivot.x + Math.exp(OMEGA * t) * (from.x - pivot.x),
    z: pivot.z + Math.exp(OMEGA * t) * (from.z - pivot.z),
  };
}

/** How far a point moved. */
function shift(a: IFloor, b: IFloor): IFloor {
  return { x: b.x - a.x, z: b.z - a.z };
}

/**
 * `physicalIcpPlanner` reads the 201903 capture-point plans of a recovery step
 * (`ContinuousCMPBasedICPPlanner`, `TransferToStandingState`, `StandingState`,
 * `ICPPlannerSegmentedTrajectoryGenerator`).
 *
 * Feet are 22 x 10 cm rectangles facing world +x; a sole's left is world -z.
 *
 * Scenarios:
 *
 * 1. Single support on the left sole at the origin, stepping to (0.3, 0.2) over a
 *    0.6 s swing: its pivot, `xi - xi' / omega`, is the entry pivot (0, -0.005)
 *    before the 0.5 s cubic and the exit pivot (0.08, 0.025) after it; it is
 *    continuous through the cubic's ends; corner-point chaining from its start,
 *    0.3 s over the entry and 0.425 s over the exit pivot, lands on the final
 *    pivot (0.15, 0.1), as its end of swing does over 0.125 s; it is done from
 *    0.6 s; a 0.5 s decay halves the rate 0.25 s after the end.
 * 2. A 1 cm slip of the support sole moves that plan by `(1 - t / 0.6)` cm outside
 *    the cubic without changing its rate; a slip of the swing foot changes
 *    nothing.
 * 3. The hold after landing, the soles at the origin and (0, 0.2): the centre at
 *    (0.1, 0) projects into the support shrunk by 8 cm to the corner (0.03,
 *    0.03), held at rest, a centre inside held where it is; done from 0.25 s;
 *    the exit test needs done and within 2.5 cm. Both soles slipped 1 cm move
 *    it 1 cm; a hold whose desired point was on the support sole moves its
 *    start 1 cm and its mid-feet end 0.5 cm under a 1 cm slip of that sole.
 * 4. Standing from the hold to a target over 0.25 s: the Hermite cubic from the
 *    held point, at `(z0 + z1) / 2 + T (v0 - v1) / 8` halfway, at the target
 *    with its rate at 0.25 s and at rest after, done from 0.25 s.
 */
export function test_unit_engine_physics_physical_icp_planner(): void {
  // 1. Single support.
  const support = foot("left", 0, 0);
  const footstep = foot("right", 0.3, 0.2);
  const input = { support, footstep, omega: OMEGA };
  const plan = physicalIcpPlanner.singleSupport(input);
  const planted: physicalIcpPlanner.ISoles = {
    left: support.frame,
    right: footstep.frame,
  };
  const entry: IFloor = { x: 0, z: -0.005 };
  const exit: IFloor = { x: 0.08, z: 0.025 };
  const final: IFloor = { x: 0.15, z: 0.1 };
  const pivotOf = (t: number): IFloor => {
    const o = physicalIcpPlanner(plan, t, planted);
    return {
      x: o.position.x - o.velocity.x / OMEGA,
      z: o.position.z - o.velocity.z / OMEGA,
    };
  };
  for (const t of [0, 0.02, 0.049]) near(`entry pivot ${t}`, pivotOf(t), entry);
  for (const t of [0.551, 0.58, 0.6]) near(`exit pivot ${t}`, pivotOf(t), exit);
  const h: number = 1e-6;
  for (const t of [0.05 - h / 2, 0.55 - h / 2]) {
    const a = physicalIcpPlanner(plan, t, planted);
    near(
      `continuous at ${t}`,
      physicalIcpPlanner(plan, t + h, planted).position,
      {
        x: a.position.x + a.velocity.x * h,
        z: a.position.z + a.velocity.z * h,
      },
      1e-9,
    );
  }
  const start: IFloor = physicalIcpPlanner(plan, 0, planted).position;
  near("chained", diverge(0.425, diverge(0.3, start, entry), exit), final);
  near(
    "end of swing",
    diverge(0.125, physicalIcpPlanner(plan, 0.6, planted).position, exit),
    final,
  );
  TestValidator.equals(
    "done from the swing's end",
    [
      physicalIcpPlanner(plan, 0.599, planted).done,
      physicalIcpPlanner(plan, 0.6, planted).done,
    ],
    [false, true],
  );
  const late = physicalIcpPlanner(plan, 0.85, planted);
  near(
    "decay halves",
    physicalIcpPlanner(
      physicalIcpPlanner.singleSupport({
        ...input,
        parameters: { velocityDecay: 0.5 },
      }),
      0.85,
      planted,
    ).velocity,
    { x: late.velocity.x * 0.5, z: late.velocity.z * 0.5 },
  );

  // 2. A slipping support sole.
  const slipped: physicalIcpPlanner.ISoles = {
    left: frame(0.01, 0),
    right: footstep.frame,
  };
  for (const t of [0, 0.02, 0.05, 0.55, 0.58, 0.6]) {
    const a = physicalIcpPlanner(plan, t, planted);
    const b = physicalIcpPlanner(plan, t, slipped);
    near(`slip at ${t}`, shift(a.position, b.position), {
      x: 0.01 * (1 - t / 0.6),
      z: 0,
    });
    near(`rate at ${t}`, b.velocity, a.velocity);
  }
  near(
    "swing slip",
    physicalIcpPlanner(plan, 0.3, {
      left: support.frame,
      right: frame(0.31, 0.2),
    }).position,
    physicalIcpPlanner(plan, 0.3, planted).position,
  );

  // 3. The hold.
  const left = foot("left", 0, 0);
  const right = foot("right", 0, 0.2);
  const soles: physicalIcpPlanner.ISoles = {
    left: left.frame,
    right: right.frame,
  };
  const hold = (desired: IFloor, center: IFloor) =>
    physicalIcpPlanner.toStanding({
      feet: { left, right },
      support: "left",
      desired,
      center,
    });
  const held = hold({ x: 0, z: 0 }, { x: 0.1, z: 0 });
  for (const t of [0, 0.1, 0.25, 0.4]) {
    const o = physicalIcpPlanner(held, t, soles);
    near(`held at ${t}`, o.position, { x: 0.03, z: 0.03 });
    near(`at rest at ${t}`, o.velocity, { x: 0, z: 0 });
  }
  near(
    "inside held in place",
    physicalIcpPlanner(hold({ x: 0, z: 0 }, { x: 0.01, z: 0.1 }), 0, soles)
      .position,
    { x: 0.01, z: 0.1 },
  );
  const exitTest = (t: number, error: number): boolean =>
    physicalIcpPlanner.toStandingDone({
      output: physicalIcpPlanner(held, t, soles),
      capture: { x: 0.03 + error, z: 0.03 },
    });
  TestValidator.equals(
    "done and the exit test",
    [
      physicalIcpPlanner(held, 0.24, soles).done,
      physicalIcpPlanner(held, 0.25, soles).done,
      exitTest(0.25, 0.02),
      exitTest(0.25, 0.03),
      exitTest(0.2, 0),
    ],
    [false, true, true, false, false],
  );
  const both: physicalIcpPlanner.ISoles = {
    left: frame(0.01, 0),
    right: frame(0.01, 0.2),
  };
  const middle = hold({ x: 0, z: 0.1 }, { x: 0.1, z: 0 });
  for (const t of [0, 0.1, 0.25])
    near(
      `both slip at ${t}`,
      shift(
        physicalIcpPlanner(middle, t, soles).position,
        physicalIcpPlanner(middle, t, both).position,
      ),
      { x: 0.01, z: 0 },
    );
  const outward: physicalIcpPlanner.ISoles = {
    left: frame(0, -0.01),
    right: right.frame,
  };
  const onSole = hold({ x: 0, z: 0.01 }, { x: 0.1, z: 0 });
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

  // 4. Standing.
  const from = physicalIcpPlanner(held, 0.3, soles);
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
    "standing done",
    [
      physicalIcpPlanner(standing, 0.24, soles).done,
      physicalIcpPlanner(standing, 0.25, soles).done,
    ],
    [false, true],
  );
  const moving = { position: { x: 0.03, z: 0.03 }, velocity: { x: 0.2, z: 0 } };
  const target = {
    position: { x: 0.02, z: 0.12 },
    velocity: { x: 0.05, z: -0.1 },
  };
  const move = physicalIcpPlanner.standing({ soles, from: moving, to: target });
  near("leaves with its rate", physicalIcpPlanner(move, 0, soles).velocity, {
    x: 0.2,
    z: 0,
  });
  near(
    "arrives",
    physicalIcpPlanner(move, 0.25, soles).position,
    target.position,
  );
  near(
    "with its rate",
    physicalIcpPlanner(move, 0.25, soles).velocity,
    target.velocity,
  );
  near("moving midpoint", physicalIcpPlanner(move, 0.125, soles).position, {
    x: (0.03 + 0.02) / 2 + (0.25 * (0.2 - 0.05)) / 8,
    z: (0.03 + 0.12) / 2 + (0.25 * (0 + 0.1)) / 8,
  });
  near("rests after", physicalIcpPlanner(move, 0.3, soles).velocity, {
    x: 0,
    z: 0,
  });
}
