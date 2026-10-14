import { gaitMotion } from "@automovie/engine";
import { IAutoMovieGait } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

/** Observe any synchronous refusal; error class and message remain unchecked. */
const throws: (task: () => void) => boolean = (task: () => void): boolean => {
  try {
    task();
    return false;
  } catch {
    return true;
  }
};

const gait: IAutoMovieGait = {
  name: "walk",
  period: 1,
  limbs: [
    { bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 30 },
    { bone: "rightUpperLeg", phase: 0.5, duty: 0.5, amplitude: 30 },
  ],
};

/**
 * Pin positive-integer sample admission and the smallest valid gait bake's two endpoint keyframes.
 *
 * Scenarios:
 *
 * 1. Non-finite, non-integer, and less-than-one sample counts throw.
 * 2. The valid boundary `samples = 1` emits the opening and closing keyframes.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls gaitMotion with malformed sample counts and asserts refusal, then checks that the one-interval boundary emits two keyframes at the supported cycle endpoints, catching fractional/empty bake admission or an off-by-one output population.
 * @evidence contracts/testing.md#independent-expectations A positive integer counts sample intervals, so one interval has two endpoints at zero and the authored one-second period. These literal expectations do not use generated keyframes as the oracle; existing nclose tolerances are preserved and any thrown value satisfies refusal checks.
 * @evidence contracts/testing.md#distinguishing-cases Preserves NaN, fractional 1.5, zero and negative sample counts and the accepted singleton interval. Larger sample populations, cycle phase, period and limb/root-bob scalars are owned by other gait tests.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns its malformed table and accepted boundary through the engine producer. The local refusal helper and lazy named facts register no tests and need no host, process or native artifact.
 */
export function test_motion_gait_samples(): void {
  for (const samples of [Number.NaN, 1.5, 0, -1])
    TestValidator.predicate(
      `samples ${samples} throws`,
      throws((): void => {
        gaitMotion("invalid", "sk", gait, samples);
      }),
    );

  const boundary: ReturnType<typeof gaitMotion> = gaitMotion(
    "boundary",
    "sk",
    gait,
    1,
  );
  TestValidator.equals(
    "one sample emits two keyframes",
    boundary.keyframes.length,
    2,
  );
  TestValidator.equals(
    "boundary times are finite and span one period",
    namedFacts([
      [
        "ncloseBoundaryKeyframes",
        (): boolean => nclose(boundary.keyframes[0]!.time, 0),
      ],
      [
        "ncloseBoundaryKeyframes2",
        (): boolean => nclose(boundary.keyframes[1]!.time, 1),
      ],
    ]),
    { ncloseBoundaryKeyframes: true, ncloseBoundaryKeyframes2: true },
  );
}
