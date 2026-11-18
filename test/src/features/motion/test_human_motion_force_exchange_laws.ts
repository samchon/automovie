import { AutoMovieGravity, integrateMotionTrajectory } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanSustainedForce,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanForce,
  HumanForceExchange,
  HumanForceTrunk,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";

/** Inputs to one constant pull's capture boundary. */
type Pull = Parameters<typeof HumanForceExchange.breaking>[0];

/**
 * The force exchange's laws (#3439) hold their closed forms: the pull that
 * breaks a base and the instant it breaks it are inverses, the centre's
 * extrapolation reaches the base's edge at that instant, the base's extent
 * along a direction is the ray's exit from its hull, the resisted shift is
 * the moment balance with its bound, the swing conserves its energy and
 * releases level with the fulcrum, the pull spreads its force over its
 * grips, and the trunk's bend share integrates its stiffness.
 *
 * Every expectation is computed here from the law's own equation as the
 * module states it (the linear inverted pendulum under a constant force,
 * Hof, Gazendam and Sinke 2005; the static moment balance; the rigid
 * pendulum's energy integral; the piecewise stiffness of Watt, Callaway and
 * Williams 2022), never read back from the module. Tolerances are the
 * round-off of the arithmetic, 1e-9 relative, except the swing's: its
 * release is found to the integrator's step squared in time, so its angle
 * to the rate times that, and its fourth-order integration at that step
 * keeps its energy to `(h ω)^4` relative, `ω` the swing's own frequency.
 *
 * Scenarios:
 * 1. A baseline pull, mass and base scaling, and two frequency/time pairs
 *    pin the force and its inverse independently. Integrating the forced
 *    pendulum from rest gives position and speed at the resulting boundary.
 * 2. `broken` of no pull is infinite.
 * 3. A unit square base about the origin: the extent from its centre along
 *    +X is 0.5 m, along the diagonal 0.5 sqrt 2 m; from a point outside it
 *    is none.
 * 4. `resisted` is `F h / (M g)` below the edge and null past it, the
 *    boundary at the edge itself included.
 * 5. A swing of 75 kg, inertia 10 kg m², radius 0.3 m, starting 0.2 rad
 *    past the vertical at 1 rad/s releases at `π / 2` with its energy
 *    `I_f φ'² / 2 + M g r cos φ` kept; one starting 0.5 rad before the
 *    vertical at 0.1 rad/s with no pull is null; the same start driven by a
 *    pull's moment of the weight times the radius releases.
 * 6. A pull of 600 N over two grips gives two forces of 300 N along its
 *    direction; over no grip none.
 * 7. The trunk's bend share: none for no torque; a quarter at the first
 *    quarter's moment; the whole range at the whole range's moment and
 *    past it; rising with the torque.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public laws on inputs whose answers the equations give; a wrong inverse, an extrapolation off the edge, a wrong ray exit, a bound off by its boundary, a swing that gains energy or releases elsewhere, a pull that loses force or a stiffness integrated wrong fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations Each expectation is the equation evaluated in the test, never the module's output fed back.
 * @evidence contracts/development/testing.md#distinguishing-cases Mass and edge scaling, equal dimensionless time, the longest former pull, three base queries, both sides of each bound, three swings, two pulls and the bend's ends and middle.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory, well under a second; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the laws, the tolerances with their reasons and the 7 scenarios.
 */
export function test_human_motion_force_exchange_laws(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const close = (a: number, b: number, relative: number): boolean =>
    Math.abs(a - b) <= relative * Math.max(1, Math.abs(a), Math.abs(b));

  // X = x + x'/ω satisfies X' = ωX + F/(Mω), X(0) = 0.
  // Thus X(T) = e fixes F independently of both implementations. Holding
  // ωT fixed isolates the quadratic frequency dependence of that force.
  const faster: number = 3.5;
  const base: Pull = { mass: 75, frequency: 3, edge: 0.05, seconds: 0.2 };
  const pulls: Pull[] = [
    base,
    { ...base, mass: 50 },
    { ...base, mass: 100 },
    { ...base, edge: 0.12 },
    { ...base, frequency: faster, seconds: (base.frequency * base.seconds) / faster },
    { mass: 100, frequency: faster, edge: 0.12, seconds: 0.6 },
  ];
  for (const pull of pulls) {
    const nondimensionalTime: number = pull.frequency * pull.seconds;
    const growth: number = Math.exp(nondimensionalTime);
    const inertia: number = pull.mass * pull.frequency ** 2;
    const expectedForce: number = (pull.edge * inertia) / (growth - 1);
    const force: number = HumanForceExchange.breaking(pull);
    const back: number = HumanForceExchange.broken({ ...pull, force: expectedForce });
    const drawn: ReturnType<typeof HumanForceExchange.drawn> = HumanForceExchange.drawn({
      ...pull,
      force: expectedForce,
    });
    const offset: number = (expectedForce / inertia) * ((growth + 1 / growth) / 2 - 1);
    const speed: number = (expectedForce / inertia) * pull.frequency * (growth - 1 / growth) / 2;
    const label: string = `${pull.mass} kg, ${pull.frequency}/s, ${pull.edge} m, ${pull.seconds} s`;
    all.check(`${label}: break force ${force}, expected ${expectedForce}`, close(force, expectedForce, 1e-9));
    all.check(`${label}: break at ${back}, expected ${pull.seconds}`, close(back, pull.seconds, 1e-9));
    all.check(
      `${label}: drawn state ${drawn.offset} m, ${drawn.speed} m/s, ${drawn.extrapolated} m; expected ${offset} m, ${speed} m/s, ${pull.edge} m`,
      close(drawn.offset, offset, 1e-9) &&
        close(drawn.speed, speed, 1e-9) &&
        close(drawn.extrapolated, pull.edge, 1e-9),
    );
  }
  all.check(
    "no pull never breaks the base",
    HumanForceExchange.broken({
      mass: 75,
      frequency: 3,
      edge: 0.1,
      force: 0,
    }) === Number.POSITIVE_INFINITY,
  );

  // 3. The base's extent along a direction.
  const square: IAutoMovieVector3[] = [
    { x: -0.5, y: 0, z: -0.5 },
    { x: 0.5, y: 0, z: -0.5 },
    { x: 0.5, y: 0, z: 0.5 },
    { x: -0.5, y: 0, z: 0.5 },
  ];
  const origin: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  all.check(
    "the square's extent along +X is 0.5 m",
    close(
      HumanForceExchange.edge(origin, { x: 1, y: 0, z: 0 }, square),
      0.5,
      1e-9,
    ),
  );
  all.check(
    "the square's extent along the diagonal is 0.5 sqrt 2 m",
    close(
      HumanForceExchange.edge(
        origin,
        { x: Math.SQRT1_2, y: 0, z: Math.SQRT1_2 },
        square,
      ),
      0.5 * Math.SQRT2,
      1e-9,
    ),
  );
  all.check(
    "a point outside the square has no extent",
    HumanForceExchange.edge(
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      square,
    ) === 0,
  );

  // 4. The resisted shift and its bound.
  const g: number = AutoMovieGravity.STANDARD;
  const shift: number = (100 * 1.2) / (75 * g);
  all.check(
    "a resisted pull shifts the centre of pressure F h / (M g)",
    close(
      HumanForceExchange.resisted({
        mass: 75,
        force: 100,
        height: 1.2,
        edge: 1,
      }) ?? NaN,
      shift,
      1e-9,
    ),
  );
  all.check(
    "a resisted pull exactly at the edge holds",
    HumanForceExchange.resisted({
      mass: 75,
      force: 100,
      height: 1.2,
      edge: shift,
    }) !== null,
  );
  all.check(
    "a resisted pull past the edge is null",
    HumanForceExchange.resisted({
      mass: 75,
      force: 100,
      height: 1.2,
      edge: shift * (1 - 1e-6),
    }) === null,
  );

  // 5. The swing.
  const mass: number = 75;
  const inertia: number = 10;
  const radius: number = 0.3;
  const moment: number = inertia + mass * radius * radius;
  const energy = (angle: number, rate: number): number =>
    (moment * rate * rate) / 2 + mass * g * radius * Math.cos(angle);
  const over = HumanForceExchange.swing({
    mass,
    inertia,
    radius,
    angle: 0.2,
    rate: 1,
  });
  all.check("a swing past the vertical releases", over !== null);
  if (over !== null) {
    const h: number = integrateMotionTrajectory.STEP;
    const omega: number = Math.sqrt((mass * g * radius) / moment);
    all.check(
      `the swing releases at ${over.angle(over.release)} rad, π / 2 within the rate times the step squared expected`,
      Math.abs(over.angle(over.release) - Math.PI / 2) <=
        Math.abs(over.rate(over.release)) * h * h,
    );
    all.check(
      `the swing keeps its energy: ${energy(0.2, 1)} at the start, ${energy(over.angle(over.release), over.rate(over.release))} at the release, within (h ω)^4 relative`,
      close(
        energy(over.angle(over.release), over.rate(over.release)),
        energy(0.2, 1),
        (h * omega) ** 4,
      ),
    );
  }
  all.check(
    "a slow swing from before the vertical with no pull stops short: null",
    HumanForceExchange.swing({
      mass,
      inertia,
      radius,
      angle: -0.5,
      rate: 0.1,
    }) === null,
  );
  all.check(
    "the same swing driven by the weight's moment releases",
    HumanForceExchange.swing({
      mass,
      inertia,
      radius,
      angle: -0.5,
      rate: 0.1,
      torque: mass * g * radius,
      until: Number.POSITIVE_INFINITY,
    }) !== null,
  );

  // 6. The pull over its grips.
  const pulled: IAutoMovieMotionHumanSustainedForce[] = HumanForceExchange.pull(
    {
      subject: "b",
      sites: ["chestLeft", "elbowRight"],
      direction: { x: 0, y: 0, z: 1 },
      force: 600,
      from: 0,
      to: 1,
    },
  );
  all.check(
    `a pull of 600 N over two grips gives ${pulled.length} forces of ${pulled.map((f) => JSON.stringify(HumanForce.at(f, 0.5))).join(", ")}`,
    pulled.length === 2 &&
      pulled.every((f: IAutoMovieMotionHumanSustainedForce): boolean => {
        const v: IAutoMovieVector3 = HumanForce.at(f, 0.5);
        return close(v.z, 300, 1e-12) && v.x === 0 && v.y === 0;
      }),
  );
  all.check(
    "a pull over no grip gives no force",
    HumanForceExchange.pull({
      subject: "b",
      sites: [],
      direction: { x: 0, y: 0, z: 1 },
      force: 600,
      from: 0,
      to: 1,
    }).length === 0,
  );

  // 7. The trunk's bend share.
  const STIFFNESS: readonly number[] = [0.32, 0.83, 2.03, 5.03];
  const range: number = 40;
  const quarter: number = (STIFFNESS[0]! * range) / 4;
  const whole: number = STIFFNESS.reduce(
    (s: number, k: number): number => s + (k * range) / 4,
    0,
  );
  all.check("no torque bends nothing", HumanForceTrunk.share(0, range) === 0);
  all.check(
    `the first quarter's moment bends a quarter, read ${HumanForceTrunk.share(quarter, range)}`,
    close(HumanForceTrunk.share(quarter, range), 0.25, 1e-9),
  );
  all.check(
    "the whole range's moment bends the whole range",
    close(HumanForceTrunk.share(whole, range), 1, 1e-9),
  );
  all.check(
    "past the whole range's moment the bend stays at the range's end",
    HumanForceTrunk.share(2 * whole, range) === 1,
  );
  let previous: number = 0;
  for (let k: number = 1; k <= 20; k++) {
    const now: number = HumanForceTrunk.share((whole * k) / 20, range);
    all.check(
      `the bend rises with the torque: ${now} at ${k}/20 of the whole moment, past ${previous}`,
      now > previous,
    );
    previous = now;
  }
  all.assert("the force exchange's laws hold their closed forms");
}
