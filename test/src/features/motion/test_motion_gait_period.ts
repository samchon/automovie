import { gaitMotion } from "@automovie/engine";
import { IAutoMovieGait } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

/** Observe synchronous refusal only, without selecting a production message. */
const throws: (task: () => void) => boolean = (task: () => void): boolean => {
  try {
    task();
    return false;
  } catch {
    return true;
  }
};

const gait: (period: number) => IAutoMovieGait = (
  period: number,
): IAutoMovieGait => ({
  name: "walk",
  period,
  limbs: [
    { bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 30 },
    { bone: "rightUpperLeg", phase: 0.5, duty: 0.5, amplitude: 30 },
  ],
});

/**
 * Pin the gait cycle's finite positive period and the one-interval bake's opening and closing local times.
 *
 * Scenarios:
 *
 * 1. Non-finite and non-positive periods throw before synthesis.
 * 2. A small positive period remains valid and controls the emitted duration.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls gaitMotion with invalid periods and asserts refusal, then observes the duration and both endpoint times of a valid short cycle, catching missing period admission or a duration/sample-clock mismatch.
 * @evidence contracts/testing.md#independent-expectations The authored period must be finite and positive; with one interval, the supported sample clock opens at zero and closes at the supplied 0.25 seconds. Existing nclose predicates retain their absolute tolerance, while any thrown value satisfies the malformed-input observations.
 * @evidence contracts/testing.md#distinguishing-cases Preserves NaN, positive infinity, zero and negative periods plus the valid 0.25-second cycle. Sample-count and phase admission and limb/root-bob scalar behavior have separate owning tests.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit directly owns all period cases through gaitMotion. Its local builder supplies unchanged two-limb input data, and namedFacts evaluates endpoint observations in order without starting a consumer or native artifact.
 */
export function test_motion_gait_period(): void {
  for (const period of [Number.NaN, Infinity, 0, -1])
    TestValidator.predicate(
      `period ${period} throws`,
      throws((): void => {
        gaitMotion("invalid", "sk", gait(period), 1);
      }),
    );

  const short: ReturnType<typeof gaitMotion> = gaitMotion(
    "short",
    "sk",
    gait(0.25),
    1,
  );
  TestValidator.equals(
    "positive period is preserved",
    namedFacts([
      ["ncloseShortDuration", (): boolean => nclose(short.duration, 0.25)],
      [
        "ncloseShortKeyframes",
        (): boolean => nclose(short.keyframes[0]!.time, 0),
      ],
      [
        "ncloseShortKeyframes2",
        (): boolean => nclose(short.keyframes[1]!.time, 0.25),
      ],
    ]),
    {
      ncloseShortDuration: true,
      ncloseShortKeyframes: true,
      ncloseShortKeyframes2: true,
    },
  );
}
