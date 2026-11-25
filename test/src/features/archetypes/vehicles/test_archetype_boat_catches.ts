import {
  AutoMovieArchetypeCourse,
  createBoat,
  rowBoat,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * Native distance sampling preserves the exact catches from the full course sampler.
 *
 * Scenarios:
 * 1. A straight course from rest ends partway through a stroke.
 * 2. A straight course ends at a whole stroke.
 * 3. A marked course pauses at a whole stroke, then takes a turn and reverses up a grade.
 * 4. An opaque plan still reads its own states for each bisection candidate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the exact result and the boundaries exercised.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the emitted catches and counts dispatches to a caller-supplied plan.
 * @evidence contracts/development/testing.md#independent-expectations Uses the full course sampler to reproduce the original catch search for each native course.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers whole and partial terminal strokes, a pause, a turn, a grade and reverse motion.
 * @evidence contracts/development/testing.md#execution-ownership Plans in-memory courses and starts no host.
 */
export function test_archetype_boat_catches(): void {
  const boat: ReturnType<typeof createBoat> = createBoat(
    { kind: "rowboat" },
    2,
  );
  const straight: AutoMovieArchetypeCourse.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 20 }],
    cruise: 1.5,
    acceleration: 0.5,
    deceleration: 0.5,
  };
  const courses: readonly AutoMovieArchetypeCourse.ICourse[] = [
    straight,
    { ...straight, legs: [{ kind: "straight", length: 18 }] },
    {
      ...straight,
      legs: [
        { kind: "straight", length: 6, pause: 1 },
        { kind: "turn", radius: 6, angle: 90 },
        { kind: "straight", length: 5, rise: 0.5, reverse: true },
      ],
      speeds: [0, 0, 0],
    },
  ];
  for (const [index, course] of courses.entries()) {
    const plan: AutoMovieArchetypeCourse.IPlan = AutoMovieArchetypeCourse.plan(
      boat.archetype,
      course,
    );
    let reads: number = 0;
    const opaque: ReturnType<typeof rowBoat> = rowBoat(boat, {
      ...plan,
      at: (seconds: number): AutoMovieArchetypeCourse.IState => {
        ++reads;
        return plan.at(seconds);
      },
    });
    const native: ReturnType<typeof rowBoat> = rowBoat(boat, course);
    const catches: number = opaque.instants.filter(
      (instant: { label: string }): boolean =>
        instant.label.startsWith("catch"),
    ).length;
    TestValidator.predicate(
      `course ${index + 1} preserves every instant exactly`,
      () =>
        native.instants.length === opaque.instants.length &&
        native.instants.every(
          (instant: { seconds: number; label: string }, i: number): boolean =>
            instant.label === opaque.instants[i]!.label &&
            Object.is(instant.seconds, opaque.instants[i]!.seconds),
        ),
    );
    TestValidator.equals(
      `course ${index + 1} reads the opaque total and all forty candidates per catch`,
      reads,
      1 + 40 * catches,
    );
  }
}
