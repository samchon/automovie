import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionHumanPropDynamics,
} from "@automovie/interface";
import { HumanPropDynamics } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Props with mass and friction moved by the hands' force (#3433):
 * `HumanPropDynamics`.
 *
 * Every crate weighs 40 kg on a floor of static coefficient 0.5 and kinetic
 * 0.4 (provisional coefficients for the case, not measured).
 *
 * Scenarios:
 * 1. Coulomb threshold: a constant push 1 % under `μs m g` leaves the crate
 *    where it stood for 2 s; 1 % over it moves it.
 * 2. Newton: under a constant push `F` past the threshold the crate's speed
 *    grows at `(F - μk m g) / m` within 1 % and its distance at half that
 *    times the time squared.
 * 3. Metamorphic: doubling the mass at equal net force halves the
 *    acceleration; a push that ramps from zero starts the crate only once it
 *    passes the threshold, at the ramp's own crossing time within a
 *    sixtieth of a second.
 * 4. A push of 300 N released at 1 s: the crate slides on under kinetic
 *    friction alone, decelerating at `μk g`, and comes to rest at
 *    `a t₁² / 2 + (a t₁)² / (2 μk g)` within 1 %; its distance never
 *    shrinks, since friction stops a crate but never drives it back, and
 *    its speed at 2 s, after the stop, is zero within a thousandth of its
 *    speed at the release.
 * 5. A door of 6 kg m² about its hinge under a 3 N m torque turns at
 *    `τ t / I` within 1e-6 rad/s and to `τ t² / (2 I)` within 1e-6 rad;
 *    under the smooth torque `3 cos(π t)` it swings to
 *    `(3 / I)(1 - cos π t) / π²` within 1e-6 rad and stops at 2 s, where
 *    the torque's impulse is zero.
 * 6. The lean that balances a push satisfies the moment balance
 *    `M g h sin θ = F y` within 1e-9 of `F y` for a push and a pull, grows
 *    with the push, is zero for none and leans back for a pull; a push
 *    0.1 % under `M g h / y` leans, and one 0.1 % over it, which the body's
 *    weight cannot balance, is reported (null).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Integrates slides and a hinge and reads the lean through the public module; a crate that starts below the threshold, an acceleration off Newton's law, a mass that does not scale it, a released crate that stops short, long or slides back, a door that turns at the wrong rate, or a lean off the moment balance fails.
 * @evidence contracts/development/testing.md#independent-expectations Coulomb's static threshold, Newton's second law under kinetic friction and its stopping distance, the rotational form for the hinge under a constant and a cosine torque, and static moment balance, each written out.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides of the static threshold, two masses, a constant, a ramped and a released push, a constant and a reversing torque, a push, a pull, none and both sides of the lean's limit; the hands' grip on the prop belongs to the haul rows' tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of pure functions, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios with their closed forms.
 */
export function test_human_motion_prop_dynamics(): void {
  const findings: string[] = [];
  const g: number = AutoMovieGravity.STANDARD;
  const crate = (
    mass: number,
    force: (seconds: number) => number,
  ): IAutoMovieMotionHumanPropDynamics.ISlide => ({
    mass,
    friction: 0.5,
    kinetic: 0.4,
    force,
    from: 0,
    to: 2,
  });
  const threshold: number = 0.5 * 40 * g;

  // 1. The static threshold.
  const under: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.slide(crate(40, (): number => 0.99 * threshold));
  if (under.at(2).x[0] !== 0)
    findings.push(
      `a push under the threshold moves the crate ${under.at(2).x[0]} m`,
    );
  const over: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.slide(crate(40, (): number => 1.01 * threshold));
  if (!(over.at(2).x[0]! > 0))
    findings.push("a push over the threshold leaves the crate");

  // 2. Newton under kinetic friction.
  const F: number = 300;
  const a: number = (F - 0.4 * 40 * g) / 40;
  const pushed: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.slide(crate(40, (): number => F));
  for (const t of [0.5, 1, 2]) {
    const [x, v] = pushed.at(t).x;
    if (Math.abs(v! - a * t) > 0.01 * a * t)
      findings.push(`at ${t} s the crate moves at ${v}, Newton ${a * t}`);
    if (Math.abs(x! - (a * t * t) / 2) > 0.01 * ((a * t * t) / 2))
      findings.push(
        `at ${t} s the crate has gone ${x}, Newton ${(a * t * t) / 2}`,
      );
  }

  // 3. Mass halves the acceleration; a ramp starts it at its crossing.
  const net: number = 100;
  const light: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.slide(crate(40, (): number => net + 0.4 * 40 * g));
  const heavy: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.slide({
      ...crate(80, (): number => net + 0.4 * 80 * g),
      friction: 0.4,
    });
  if (
    Math.abs(heavy.at(1).x[1]! - light.at(1).x[1]! / 2) >
    0.01 * light.at(1).x[1]!
  )
    findings.push(
      `twice the mass reaches ${heavy.at(1).x[1]} for ${light.at(1).x[1]}`,
    );
  const ramp: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.slide(crate(40, (t: number): number => 300 * t));
  const crossing: number = threshold / 300;
  const before: number = ramp.at(crossing - 1 / 60).x[0]!;
  const after: number = ramp.at(crossing + 2 / 60).x[0]!;
  if (before !== 0 || !(after > 0))
    findings.push(
      `a ramp starts the crate at the wrong time: ${before} before, ${after} after ${crossing.toFixed(3)} s`,
    );

  // 4. A released push: kinetic friction stops the crate, never reverses it.
  const released: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.slide(crate(40, (t: number): number => (t < 1 ? F : 0)));
  const release: number = a * 1;
  const rest: number = a / 2 + (release * release) / (2 * 0.4 * g);
  if (Math.abs(released.at(2).x[0]! - rest) > 0.01 * rest)
    findings.push(
      `a released crate rests at ${released.at(2).x[0]} m, Coulomb ${rest}`,
    );
  if (Math.abs(released.at(2).x[1]!) > 1e-3 * release)
    findings.push(`a stopped crate still moves at ${released.at(2).x[1]}`);
  let gone: number = 0;
  for (let k: number = 1; k <= 120; ++k) {
    const x: number = released.at(k / 60).x[0]!;
    if (x < gone - 1e-12) {
      findings.push(`friction drives the crate back at ${k / 60} s`);
      break;
    }
    gone = x;
  }

  // 5. A door.
  const door: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.hinge(6, (): number => 3, 0, 2);
  for (const t of [0.5, 1, 2]) {
    const [angle, speed] = door.at(t).x;
    if (Math.abs(angle! - (3 * t * t) / 12) > 1e-6)
      findings.push(
        `the door at ${t} s turns ${angle} rad, expected ${(3 * t * t) / 12}`,
      );
    if (Math.abs(speed! - (3 * t) / 6) > 1e-6)
      findings.push(
        `the door at ${t} s turns at ${speed} rad/s, expected ${(3 * t) / 6}`,
      );
  }
  const swung: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    HumanPropDynamics.hinge(
      6,
      (t: number): number => 3 * Math.cos(Math.PI * t),
      0,
      2,
    );
  for (const t of [0.5, 1, 1.5, 2]) {
    const expected: number =
      ((3 / 6) * (1 - Math.cos(Math.PI * t))) / (Math.PI * Math.PI);
    if (Math.abs(swung.at(t).x[0]! - expected) > 1e-6)
      findings.push(
        `a reversing torque turns the door ${swung.at(t).x[0]} rad at ${t} s, expected ${expected}`,
      );
  }
  if (Math.abs(swung.at(2).x[1]!) > 1e-6)
    findings.push(
      `a torque of zero impulse leaves the door turning at ${swung.at(2).x[1]}`,
    );

  // 6. The lean.
  const M: number = 76;
  const h: number = 0.95;
  const y: number = 1.1;
  const none: number | null = HumanPropDynamics.lean(M, h, 0, y);
  const small: number | null = HumanPropDynamics.lean(M, h, 100, y);
  const large: number | null = HumanPropDynamics.lean(M, h, 200, y);
  const pull: number | null = HumanPropDynamics.lean(M, h, -100, y);
  if (none !== 0) findings.push(`no push leans ${none}`);
  if (small === null || large === null || !(large > small) || !(small > 0))
    findings.push(`the lean does not grow with the push: ${small}, ${large}`);
  if (pull === null || !(pull < 0)) findings.push(`a pull leans ${pull}`);
  for (const [force, theta] of [
    [100, small],
    [200, large],
    [-100, pull],
  ] as const)
    if (
      theta !== null &&
      Math.abs(M * g * h * Math.sin((theta * Math.PI) / 180) - force * y) >
        1e-9 * Math.abs(force * y)
    )
      findings.push(`a lean of ${theta} deg does not balance ${force} N`);
  const limit: number = (M * g * h) / y;
  if (HumanPropDynamics.lean(M, h, 0.999 * limit, y) === null)
    findings.push("a push the weight can balance is reported");
  if (HumanPropDynamics.lean(M, h, 1.001 * limit, y) !== null)
    findings.push("an unbalanceable push is clamped to a lean");

  TestValidator.predicate(
    `prop dynamics: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
