import {
  ArchetypeCourse,
  ArchetypeRefusal,
  ArchetypeRide,
  createCar,
  createCart,
  createMotorcycle,
  driveCar,
  rideMotorcycle,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/predicates";

/**
 * Samples of a point going round a circle at a steady speed, as a wheeling formation's outer slot does.
 *
 * @param radius The circle's radius, metres.
 * @param speed The point's speed, metres per second.
 * @param seconds How long it goes round, seconds.
 * @param step The seconds between samples.
 * @returns The samples, starting at the origin heading along `+Z` and going round to the left, toward `+X`.
 */
function circle(
  radius: number,
  speed: number,
  seconds: number,
  step: number,
): ArchetypeCourse.ISample[] {
  const samples: ArchetypeCourse.ISample[] = [];
  for (let t: number = 0; t <= seconds + 1e-9; t += step) {
    const angle: number = (speed * t) / radius;
    samples.push({
      seconds: t,
      x: radius - radius * Math.cos(angle),
      z: radius * Math.sin(angle),
    });
  }
  return samples;
}

/**
 * A course read from timed samples passes through every sample at its second with continuous speed and heading, and a ride refuses it where it bends or goes faster than the ride allows, naming the second.
 *
 * Scenarios, for samples every half second of a point going round a 20 m circle to the left at 6 m/s for 10 s:
 * 1. At each sample's second the root is at the sample, within 1e-6 m.
 * 2. Over 2000 seconds between, the speed and the heading never jump and the speed stays within 2 % of 6 m/s, the curvature within 5 % of a twentieth and positive, a left bend; the root faces along its motion.
 * 3. The path's length is the arc's, 60 m, within 1 cm, and `when` inverts the distance at 50 seconds.
 * 4. A cart rides it like any course, and a car steers left on it.
 * 5. A circle of 5 m radius at 12 m/s, sampled as densely as the first (every 7 degrees of arc), leans a motorcycle past 50 degrees and is refused at a sample with the fastest speed the bend allows, the square root of g r tan 50, within 5 %, its reason naming a second; a car on a 2 m circle is refused by its lock at a sample.
 * 6. One sample, a second that does not increase, and a coordinate that is not finite are refused at their fields.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans timed courses, samples them and rides them; a path that misses a sample, a speed or heading that jumps, a wrong length, a bend to the wrong side, or a ride that admits a bend beyond its lean or lock is caught.
 * @evidence contracts/development/testing.md#independent-expectations The samples lie on a circle travelled at a steady speed, so the path's speed, curvature and length are those of uniform circular motion, v, 1 over r and v t; the lean limit is the steady-turn balance tan theta = v squared over g r; the percent bounds allow the cubic interpolation's departure from the circle between samples, the samples themselves being exact.
 * @evidence contracts/development/testing.md#distinguishing-cases A bend within and beyond a motorcycle's lean and a car's lock, a cart that only goes along, and one refusal per malformed field; courses of legs belong to the other `test_archetype_ride_course` tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory plans and models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_archetype_ride_course_timed(): void {
  const findings: string[] = [];
  const samples: ArchetypeCourse.ISample[] = circle(20, 6, 10, 0.5);
  const plan: ArchetypeCourse.IPlan = ArchetypeCourse.timed("test", samples);

  // 1. Through every sample.
  for (const sample of samples)
    if (
      !vclose(
        plan.at(sample.seconds).placement.translation,
        { x: sample.x, y: 0, z: sample.z },
        1e-6,
      )
    )
      findings.push(`the path misses the sample at ${sample.seconds} s`);

  // 2. Continuous, steady, bending left.
  let before: ArchetypeCourse.IState = plan.at(0);
  for (let k: number = 1; k <= 2000; k++) {
    const t: number = (10 * k) / 2000;
    const now: ArchetypeCourse.IState = plan.at(t);
    const heading = (s: ArchetypeCourse.IState): number =>
      Math.atan2(
        2 * (s.placement.rotation.x * s.placement.rotation.z +
          s.placement.rotation.w * s.placement.rotation.y),
        1 - 2 * (s.placement.rotation.x ** 2 + s.placement.rotation.y ** 2),
      );
    if (Math.abs(now.speed - before.speed) > 0.05)
      findings.push(`the speed jumps at ${t} s`);
    if (Math.abs(heading(now) - heading(before)) > 0.01)
      findings.push(`the heading jumps at ${t} s`);
    if (Math.abs(now.speed - 6) > 0.12) findings.push(`the speed is ${now.speed} at ${t} s`);
    if (Math.abs(now.curvature - 0.05) > 0.0025)
      findings.push(`the curvature is ${now.curvature} at ${t} s`);
    before = now;
  }

  // 3. Length and its inverse.
  if (Math.abs(plan.length - 60) > 0.01) findings.push(`the length is ${plan.length}`);
  for (let k: number = 0; k <= 50; k++) {
    const t: number = (10 * k) / 50;
    if (Math.abs(plan.when(plan.at(t).distance) - t) > 1e-6)
      findings.push(`when does not invert the distance at ${t} s`);
  }

  // 4. Ridden like any course.
  const cart: ArchetypeRide.IRide<createCart.Affordance, createCart.Dimension> =
    ArchetypeRide.along(createCart({ kind: "trolley" }, 1), plan);
  if (!vclose(cart.at(3).placement.translation, plan.at(3).placement.translation, 1e-12))
    findings.push("a cart does not ride the timed course");
  const car: ReturnType<typeof createCar> = createCar({ kind: "sedan" }, 2);
  if (!(driveCar(car, plan).at(5).archetype.travel("wheel") > 0))
    findings.push("a car does not steer left on a left bend");

  // 5. Too fast for a motorcycle's lean, too tight for a car's lock.
  const fast: unknown = caught(() =>
    rideMotorcycle(
      createMotorcycle({ kind: "motorcycle" }, 1),
      ArchetypeCourse.timed("motorcycle", circle(5, 12, 4, 0.05)),
    ),
  );
  const allowed: number = Math.sqrt(9.80665 * 5 * Math.tan((50 * Math.PI) / 180));
  if (
    !(fast instanceof ArchetypeRefusal) ||
    !fast.axis.startsWith("samples[") ||
    fast.feasible?.kind !== "range" ||
    Math.abs(fast.feasible.maximum! - allowed) > 0.05 * allowed ||
    !/ at \d/.test(fast.reason)
  )
    findings.push(`a motorcycle past its lean: ${String(fast)}`);
  const tight: unknown = caught(() =>
    driveCar(car, ArchetypeCourse.timed("car", circle(2, 2, 3, 0.25))),
  );
  if (!(tight instanceof ArchetypeRefusal) || !tight.axis.startsWith("samples["))
    findings.push(`a car past its lock: ${String(tight)}`);

  // 6. Malformed samples.
  for (const [axis, bad] of [
    ["samples", [samples[0]!]],
    ["samples[1].seconds", [samples[0]!, { ...samples[1]!, seconds: 0 }]],
    ["samples[1].x", [samples[0]!, { ...samples[1]!, x: Number.NaN }]],
  ] as const) {
    const thrown: unknown = caught(() => ArchetypeCourse.timed("test", bad));
    if (!(thrown instanceof ArchetypeRefusal) || thrown.axis !== axis)
      findings.push(`expected a refusal at ${axis}, got ${String(thrown)}`);
  }
  TestValidator.equals("a timed course passes its samples", findings, []);
}

/** Run an operation and return what it throws, or undefined. */
function caught(operation: () => unknown): unknown {
  try {
    operation();
  } catch (error) {
    return error;
  }
  return undefined;
}
