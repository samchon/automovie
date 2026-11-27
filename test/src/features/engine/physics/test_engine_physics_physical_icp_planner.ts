import { AutoMovieEnginePhysicalIcpPlanner, AutoMovieEnginePhysicalIcpPlannerCmps } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/** A floor point or rate, world metres. */
interface IFloor {
  x: number;
  z: number;
}

/** Rounding of a few closed-form products, metres. */
const ROUNDING: number = PhysicalTolerance.ROUNDING;

/**
 * How far a first-order step may miss the plan, metres: its second-order
 * remainder `h^2 xi'' / 2`, under 1e-9 for a microsecond step and `xi''` of
 * order 100 m/s^2.
 */
const CONTINUITY: number = 1e-9;

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
function frame(x: number, z: number): AutoMovieEnginePhysicalIcpPlanner.ISoles["left"] {
  return { origin: { x, z }, forward: { x: 1, z: 0 } };
}

/** A foot facing world +x with its sole at a floor point. */
function foot(
  side: "left" | "right",
  x: number,
  z: number,
): AutoMovieEnginePhysicalIcpPlannerCmps.IFoot {
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
 * `AutoMovieEnginePhysicalIcpPlanner` reads the 201903 capture-point plans of a recovery step
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
export function test_engine_physics_physical_icp_planner(): void {
  // 1. Single support.
  const support = foot("left", 0, 0);
  const footstep = foot("right", 0.3, 0.2);
  const input = { support, footstep, omega: OMEGA };
  const plan = AutoMovieEnginePhysicalIcpPlanner.singleSupport(input);
  const planted: AutoMovieEnginePhysicalIcpPlanner.ISoles = {
    left: support.frame,
    right: footstep.frame,
  };
  const entry: IFloor = { x: 0, z: -0.005 };
  const exit: IFloor = { x: 0.08, z: 0.025 };
  const final: IFloor = { x: 0.15, z: 0.1 };
  const pivotOf = (t: number): IFloor => {
    const o = AutoMovieEnginePhysicalIcpPlanner.compute(plan, t, planted);
    return {
      x: o.position.x - o.velocity.x / OMEGA,
      z: o.position.z - o.velocity.z / OMEGA,
    };
  };
  for (const t of [0, 0.02, 0.049]) near(`entry pivot ${t}`, pivotOf(t), entry);
  for (const t of [0.551, 0.58, 0.6]) near(`exit pivot ${t}`, pivotOf(t), exit);
  // A microsecond step, short enough for the cubic's second order to stay
  // under the bound below.
  const h: number = 1e-6;
  for (const t of [0.05 - h / 2, 0.55 - h / 2]) {
    const a = AutoMovieEnginePhysicalIcpPlanner.compute(plan, t, planted);
    near(
      `continuous at ${t}`,
      AutoMovieEnginePhysicalIcpPlanner.compute(plan, t + h, planted).position,
      {
        x: a.position.x + a.velocity.x * h,
        z: a.position.z + a.velocity.z * h,
      },
      CONTINUITY,
    );
  }
  const start: IFloor = AutoMovieEnginePhysicalIcpPlanner.compute(plan, 0, planted).position;
  near("chained", diverge(0.425, diverge(0.3, start, entry), exit), final);
  near(
    "end of swing",
    diverge(0.125, AutoMovieEnginePhysicalIcpPlanner.compute(plan, 0.6, planted).position, exit),
    final,
  );
  TestValidator.equals(
    "done from the swing's end",
    [
      AutoMovieEnginePhysicalIcpPlanner.compute(plan, 0.599, planted).done,
      AutoMovieEnginePhysicalIcpPlanner.compute(plan, 0.6, planted).done,
    ],
    [false, true],
  );
  const late = AutoMovieEnginePhysicalIcpPlanner.compute(plan, 0.85, planted);
  near(
    "decay halves",
    AutoMovieEnginePhysicalIcpPlanner.compute(
      AutoMovieEnginePhysicalIcpPlanner.singleSupport({
        ...input,
        parameters: { velocityDecay: 0.5 },
      }),
      0.85,
      planted,
    ).velocity,
    { x: late.velocity.x * 0.5, z: late.velocity.z * 0.5 },
  );

  // 2. A slipping support sole.
  const slipped: AutoMovieEnginePhysicalIcpPlanner.ISoles = {
    left: frame(0.01, 0),
    right: footstep.frame,
  };
  for (const t of [0, 0.02, 0.05, 0.55, 0.58, 0.6]) {
    const a = AutoMovieEnginePhysicalIcpPlanner.compute(plan, t, planted);
    const b = AutoMovieEnginePhysicalIcpPlanner.compute(plan, t, slipped);
    near(`slip at ${t}`, shift(a.position, b.position), {
      x: 0.01 * (1 - t / 0.6),
      z: 0,
    });
    near(`rate at ${t}`, b.velocity, a.velocity);
  }
  near(
    "swing slip",
    AutoMovieEnginePhysicalIcpPlanner.compute(plan, 0.3, {
      left: support.frame,
      right: frame(0.31, 0.2),
    }).position,
    AutoMovieEnginePhysicalIcpPlanner.compute(plan, 0.3, planted).position,
  );

  // 3. The hold.
  const left = foot("left", 0, 0);
  const right = foot("right", 0, 0.2);
  const soles: AutoMovieEnginePhysicalIcpPlanner.ISoles = {
    left: left.frame,
    right: right.frame,
  };
  const hold = (desired: IFloor, center: IFloor) =>
    AutoMovieEnginePhysicalIcpPlanner.toStanding({
      feet: { left, right },
      support: "left",
      desired,
      center,
    });
  const held = hold({ x: 0, z: 0 }, { x: 0.1, z: 0 });
  for (const t of [0, 0.1, 0.25, 0.4]) {
    const o = AutoMovieEnginePhysicalIcpPlanner.compute(held, t, soles);
    near(`held at ${t}`, o.position, { x: 0.03, z: 0.03 });
    near(`at rest at ${t}`, o.velocity, { x: 0, z: 0 });
  }
  near(
    "inside held in place",
    AutoMovieEnginePhysicalIcpPlanner.compute(hold({ x: 0, z: 0 }, { x: 0.01, z: 0.1 }), 0, soles)
      .position,
    { x: 0.01, z: 0.1 },
  );
  const exitTest = (t: number, error: number): boolean =>
    AutoMovieEnginePhysicalIcpPlanner.toStandingDone({
      output: AutoMovieEnginePhysicalIcpPlanner.compute(held, t, soles),
      capture: { x: 0.03 + error, z: 0.03 },
    });
  TestValidator.equals(
    "done and the exit test",
    [
      AutoMovieEnginePhysicalIcpPlanner.compute(held, 0.24, soles).done,
      AutoMovieEnginePhysicalIcpPlanner.compute(held, 0.25, soles).done,
      exitTest(0.25, 0.02),
      exitTest(0.25, 0.03),
      exitTest(0.2, 0),
    ],
    [false, true, true, false, false],
  );
  const both: AutoMovieEnginePhysicalIcpPlanner.ISoles = {
    left: frame(0.01, 0),
    right: frame(0.01, 0.2),
  };
  const middle = hold({ x: 0, z: 0.1 }, { x: 0.1, z: 0 });
  for (const t of [0, 0.1, 0.25])
    near(
      `both slip at ${t}`,
      shift(
        AutoMovieEnginePhysicalIcpPlanner.compute(middle, t, soles).position,
        AutoMovieEnginePhysicalIcpPlanner.compute(middle, t, both).position,
      ),
      { x: 0.01, z: 0 },
    );
  const outward: AutoMovieEnginePhysicalIcpPlanner.ISoles = {
    left: frame(0, -0.01),
    right: right.frame,
  };
  const onSole = hold({ x: 0, z: 0.01 }, { x: 0.1, z: 0 });
  near(
    "sole start moves 1 cm",
    shift(
      AutoMovieEnginePhysicalIcpPlanner.compute(onSole, 0, soles).position,
      AutoMovieEnginePhysicalIcpPlanner.compute(onSole, 0, outward).position,
    ),
    { x: 0, z: -0.01 },
  );
  near(
    "mid-feet end moves 0.5 cm",
    shift(
      AutoMovieEnginePhysicalIcpPlanner.compute(onSole, 0.25, soles).position,
      AutoMovieEnginePhysicalIcpPlanner.compute(onSole, 0.25, outward).position,
    ),
    { x: 0, z: -0.005 },
  );

  // 4. Standing.
  const from = AutoMovieEnginePhysicalIcpPlanner.compute(held, 0.3, soles);
  const rest = { position: { x: 0, z: 0.1 }, velocity: { x: 0, z: 0 } };
  const standing = AutoMovieEnginePhysicalIcpPlanner.standing({ soles, from, to: rest });
  near("standing start", AutoMovieEnginePhysicalIcpPlanner.compute(standing, 0, soles).position, {
    x: 0.03,
    z: 0.03,
  });
  near(
    "standing midpoint",
    AutoMovieEnginePhysicalIcpPlanner.compute(standing, 0.125, soles).position,
    {
      x: 0.015,
      z: 0.065,
    },
  );
  for (const t of [0.25, 0.5]) {
    const o = AutoMovieEnginePhysicalIcpPlanner.compute(standing, t, soles);
    near(`standing end at ${t}`, o.position, rest.position);
    near(`standing at rest at ${t}`, o.velocity, rest.velocity);
  }
  TestValidator.equals(
    "standing done",
    [
      AutoMovieEnginePhysicalIcpPlanner.compute(standing, 0.24, soles).done,
      AutoMovieEnginePhysicalIcpPlanner.compute(standing, 0.25, soles).done,
    ],
    [false, true],
  );
  const moving = { position: { x: 0.03, z: 0.03 }, velocity: { x: 0.2, z: 0 } };
  const target = {
    position: { x: 0.02, z: 0.12 },
    velocity: { x: 0.05, z: -0.1 },
  };
  const move = AutoMovieEnginePhysicalIcpPlanner.standing({ soles, from: moving, to: target });
  near("leaves with its rate", AutoMovieEnginePhysicalIcpPlanner.compute(move, 0, soles).velocity, {
    x: 0.2,
    z: 0,
  });
  near(
    "arrives",
    AutoMovieEnginePhysicalIcpPlanner.compute(move, 0.25, soles).position,
    target.position,
  );
  near(
    "with its rate",
    AutoMovieEnginePhysicalIcpPlanner.compute(move, 0.25, soles).velocity,
    target.velocity,
  );
  near("moving midpoint", AutoMovieEnginePhysicalIcpPlanner.compute(move, 0.125, soles).position, {
    x: (0.03 + 0.02) / 2 + (0.25 * (0.2 - 0.05)) / 8,
    z: (0.03 + 0.12) / 2 + (0.25 * (0 + 0.1)) / 8,
  });
  near("rests after", AutoMovieEnginePhysicalIcpPlanner.compute(move, 0.3, soles).velocity, {
    x: 0,
    z: 0,
  });
}
