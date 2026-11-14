import { motionComposeCourse } from "../internal/motionComposeCourse";

/**
 * The scenarios of `motionComposeCourse` on the m-short body: one spec per body of the
 * sweep, so every body is read and each runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the centre of mass of the posture at the solved place; a course that puts the hips rather than the centre on the filter, a wrong time constant, a target sampled a step late or a heading ignored fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected centres are the closed forms of the stated differential equation with the cited eigenfrequency, computed here from the body's hip height.
 * @evidence contracts/development/testing.md#distinguishing-cases A held, a stepped and a moving target, two headings, a rigid carry against planted feet, inside and outside the span, on fourteen bodies; every failing cell is named with its body, its instant and its measured numbers; one body of the sweep per spec, the other thirteen their own specs.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, where the scenarios and their bounds are stated and the split.
 */
export function test_human_motion_compose_course_m_short(): void {
  motionComposeCourse("m-short");
}
