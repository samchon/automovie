import { prepareHumanSampledCourse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a quintic's evaluation, units of the value. */
const ROUNDING: number = 1e-9;

/** A short step of time to read a rate by a forward difference, seconds. */
const DT: number = 1e-6;

/**
 * `prepareHumanSampledCourse` joins values solved at their seconds by the
 * minimum-jerk path through them (Flash and Hogan 1985): it passes each knot's
 * exact value, starts and ends at rest, and holds the end values outside; a
 * knot within `GAP` of the one before is dropped, a single knot holds, and
 * `window` gives a short easing's ends and middle.
 *
 * Scenarios, the value `t^2` sampled at 0, 1 and 2 s:
 *
 * 1. The course passes 0, 1 and 4 at the knots.
 * 2. It leaves the first knot and reaches the last at rest.
 * 3. Before the first and after the last second it holds 0 and 4.
 * 4. A second knot half a microsecond after the first is dropped: the course
 *    through 0 s, 0.0000005 s and 1 s equals the course through 0 and 1 s.
 * 5. One knot holds its value at every second.
 * 6. A window from 1 to 3 s has the knots 1, 2 and 3; an empty one only its start.
 */
export function test_unit_motions_posture_prepare_human_sampled_course(): void {
  const course: (seconds: number) => number[] = prepareHumanSampledCourse(
    [0, 1, 2],
    (t: number): number[] => [t * t],
  );

  // 1. Through the knots.
  TestValidator.predicate(
    "through the knots",
    [0, 1, 2].every((t: number): boolean =>
      nclose(course(t)[0]!, t * t, ROUNDING),
    ),
  );

  // 2. At rest at the ends.
  TestValidator.predicate(
    "at rest at the ends",
    Math.abs(course(DT)[0]! - course(0)[0]!) / DT < 1e-3 &&
      Math.abs(course(2)[0]! - course(2 - DT)[0]!) / DT < 1e-3,
  );

  // 3. Held outside.
  TestValidator.predicate(
    "held outside",
    nclose(course(-1)[0]!, 0, ROUNDING) && nclose(course(3)[0]!, 4, ROUNDING),
  );

  // 4. Knots within the gap.
  const near: (seconds: number) => number[] = prepareHumanSampledCourse(
    [0, prepareHumanSampledCourse.GAP / 2, 1],
    (t: number): number[] => [t],
  );
  const plain: (seconds: number) => number[] = prepareHumanSampledCourse(
    [0, 1],
    (t: number): number[] => [t],
  );
  TestValidator.predicate(
    "a knot within the gap is dropped",
    [0.25, 0.5, 0.75].every((t: number): boolean =>
      nclose(near(t)[0]!, plain(t)[0]!, ROUNDING),
    ),
  );

  // 5. One knot.
  const held: (seconds: number) => number[] = prepareHumanSampledCourse.through(
    [{ seconds: 1, position: [7, 8] }],
  );
  TestValidator.equals(
    "one knot holds",
    [held(0), held(5)],
    [
      [7, 8],
      [7, 8],
    ],
  );

  // 6. A window's knots.
  TestValidator.equals(
    "a window's knots",
    [
      prepareHumanSampledCourse.window(1, 3),
      prepareHumanSampledCourse.window(2, 2),
    ],
    [[1, 2, 3], [2]],
  );
}
