import { prepareHumanAdaptiveKnots } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `prepareHumanAdaptiveKnots` places knots by AutoKnots (Vitenti et al. 2024,
 * arXiv:2412.13423): six uniform knots, then each unconverged sub-interval's
 * midpoint evaluated, made a knot and judged by the midpoint and Simpson
 * integral criteria, with one refinement pass.
 *
 * Scenarios:
 *
 * 1. A constant converges on the first sweep: the six initial knots and the five
 *    midpoints, eleven knots, all equal widths so refinement resets none, and
 *    eleven evaluations, every one a knot.
 * 2. `sin` on [0, π] to an absolute 1e-4: every evaluation is a knot, the knots
 *    ascend, the course passes through them exactly, and more knots are placed
 *    than for the constant.
 * 3. `max_nodes` caps the knots.
 * 4. A declared event is a knot even when the cap prevents any sweep.
 */
export function test_unit_motions_posture_adaptive_knots(): void {
  // 1. A constant.
  let calls: number = 0;
  const flat: prepareHumanAdaptiveKnots.IKnots = prepareHumanAdaptiveKnots({
    from: 0,
    to: 1,
    evaluate: (): readonly number[] => {
      ++calls;
      return [2];
    },
    tolerance: { kind: "relative", relative: 1e-8, scale: 0 },
  });
  TestValidator.predicate(
    "a constant takes the initial knots and their midpoints",
    flat.times.length === 11 && calls === 11,
  );

  // 2. A sine.
  calls = 0;
  const sine: prepareHumanAdaptiveKnots.IKnots = prepareHumanAdaptiveKnots({
    from: 0,
    to: Math.PI,
    evaluate: (t: number): readonly number[] => {
      ++calls;
      return [Math.sin(t)];
    },
    tolerance: { kind: "absolute", absolute: 1e-4 },
  });
  const ascending: boolean = sine.times.every(
    (t: number, i: number): boolean => i === 0 || t > sine.times[i - 1]!,
  );
  const through: boolean = sine.times.every(
    (t: number, i: number): boolean =>
      Math.abs(sine.course.position(t)[0]! - sine.values[i]![0]!) < 1e-12,
  );
  TestValidator.predicate(
    "every evaluation is a knot, ascending, on the course",
    calls === sine.times.length &&
      ascending &&
      through &&
      sine.times.length > flat.times.length,
  );

  // 3. The cap.
  const capped: prepareHumanAdaptiveKnots.IKnots = prepareHumanAdaptiveKnots({
    from: 0,
    to: Math.PI,
    evaluate: (t: number): readonly number[] => [Math.sin(t)],
    tolerance: { kind: "absolute", absolute: 1e-9 },
    maxKnots: 40,
  });
  TestValidator.predicate(
    "the knots stop at the cap",
    capped.times.length <= 40,
  );

  // 4. The branch does not fall on the six-point grid or on a midpoint.
  const event: number = 0.27;
  const branch: prepareHumanAdaptiveKnots.IKnots = prepareHumanAdaptiveKnots({
    from: 0,
    to: 1,
    evaluate: (t: number): readonly number[] => [Math.abs(t - event)],
    tolerance: { kind: "absolute", absolute: 1e-4 },
    requiredTimes: [event, event, -1, 2],
    maxKnots: 7,
  });
  TestValidator.equals(
    "the declared branch is placed exactly once",
    [0, 0.2, event, 0.4, 0.6, 0.8, 1],
    [...branch.times],
  );
  TestValidator.predicate(
    "the course passes through the event",
    Math.abs(branch.course.position(event)[0]!) <= Number.EPSILON,
  );
}
