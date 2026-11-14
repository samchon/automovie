import { speedProfile } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The engine's speed profile lays progress along a path from speed marks at given lengths and at given seconds in closed form, within its rates, with continuous speed, from a flying start and a start second.
 *
 * Scenarios, at 2 m/s squared up and 3 down, from a start at 1 s moving at 2 m/s:
 * 1. A 40 m distance stretch to 6 m/s capped at 8: it accelerates for 3 s over 15 m, holds 8 m/s for (40 - 15 - 14/3) / 8 s and brakes for 2/3 s onto 6 m/s at 40 m; at 2.5 s it has gone 2 times 1.5 plus 1.5 squared metres at 5 m/s.
 * 2. A 3 s seconds stretch from 6 to 0 m/s brakes at 2 m/s squared over 9 m, then a 2 s seconds stretch at rest holds still, then a 10 m distance stretch from rest to rest capped at 20 peaks at the square root of 2 L a b over (a + b).
 * 3. At 2000 seconds the distance never falls, the speed never changes faster than the rates nor jumps, and every stretch ends at its mark; `when` returns the second a distance is first reached, a held distance at its hold's start.
 * 4. Before its start second the mover is at rest at 0 m; at it, at 0 m and 2 m/s; after its end, at the end.
 * 5. `reach` gives the square roots of v0 squared minus and plus 2 a L, floored at rest.
 * 6. A mark beyond reach, a cap below a mark, and a seconds stretch faster than the rates throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Lays profiles and samples them; a wrong peak, a stretch that misses its mark, a speed change faster than the rates, a jump, a mover that moves before its start or during a hold, a `when` that does not invert `at`, or an impossible profile laid anyway is caught.
 * @evidence contracts/development/testing.md#independent-expectations Constant-acceleration kinematics worked here: v = v0 + a t, s = v0 t + a t squared over 2, and v squared = v0 squared + 2 a s; the peak of a rest-to-rest stretch where accelerating and braking distances sum to its length.
 * @evidence contracts/development/testing.md#distinguishing-cases Distance and seconds stretches, capped and peaking stretches, a flying start, a hold at rest, before, at and after the profile, and one throw per rule; the course built on it belongs to the `test_archetype_ride_course` tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of a pure engine function, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_engine_speed_profile(): void {
  const findings: string[] = [];
  const profile: speedProfile.IProfile = speedProfile({
    start: 1,
    speed: 2,
    acceleration: 2,
    deceleration: 3,
    stretches: [
      { kind: "distance", length: 40, speed: 6, cap: 8 },
      { kind: "seconds", seconds: 3, speed: 0 },
      { kind: "seconds", seconds: 2, speed: 0 },
      { kind: "distance", length: 10, speed: 0, cap: 20 },
    ],
  });
  const close = (a: number, b: number, what: string): void => {
    if (!(Math.abs(a - b) <= 1e-9)) findings.push(`${what}: ${a}, not ${b}`);
  };

  // 1. The capped distance stretch.
  const hold: number = (40 - 15 - 14 / 3) / 8;
  const first: number = 1 + 3 + hold + 2 / 3;
  close(profile.stretches[0]!.peak, 8, "the first stretch's peak");
  close(profile.stretches[0]!.end, first, "the first stretch's end");
  close(profile.at(2.5).distance, 2 * 1.5 + 1.5 * 1.5, "distance at 2.5 s");
  close(profile.at(2.5).speed, 5, "speed at 2.5 s");
  close(profile.at(first).distance, 40, "distance at the first mark");
  close(profile.at(first).speed, 6, "speed at the first mark");

  // 2. Braking over seconds, a hold, a peaking stretch.
  close(profile.at(first + 3).distance, 49, "distance after braking 3 s");
  close(profile.at(first + 4).distance, 49, "distance during the hold");
  close(profile.at(first + 4).speed, 0, "speed during the hold");
  const peak: number = Math.sqrt((2 * 10 * 2 * 3) / 5);
  close(profile.stretches[3]!.peak, peak, "the last stretch's peak");
  close(profile.length, 59, "the length");
  close(profile.end, first + 5 + peak / 2 + peak / 3, "the end");

  // 3. Sweep: monotone distance, bounded and continuous speed, inverse.
  const steps: number = 2000;
  const dt: number = (profile.end - profile.start) / steps;
  let before: speedProfile.IState = profile.at(profile.start);
  for (let k: number = 1; k <= steps; k++) {
    const t: number = profile.start + k * dt;
    const now: speedProfile.IState = profile.at(t);
    const rate: number = (now.speed - before.speed) / dt;
    if (now.distance < before.distance - 1e-12)
      findings.push(`the distance falls at ${t} s`);
    if (rate > 2 + 1e-6 || rate < -3 - 1e-6)
      findings.push(`the speed changes at ${rate} m/s squared at ${t} s`);
    if (now.speed > 0.01 && Math.abs(profile.when(now.distance) - t) > 1e-6)
      findings.push(`when(${now.distance}) is ${profile.when(now.distance)}, not ${t}`);
    before = now;
  }
  close(profile.when(49), first + 3, "a held distance is reached when the hold begins");
  close(profile.when(-1), profile.start, "before the path");
  close(profile.when(100), profile.end, "beyond the path");

  // 4. Before, at and after.
  if (profile.at(0).distance !== 0 || profile.at(0).speed !== 0)
    findings.push("the mover moves before its start second");
  close(profile.at(1).speed, 2, "the flying start's speed");
  close(profile.at(profile.end + 5).distance, 59, "after the end");

  // 5. Reach.
  const reach: { minimum: number; maximum: number } = speedProfile.reach(10, 5, 2, 3);
  close(reach.minimum, Math.sqrt(100 - 30), "the least speed reached");
  close(reach.maximum, Math.sqrt(100 + 20), "the greatest speed reached");
  close(speedProfile.reach(2, 50, 2, 3).minimum, 0, "a stop within reach");

  // 6. Impossible profiles.
  for (const [name, stretches] of [
    ["a mark beyond reach", [{ kind: "distance", length: 1, speed: 9, cap: 10 }]],
    ["a cap below a mark", [{ kind: "distance", length: 50, speed: 9, cap: 8 }]],
    ["a seconds stretch too fast", [{ kind: "seconds", seconds: 1, speed: 10 }]],
  ] as const) {
    let threw: boolean = false;
    try {
      speedProfile({ start: 0, speed: 0, acceleration: 2, deceleration: 3, stretches });
    } catch {
      threw = true;
    }
    if (!threw) findings.push(`${name} is laid`);
  }
  TestValidator.equals("a speed profile meets its marks within its rates", findings, []);
}
