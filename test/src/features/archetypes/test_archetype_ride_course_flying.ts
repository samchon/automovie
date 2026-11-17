import {
  ArchetypeCourse,
  ArchetypeRefusal,
  createCart,
  ArchetypeRide,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/predicates";

/** A 200 m straight entered and left at 10 m/s under a 12 m/s cruise. */
const FLYING: ArchetypeCourse.ICourse = {
  start: { x: 0, z: 0, heading: 0 },
  legs: [{ kind: "straight", length: 200 }],
  cruise: 12,
  acceleration: 2,
  deceleration: 3,
  startSpeed: 10,
  endSpeed: 10,
};

/**
 * A course may begin with its support already moving and end with it still moving, and may begin at a film second after 0, holding its support at the start until then.
 *
 * Scenarios:
 * 1. A straight with `startSpeed` 10 and `endSpeed` 10 is at 10 m/s at its first and its last second, rises to the 12 m/s cruise between, and its running time is the trapezoid's from 10 to 12 and back to 10.
 * 2. The same course with `at: 4` holds the support at its start, at rest, at 0, 2 and just before 4 s; at 4 s it is at the start moving at 10 m/s; every state after is the unshifted course's 4 s earlier, its instants are shifted by 4 s, and a ride along it reads the shifted plan.
 * 3. A start speed above the cruise and an end speed the course cannot reach (10 m/s on a 1 m straight from rest) are refused at their fields with the feasible range.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans flying and delayed courses and samples them; a support that starts or ends at rest, moves before its start second, or a start or end speed admitted beyond what the course allows is caught.
 * @evidence contracts/development/testing.md#independent-expectations The trapezoid's times from v = v0 + a t and its distances from (v0 + v) t / 2 are worked here; the shift by the start second is a translation in time; the reachable end speed from rest over L is the square root of 2 a L.
 * @evidence contracts/development/testing.md#distinguishing-cases A flying start and end, a delayed start before, at and after its second, and one refusal per field; speed marks belong to `test_archetype_ride_course_profile`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory plans, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_ride_course_flying(): void {
  const findings: string[] = [];
  const plan: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", FLYING);

  // 1. Moving at both ends.
  const up: number = (12 - 10) / 2;
  const down: number = (12 - 10) / 3;
  const level: number = (200 - ((10 + 12) * up) / 2 - ((12 + 10) * down) / 2) / 12;
  if (Math.abs(plan.duration - (up + level + down)) > 1e-9)
    findings.push(`running time ${plan.duration}`);
  if (
    Math.abs(plan.at(0).speed - 10) > 1e-9 ||
    Math.abs(plan.at(plan.duration).speed - 10) > 1e-9 ||
    Math.abs(plan.at(up + level / 2).speed - 12) > 1e-9
  )
    findings.push("speeds at the ends and in the middle");

  // 2. A delayed start.
  const delayed: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", {
    ...FLYING,
    at: 4,
  });
  for (const t of [0, 2, 4 - 1e-9]) {
    const state: ArchetypeCourse.IState = delayed.at(t);
    if (state.distance !== 0 || state.speed !== 0)
      findings.push(`before its start the support moves at ${t} s`);
  }
  if (delayed.at(4).distance !== 0 || Math.abs(delayed.at(4).speed - 10) > 1e-9)
    findings.push("at its start second the support is not starting at 10 m/s");
  for (const t of [4.5, 9, 4 + plan.duration])
    if (
      Math.abs(delayed.at(t).distance - plan.at(t - 4).distance) > 1e-9 ||
      !vclose(
        delayed.at(t).placement.translation,
        plan.at(t - 4).placement.translation,
        1e-9,
      )
    )
      findings.push(`the delayed course at ${t} s is not the course at ${t - 4} s`);
  if (
    delayed.instants.length !== plan.instants.length ||
    delayed.instants.some(
      (i: { seconds: number; label: string }, k: number): boolean =>
        i.label !== plan.instants[k]!.label ||
        Math.abs(i.seconds - plan.instants[k]!.seconds - 4) > 1e-9,
    )
  )
    findings.push("the delayed instants are not shifted by 4 s");
  const ride: ArchetypeRide.IRide<
    createCart.Affordance,
    createCart.Dimension
  > = ArchetypeRide.along(
    createCart({ kind: "trolley" }, 1),
    { ...FLYING, at: 4 },
  );
  if (
    !vclose(ride.at(2).placement.translation, { x: 0, y: 0, z: 0 }, 1e-12) ||
    Math.abs(ride.duration - delayed.duration) > 1e-12
  )
    findings.push("a ride does not read the delayed plan");

  // 3. Refusals of the start and end speeds.
  for (const [axis, course, maximum] of [
    ["course.startSpeed", { ...FLYING, startSpeed: 13 }, 12],
    [
      "course.endSpeed",
      { ...FLYING, startSpeed: 0, legs: [{ kind: "straight", length: 1 }] },
      Math.sqrt(2 * 2 * 1),
    ],
  ] as const) {
    let thrown: unknown = null;
    try {
      ArchetypeCourse.plan("test", course);
    } catch (error) {
      thrown = error;
    }
    if (
      !(thrown instanceof ArchetypeRefusal) ||
      thrown.axis !== axis ||
      thrown.feasible?.kind !== "range" ||
      Math.abs(thrown.feasible.maximum! - maximum) > 1e-12
    )
      findings.push(`expected a refusal at ${axis}, got ${String(thrown)}`);
  }
  TestValidator.equals("a course starts and ends where it is asked", findings, []);
}
