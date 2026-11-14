import { ArchetypeCourse, ArchetypeRefusal } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** A straight, a quarter turn of 20 m radius and a straight, marked 8, 3 and 12 m/s at their ends. */
const COURSE: ArchetypeCourse.ICourse = {
  start: { x: 0, z: 0, heading: 0 },
  legs: [
    { kind: "straight", length: 60 },
    { kind: "turn", radius: 20, angle: 90 },
    { kind: "straight", length: 80 },
  ],
  speeds: [8, 3, 12],
  cruise: 10,
  acceleration: 2,
  deceleration: 3,
};

/**
 * A course with a speed mark at each leg's end reaches each mark exactly where its leg ends, changes speed only at its rates, holds the faster of each leg's two marks, and stops and waits where a mark is 0.
 *
 * Scenarios:
 * 1. The course of three legs at 8, 3 and 12 m/s is at each mark at its leg's end, within 1e-9 m/s.
 * 2. Over 4000 samples its speed never changes faster than the acceleration or the braking, never jumps, and never exceeds the faster of the marks around the leg it is on.
 * 3. Its instants name `leg2Start` and `leg3Start` where the second and third legs begin and `turn2Start` and `turn2End` around the turn.
 * 4. A course that stops at the end of its first leg and pauses 2 s there names `stop1` and `depart1` 2 s apart, stands still between them, and runs its second leg, between two stops, up to the cruising speed.
 * 5. A corner marked 3 m/s after a straight marked 12 m/s: the support holds 12 m/s until the braking distance to the corner, (12 squared - 3 squared) over 2 b, then brakes at the course's rate onto 3 m/s exactly at the corner's start, and holds 3 m/s through the whole corner.
 * 6. A mark its leg cannot reach, 30 m/s after a 10 m leg from rest, is refused at that mark with the reachable range, 0 to the square root of 2 a L; speed marks of the wrong count, a pause where the support does not stop, and an end speed beside the marks are refused at their fields.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans courses with speed marks and samples their states; a mark missed at its leg's end, a speed change faster than the rates, a jump, an overshoot past the leg's top speed, a misplaced instant, a pause that moves, or an unreachable mark planned anyway is caught.
 * @evidence contracts/development/testing.md#independent-expectations The marks are the course's own; the rates bound the finite difference of the speed by kinematics; a leg's length is its run (a turn's arc r theta); the reachable range from rest is v squared = 2 a L; the cruising speed caps a leg between two stops, as `ArchetypeCourse.ICourse.cruise` states.
 * @evidence contracts/development/testing.md#distinguishing-cases Rising and falling marks, a slow corner after a fast straight, a stop with a pause, a leg between stops, and one refusal per rule; courses without marks belong to `test_archetype_ride_course` and `test_archetype_ride_course_unchanged`, flying starts to `test_archetype_ride_course_flying`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory plans, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_archetype_ride_course_profile(): void {
  const findings: string[] = [];
  const plan: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", COURSE);
  const ends: number[] = [60, 60 + 10 * Math.PI, 140 + 10 * Math.PI];

  // 1. Each mark at its leg's end.
  ends.forEach((end: number, k: number): void => {
    const speed: number = plan.at(plan.when(end)).speed;
    if (Math.abs(speed - COURSE.speeds![k]!) > 1e-9)
      findings.push(`leg ${k + 1} ends at ${speed} m/s`);
  });
  if (Math.abs(plan.length - ends[2]!) > 1e-9) findings.push("the length");

  // 2. Rates, continuity and each leg's top speed.
  const steps: number = 4000;
  const dt: number = plan.duration / steps;
  let before: ArchetypeCourse.IState = plan.at(0);
  for (let k: number = 1; k <= steps; k++) {
    const now: ArchetypeCourse.IState = plan.at(k * dt);
    const rate: number = (now.speed - before.speed) / dt;
    if (rate > 2 + 1e-6 || rate < -3 - 1e-6)
      findings.push(`the speed changes at ${rate} m/s squared at ${k * dt} s`);
    const leg: number = ends.findIndex((end: number): boolean => now.distance <= end);
    const top: number = Math.max(
      leg === 0 ? 0 : COURSE.speeds![leg - 1]!,
      COURSE.speeds![leg]!,
    );
    if (now.speed > top + 1e-9)
      findings.push(`${now.speed} m/s on leg ${leg + 1}, above its ${top}`);
    before = now;
  }

  // 3. The instants.
  const labels: string[] = plan.instants.map(
    (i: { label: string }): string => i.label,
  );
  TestValidator.equals(
    "instants of a marked course",
    labels,
    ["depart", "leg2Start", "turn2Start", "turn2End", "leg3Start", "stop"],
  );

  // 4. A stop with a pause, then a leg between stops at the cruising speed.
  const stopping: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", {
    ...COURSE,
    legs: [
      { kind: "straight", length: 30, pause: 2 },
      { kind: "straight", length: 100 },
    ],
    speeds: [0, 0],
  });
  const stop: number = stopping.instants.find(
    (i: { label: string }): boolean => i.label === "stop1",
  )?.seconds ?? Number.NaN;
  const depart: number = stopping.instants.find(
    (i: { label: string }): boolean => i.label === "depart1",
  )?.seconds ?? Number.NaN;
  if (!(Math.abs(depart - stop - 2) < 1e-9))
    findings.push(`stop1 at ${stop} and depart1 at ${depart}`);
  for (const t of [stop, (stop + depart) / 2, depart])
    if (Math.abs(stopping.at(t).distance - 30) > 1e-9 || stopping.at(t).speed > 1e-9)
      findings.push(`the support moves during its pause at ${t} s`);
  if (Math.abs(stopping.peak - 10) > 1e-9)
    findings.push(`a leg between stops peaks at ${stopping.peak}, not the cruise`);

  // 5. A corner held at its mark, approached from a faster leg: 12 m/s, then braking onto 3 m/s exactly at the corner, 3 m/s through it.
  const cornering: ArchetypeCourse.IPlan = ArchetypeCourse.plan("test", {
    ...COURSE,
    legs: [
      { kind: "straight", length: 80 },
      { kind: "straight", length: 60 },
      { kind: "turn", radius: 15, angle: 90 },
      { kind: "straight", length: 40 },
    ],
    speeds: [12, 3, 3, 10],
  });
  const corner: number = 140;
  const braking: number = corner - (12 * 12 - 3 * 3) / (2 * 3);
  for (const [distance, speed] of [
    [80, 12],
    [braking - 1, 12],
    [braking, 12],
    [(braking + corner) / 2, Math.sqrt(9 + 2 * 3 * (corner - (braking + corner) / 2))],
    [corner, 3],
    [corner + 7.5 * Math.PI / 2, 3],
    [corner + 7.5 * Math.PI, 3],
  ] as const) {
    const got: number = cornering.at(cornering.when(distance)).speed;
    if (Math.abs(got - speed) > 1e-9)
      findings.push(`approaching the corner at ${distance} m: ${got} m/s, not ${speed}`);
  }

  // 6. Refusals.
  const short: unknown = caught(() =>
    ArchetypeCourse.plan("test", {
      ...COURSE,
      legs: [{ kind: "straight", length: 10 }],
      speeds: [30],
    }),
  );
  if (
    !(short instanceof ArchetypeRefusal) ||
    short.axis !== "course.speeds[0]" ||
    short.feasible?.kind !== "range" ||
    short.feasible.minimum !== 0 ||
    Math.abs(short.feasible.maximum! - Math.sqrt(2 * 2 * 10)) > 1e-12
  )
    findings.push(`an unreachable mark: ${String(short)}`);
  for (const [axis, course] of [
    ["course.speeds", { ...COURSE, speeds: [8, 3] }],
    [
      "course.legs[0].pause",
      { ...COURSE, legs: [{ ...COURSE.legs[0]!, pause: 1 }, ...COURSE.legs.slice(1)] },
    ],
    ["course.endSpeed", { ...COURSE, endSpeed: 12 }],
  ] as const) {
    const thrown: unknown = caught(() => ArchetypeCourse.plan("test", course));
    if (!(thrown instanceof ArchetypeRefusal) || thrown.axis !== axis)
      findings.push(`expected a refusal at ${axis}, got ${String(thrown)}`);
  }
  TestValidator.equals("speed marks are met at the rates", findings, []);
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
