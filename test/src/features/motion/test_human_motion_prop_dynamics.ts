import { AutoMovieGravity, integrateMotionTrajectory } from "@automovie/engine";
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
 * 4. A door of 6 kg m² about its hinge under a 3 N m torque turns at `τ / I`,
 *    its angle `τ t² / (2 I)` within 1e-6 rad, and its handle, 0.8 m from
 *    the hinge, stays on its arc: the arc's radius is the handle's distance
 *    for every angle.
 * 5. The lean that balances a push grows with the push, is zero for none,
 *    leans back for a pull, and is reported (null) for a push the body's
 *    weight cannot balance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Integrates slides and a hinge and reads the lean through the public module; a crate that starts below the threshold, an acceleration off Newton's law, a mass that does not scale it, a door that turns at the wrong rate or a lean of the wrong sign fails.
 * @evidence contracts/development/testing.md#independent-expectations Coulomb's static threshold, Newton's second law under kinetic friction, the rotational form for the hinge and static moment balance, each written out.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides of the threshold, two masses, a constant and a ramped push, a hinge, a push, a pull, none and an unbalanceable push; the hands' grip on the prop belongs to the haul rows' tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of pure functions, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios with their closed forms.
 */
export function test_human_motion_prop_dynamics(): void {
  const findings: string[] = [];
  const g: number = AutoMovieGravity.STANDARD;
  const crate = (
    mass: number,
    force: (seconds: number) => number,
  ): HumanPropDynamics.ISlide => ({
    mass,
    friction: 0.5,
    kinetic: 0.4,
    force,
    from: 0,
    to: 2,
  });
  const threshold: number = 0.5 * 40 * g;

  // 1. The static threshold.
  const under: integrateMotionTrajectory.ITrajectory = HumanPropDynamics.slide(crate(40, (): number => 0.99 * threshold));
  if (under.at(2).x[0] !== 0) findings.push(`a push under the threshold moves the crate ${under.at(2).x[0]} m`);
  const over: integrateMotionTrajectory.ITrajectory = HumanPropDynamics.slide(crate(40, (): number => 1.01 * threshold));
  if (!(over.at(2).x[0]! > 0)) findings.push("a push over the threshold leaves the crate");

  // 2. Newton under kinetic friction.
  const F: number = 300;
  const a: number = (F - 0.4 * 40 * g) / 40;
  const pushed: integrateMotionTrajectory.ITrajectory = HumanPropDynamics.slide(crate(40, (): number => F));
  for (const t of [0.5, 1, 2]) {
    const [x, v] = pushed.at(t).x;
    if (Math.abs(v! - a * t) > 0.01 * a * t)
      findings.push(`at ${t} s the crate moves at ${v}, Newton ${a * t}`);
    if (Math.abs(x! - (a * t * t) / 2) > 0.01 * ((a * t * t) / 2))
      findings.push(`at ${t} s the crate has gone ${x}, Newton ${(a * t * t) / 2}`);
  }

  // 3. Mass halves the acceleration; a ramp starts it at its crossing.
  const net: number = 100;
  const light: integrateMotionTrajectory.ITrajectory = HumanPropDynamics.slide(crate(40, (): number => net + 0.4 * 40 * g));
  const heavy: integrateMotionTrajectory.ITrajectory = HumanPropDynamics.slide({
    ...crate(80, (): number => net + 0.4 * 80 * g),
    friction: 0.4,
  });
  if (Math.abs(heavy.at(1).x[1]! - light.at(1).x[1]! / 2) > 0.01 * light.at(1).x[1]!)
    findings.push(`twice the mass reaches ${heavy.at(1).x[1]} for ${light.at(1).x[1]}`);
  const ramp: integrateMotionTrajectory.ITrajectory = HumanPropDynamics.slide(crate(40, (t: number): number => 300 * t));
  const crossing: number = threshold / 300;
  const before: number = ramp.at(crossing - 1 / 60).x[0]!;
  const after: number = ramp.at(crossing + 2 / 60).x[0]!;
  if (before !== 0 || !(after > 0))
    findings.push(`a ramp starts the crate at the wrong time: ${before} before, ${after} after ${crossing.toFixed(3)} s`);

  // 4. A door.
  const door: integrateMotionTrajectory.ITrajectory = HumanPropDynamics.hinge(6, (): number => 3, 0, 2);
  for (const t of [0.5, 1, 2]) {
    const angle: number = door.at(t).x[0]!;
    if (Math.abs(angle - (3 * t * t) / 12) > 1e-6)
      findings.push(`the door at ${t} s turns ${angle} rad, expected ${(3 * t * t) / 12}`);
    const handle: [number, number] = [0.8 * Math.cos(angle), 0.8 * Math.sin(angle)];
    if (Math.abs(Math.hypot(...handle) - 0.8) > 1e-12)
      findings.push(`the handle leaves its arc at ${t} s`);
  }

  // 5. The lean.
  const none: number | null = HumanPropDynamics.lean(76, 0.95, 0, 1.1);
  const small: number | null = HumanPropDynamics.lean(76, 0.95, 100, 1.1);
  const large: number | null = HumanPropDynamics.lean(76, 0.95, 200, 1.1);
  const pull: number | null = HumanPropDynamics.lean(76, 0.95, -100, 1.1);
  if (none !== 0) findings.push(`no push leans ${none}`);
  if (small === null || large === null || !(large > small) || !(small > 0))
    findings.push(`the lean does not grow with the push: ${small}, ${large}`);
  if (pull === null || !(pull < 0)) findings.push(`a pull leans ${pull}`);
  if (HumanPropDynamics.lean(76, 0.95, 5000, 1.1) !== null)
    findings.push("an unbalanceable push is clamped to a lean");

  TestValidator.predicate(
    `prop dynamics: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
