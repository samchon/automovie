import { motionComposeCourse } from "../internal/motionComposeCourse";

/**
 * The centre of mass follows its differential equation when the target
 * holds, steps or ramps. Scaling length and time together gives the same
 * fraction of travel for the shortest and tallest bodies.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the centre of mass of the posture at the solved place; a course that puts the hips rather than the centre on the filter, a wrong time constant, a target sampled a step late or a heading ignored fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected centres are the closed forms of the stated differential equation with the cited eigenfrequency, computed here from the body's hip height.
 * @evidence contracts/development/testing.md#distinguishing-cases A held, stepped and moving target, two headings, a rigid carry and planted feet, and the span clamps on the reference body. The stature endpoints exercise the scale relation.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the response law and the scale relation.
 */
export function test_human_motion_compose_course_m_average(): void {
  motionComposeCourse();
}
