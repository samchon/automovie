import { prepareHumanSampledCourse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** A short step of time to read a rate by a forward difference, seconds. */
const DT: number = 1e-6;

/**
 * A rate read as rest, units per second: a piece starting at rest moves by its
 * jerk times DT³ / 6 over the difference, far under this.
 */
const REST: number = 1e-3;

/**
 * How near a moving course's rate at a mark is to `cos t`, units per second:
 * the knotted course's slope error at the requirement 1e-4.
 */
const SLOPE: number = 0.01;

/**
 * A forced knot's second, off every uniform and halved AutoKnots spacing of [0,
 * 2].
 */
const MARK: number = 0.77;

/** The sampled value. */
const sine = (t: number): number[] => [Math.sin(t)];

/** A sampled course of `sin t` over [0, 2] with forced knots. */
function course(
  marks: readonly number[],
  breaks: readonly number[],
  reads?: number[],
): (seconds: number) => number[] {
  return prepareHumanSampledCourse({
    from: 0,
    to: 2,
    marks,
    breaks,
    sample: (t: number): number[] => {
      reads?.push(t);
      return sine(t);
    },
    tolerance: { kind: "absolute", absolute: 1e-4 },
    step: 1e-3,
  });
}

/** The forward-difference rate of a course at a second. */
function rate(read: (seconds: number) => number[], t: number): number {
  return (read(t + DT)[0]! - read(t)[0]!) / DT;
}

/**
 * `prepareHumanSampledCourse`'s forced knots: a mark is a knot the course
 * passes on the move and a break one it stops at, split there; forced knots are
 * sorted, and a forced knot within `GAP` of another or of an end is one with
 * it. Where a break and a mark coincide the break holds.
 *
 * Scenarios, `sin t` over [0, 2] to 1e-4:
 *
 * 1. Marks at 0.77 s and half `GAP` after it: 0.77 is read, and nothing within
 *    `GAP` after it, so the second mark is the first.
 * 2. A mark half `GAP` before the end is no knot: nothing is read within `GAP`
 *    before 2 s but 2 s itself.
 * 3. A mark alone passes 0.77 s at the rate of `sin t`, `cos 0.77`; a break and a
 *    mark there stop it.
 * 4. Breaks given out of order and repeated, 1.5, 0.5 and 0.5, stop the course at
 *    0.5 and 1.5 s.
 */
export function test_unit_motions_posture_sampled_course_forced(): void {
  const gap: number = prepareHumanSampledCourse.GAP;

  // 1. Two marks within the gap.
  const near: number[] = [];
  course([MARK, MARK + gap / 2], [], near);
  TestValidator.predicate(
    "two marks within the gap are one",
    near.includes(MARK) &&
      near.every((t: number): boolean => t <= MARK || t > MARK + gap),
  );

  // 2. A mark within the gap of the end.
  const end: number[] = [];
  course([2 - gap / 2], [], end);
  TestValidator.predicate(
    "a mark at the end is no knot",
    end.every((t: number): boolean => t === 2 || t < 2 - gap),
  );

  // 3. A mark passes; a break stops.
  const passing: (seconds: number) => number[] = course([MARK], []);
  const stopping: (seconds: number) => number[] = course([MARK], [MARK]);
  TestValidator.predicate(
    "a mark passes and a break stops",
    Math.abs(rate(passing, MARK) - Math.cos(MARK)) < SLOPE &&
      Math.abs(rate(stopping, MARK)) < REST &&
      Math.abs(rate(stopping, MARK - DT)) < REST,
  );

  // 4. Unordered, repeated breaks.
  const stops: (seconds: number) => number[] = course([], [1.5, 0.5, 0.5]);
  TestValidator.predicate(
    "the breaks are sorted and merged",
    [0.5, 1.5].every(
      (t: number): boolean =>
        Math.abs(rate(stops, t)) < REST && Math.abs(rate(stops, t - DT)) < REST,
    ),
  );
}
