import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** A 200 m straight entered and left at its 10 m/s cruise, with no rate: it never changes speed. */
const STEADY: AutoMovieArchetypeCourse.ICourse = {
  start: { x: 0, z: 0, heading: 0 },
  legs: [{ kind: "straight", length: 200 }],
  cruise: 10,
  startSpeed: 10,
  endSpeed: 10,
};

/**
 * A course reads its acceleration and its braking only where it speeds up or slows, so a course run at one speed needs neither, and a course that does change speed without the rate it needs is refused at that rate.
 *
 * Scenarios:
 * 1. A straight entered and left at its cruise, with no rates, is at 10 m/s at every second read, has gone 10 m a second, and runs 20 s; its states are bit for bit those of the same course given both rates, which it never reads.
 * 1b. Two 100 m legs, each marked at the 10 m/s cruise and entered at it, plan without rates: 20 s, and 130 m at 13 s.
 * 2. The same straight left at rest needs only its braking: given a deceleration of 2 m/s squared it runs the cruise and then brakes over the last 25 m, `v^2 / (2 b)`, and without one it is refused at `course.deceleration`.
 * 3. The same straight entered from rest without an acceleration is refused at `course.acceleration`.
 */
export function test_unit_archetypes_core_ride_course_steady(): void {
  const findings: string[] = [];

  // 1. One speed throughout, with no rates and with both.
  const plan: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.plan(
    "test",
    STEADY,
  );
  const rated: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.plan(
    "test",
    {
      ...STEADY,
      acceleration: 2,
      deceleration: 3,
    },
  );
  if (Math.abs(plan.duration - 200 / 10) > 1e-9)
    findings.push(`the steady course runs ${plan.duration} s, 20 s expected`);
  for (let t: number = 0; t <= plan.duration; t += 0.37) {
    const state: AutoMovieArchetypeCourse.IState = plan.at(t);
    if (
      Math.abs(state.speed - 10) > 1e-9 ||
      Math.abs(state.distance - 10 * t) > 1e-9
    )
      findings.push(
        `at ${t} s the steady course is at ${state.speed} m/s after ${state.distance} m`,
      );
    const other: AutoMovieArchetypeCourse.IState = rated.at(t);
    if (other.distance !== state.distance || other.speed !== state.speed)
      findings.push(
        `at ${t} s the rates a steady course never reads changed it`,
      );
  }

  // 1b. Two legs marked at the cruise, entered at it: steady with marks, no rate read.
  const marked: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.plan(
    "test",
    {
      start: { x: 0, z: 0, heading: 0 },
      legs: [
        { kind: "straight", length: 100 },
        { kind: "straight", length: 100 },
      ],
      cruise: 10,
      startSpeed: 10,
      speeds: [10, 10],
    },
  );
  if (
    Math.abs(marked.duration - 20) > 1e-9 ||
    Math.abs(marked.at(13).distance - 130) > 1e-9
  )
    findings.push(
      `the marked steady course runs ${marked.duration} s and is at ${marked.at(13).distance} m at 13 s`,
    );

  // 2. Slowing to a stop needs only the braking.
  const stopping: AutoMovieArchetypeCourse.IPlan =
    AutoMovieArchetypeCourse.plan("test", {
      ...STEADY,
      endSpeed: 0,
      deceleration: 2,
    });
  const braking: number = (10 * 10) / (2 * 2);
  if (
    Math.abs(stopping.at(stopping.duration).distance - 200) > 1e-9 ||
    Math.abs(stopping.when(200 - braking) - (200 - braking) / 10) > 1e-9
  )
    findings.push(
      `the stopping course does not cruise to ${200 - braking} m and brake over ${braking} m`,
    );

  // 2 and 3. A speed change without its rate.
  for (const [field, course] of [
    ["course.deceleration", { ...STEADY, endSpeed: 0 }],
    ["course.acceleration", { ...STEADY, startSpeed: 0 }],
  ] as const) {
    let refused: string | null = null;
    try {
      AutoMovieArchetypeCourse.plan("test", course);
    } catch (error) {
      refused =
        error instanceof AutoMovieArchetypeRefusal ? error.axis : String(error);
    }
    if (refused !== field)
      findings.push(`a course missing its ${field} was refused at ${refused}`);
  }
  TestValidator.equals(
    "a course reads only the rates its speed changes need",
    findings,
    [],
  );
}
