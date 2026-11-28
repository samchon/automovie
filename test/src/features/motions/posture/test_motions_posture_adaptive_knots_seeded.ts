import {
  prepareHumanAdaptiveKnots
} from "../../../../../packages/motions/src/posture/internal/prepareHumanAdaptiveKnots";
import { TestValidator } from "@nestia/e2e";

/** The sine's requirement, in its own units. */
const TOLERANCE: number = 1e-4;

/**
 * How far the course may stray from the sine between the points the midpoint
 * criterion tested: twice the tolerance, the criterion bounding the error at
 * the midpoints it reads and the quintics' error varying smoothly between
 * them.
 */
const ERROR_BOUND: number = 2 * TOLERANCE;

/** The knot cap of the never-accepted case: two full sweeps, 6 + 5 + 10. */
const CAP: number = 21;

/** A seeded evaluation's record: its time and the time of the knot it continued. */
interface ICall {
  time: number;
  near: number | undefined;
}

/**
 * `prepareHumanAdaptiveKnots.seeded` is AutoKnots (Vitenti et al. 2024,
 * arXiv:2412.13423) with each evaluation continued from a knot before it and
 * the caller's own acceptance besides the paper's two criteria: the six uniform
 * starting knots are evaluated in ascending order, each from the one before,
 * and a midpoint from its sub-interval's first knot; a sub-interval converges
 * only where `accept` holds as well. A sweep that would pass `maxKnots` is not
 * run, and a sub-interval binary64 cannot halve is left converged.
 *
 * Scenarios, the payload of each evaluation its own time:
 *
 * 1. On `sin t` over [0, π] to 1e-4: the first evaluation continues nothing, each
 *    later starting knot the one before, and each midpoint the first knot of
 *    the sub-interval it halves, both ends of which are knots; every knot's
 *    payload is its time.
 * 2. Between its knots the course stays within twice the tolerance of the sine.
 * 3. With `accept` never holding and `maxKnots` 21, two sweeps run, 6 + 5 + 10 =
 *    21 knots, and the third, which would add 20, does not; `accept` reads each
 *    midpoint between its sub-interval's ends.
 * 4. Over six consecutive doubles from 1, no midpoint is a new number: no
 *    evaluation beyond the six starting knots, though `accept` never holds.
 * 5. Refinement only adds knots: the knots of one refinement pass include every
 *    knot of none, on a step `tanh(20 (t − 0.3))`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains predecessor seed ownership, extra acceptance, sweep budget and unhalvable intervals.
 * @evidence contracts/development/testing.md#behavioral-verification Records predecessor payloads for sine and forced nonacceptance, then compares neighboring doubles and one refinement pass.
 * @evidence contracts/development/testing.md#independent-expectations The full sweep sizes are 6 + 5 + 10 = 21 knots. Sine values bound interpolation error and no new float fits between adjacent clocks.
 */
export function test_motions_posture_adaptive_knots_seeded(): void {
  // 1. The seeding order.
  const calls: ICall[] = [];
  const sine: prepareHumanAdaptiveKnots.ISeededKnots<number> =
    prepareHumanAdaptiveKnots.seeded<number>({
      from: 0,
      to: Math.PI,
      evaluate: (
        time: number,
        near: prepareHumanAdaptiveKnots.IPoint<number> | undefined,
      ): prepareHumanAdaptiveKnots.IPoint<number> => {
        calls.push({ time, near: near?.payload });
        return { values: [Math.sin(time)], payload: time };
      },
      tolerance: { kind: "absolute", absolute: TOLERANCE },
    });
  const knot = (t: number): boolean => sine.times.includes(t);
  TestValidator.predicate(
    "the starting knots continue one another",
    calls[0]!.near === undefined &&
      calls
        .slice(1, 6)
        .every(
          (call: ICall, i: number): boolean => call.near === calls[i]!.time,
        ),
  );
  TestValidator.predicate(
    "a midpoint continues its sub-interval's first knot",
    calls
      .slice(6)
      .every(
        (call: ICall): boolean =>
          call.near !== undefined &&
          call.near < call.time &&
          knot(call.near) &&
          sine.times.some(
            (b: number): boolean => (call.near! + b) / 2 === call.time,
          ),
      ),
  );
  TestValidator.predicate(
    "every knot carries its own payload",
    sine.payloads.every((p: number, i: number): boolean => p === sine.times[i]),
  );

  // 2. The course to the requirement.
  TestValidator.predicate(
    "the course within the bound",
    Array.from(
      { length: 1001 },
      (_: unknown, k: number): number => (k * Math.PI) / 1000,
    ).every(
      (t: number): boolean =>
        Math.abs(sine.course.position(t)[0]! - Math.sin(t)) <= ERROR_BOUND,
    ),
  );

  // 3. Never accepted, capped.
  let between: boolean = true;
  const capped: prepareHumanAdaptiveKnots.ISeededKnots<number> =
    prepareHumanAdaptiveKnots.seeded<number>({
      from: 0,
      to: 1,
      evaluate: (time: number): prepareHumanAdaptiveKnots.IPoint<number> => ({
        values: [time],
        payload: time,
      }),
      tolerance: { kind: "absolute", absolute: 1 },
      accept: (
        middle: prepareHumanAdaptiveKnots.IPoint<number>,
        left: prepareHumanAdaptiveKnots.IPoint<number>,
        right: prepareHumanAdaptiveKnots.IPoint<number>,
      ): boolean => {
        between &&= middle.payload === (left.payload + right.payload) / 2;
        return false;
      },
      maxKnots: CAP,
    });
  TestValidator.predicate(
    "two sweeps and no third",
    capped.times.length === CAP && between,
  );

  // 4. The resolution of time.
  let evaluated: number = 0;
  const tight: prepareHumanAdaptiveKnots.ISeededKnots<undefined> =
    prepareHumanAdaptiveKnots.seeded<undefined>({
      from: 1,
      to: 1 + 5 * Number.EPSILON,
      evaluate: (): prepareHumanAdaptiveKnots.IPoint<undefined> => {
        ++evaluated;
        return { values: [1], payload: undefined };
      },
      tolerance: { kind: "absolute", absolute: 1 },
      accept: (): boolean => false,
    });
  TestValidator.predicate(
    "no sub-interval of one ulp is halved",
    evaluated === 6 && tight.times.length === 6,
  );

  // 5. Refinement adds.
  const step = (t: number): readonly number[] => [Math.tanh(20 * (t - 0.3))];
  const plain: prepareHumanAdaptiveKnots.IKnots = prepareHumanAdaptiveKnots({
    from: 0,
    to: 1,
    evaluate: step,
    tolerance: { kind: "absolute", absolute: 1e-3 },
    refine: 0,
  });
  const refined: prepareHumanAdaptiveKnots.IKnots = prepareHumanAdaptiveKnots({
    from: 0,
    to: 1,
    evaluate: step,
    tolerance: { kind: "absolute", absolute: 1e-3 },
    refine: 1,
  });
  TestValidator.predicate(
    "refinement keeps every knot",
    plain.times.every((t: number): boolean => refined.times.includes(t)) &&
      refined.times.length >= plain.times.length,
  );
}
