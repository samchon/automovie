import type { IAutoMovieMotionHumanForce, IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieGravity, integrateMotionTrajectory } from "@automovie/engine";

import {
  HumanForce,
  HumanForceExchange,
  HumanForceTrunk,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";

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
 * 1. For masses 50, 75 and 100 kg, frequencies 3 and 3.5 per second, edges
 *    0.05 and 0.12 m and instants 0.2 and 0.6 s, `broken(breaking(T)) = T`
 *    and the drawn centre's extrapolation at `T` is the edge.
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
 * @evidence contracts/development/testing.md#distinguishing-cases A grid of masses, frequencies, edges and instants, three base queries, both sides of each bound, three swings, two pulls and the bend's ends and middle.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory, well under a second; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the laws, the tolerances with their reasons and the 7 scenarios.
 */
export function test_human_motion_force_exchange_laws(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const close = (a: number, b: number, relative: number): boolean =>
    Math.abs(a - b) <= relative * Math.max(1, Math.abs(a), Math.abs(b));

  // 1 and 2. The inverse pair and the extrapolation at the break.
  for (const mass of [50, 75, 100])
    for (const frequency of [3, 3.5])
      for (const edge of [0.05, 0.12])
        for (const seconds of [0.2, 0.6]) {
          const force: number = HumanForceExchange.breaking({
            mass,
            frequency,
            edge,
            seconds,
          });
          const back: number = HumanForceExchange.broken({
            mass,
            frequency,
            edge,
            force,
          });
          all.check(
            `${mass} kg, ${frequency}/s, ${edge} m, ${seconds} s: the break comes back at ${back}`,
            close(back, seconds, 1e-9),
          );
          const drawn = HumanForceExchange.drawn({
            mass,
            frequency,
            force,
            seconds,
          });
          const a: number = force / (mass * frequency * frequency);
          all.check(
            `${mass} kg, ${frequency}/s, ${edge} m, ${seconds} s: the extrapolated centre is ${drawn.extrapolated} m at the break, the edge expected`,
            close(drawn.extrapolated, edge, 1e-9) &&
              close(drawn.offset, a * (Math.cosh(frequency * seconds) - 1), 1e-9),
          );
        }
  all.check(
    "no pull never breaks the base",
    HumanForceExchange.broken({ mass: 75, frequency: 3, edge: 0.1, force: 0 }) ===
      Number.POSITIVE_INFINITY,
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
    close(HumanForceExchange.edge(origin, { x: 1, y: 0, z: 0 }, square), 0.5, 1e-9),
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
    HumanForceExchange.edge({ x: 2, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, square) ===
      0,
  );

  // 4. The resisted shift and its bound.
  const g: number = AutoMovieGravity.STANDARD;
  const shift: number = (100 * 1.2) / (75 * g);
  all.check(
    "a resisted pull shifts the centre of pressure F h / (M g)",
    close(
      HumanForceExchange.resisted({ mass: 75, force: 100, height: 1.2, edge: 1 }) ??
        NaN,
      shift,
      1e-9,
    ),
  );
  all.check(
    "a resisted pull exactly at the edge holds",
    HumanForceExchange.resisted({ mass: 75, force: 100, height: 1.2, edge: shift }) !==
      null,
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
    HumanForceExchange.swing({ mass, inertia, radius, angle: -0.5, rate: 0.1 }) ===
      null,
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
  const pulled: IAutoMovieMotionHumanForce.ISustained[] = HumanForceExchange.pull({
    subject: "b",
    sites: ["chestLeft", "elbowRight"],
    direction: { x: 0, y: 0, z: 1 },
    force: 600,
    from: 0,
    to: 1,
  });
  all.check(
    `a pull of 600 N over two grips gives ${pulled.length} forces of ${pulled.map((f) => JSON.stringify(HumanForce.at(f, 0.5))).join(", ")}`,
    pulled.length === 2 &&
      pulled.every((f: IAutoMovieMotionHumanForce.ISustained): boolean => {
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
