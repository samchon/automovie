import { gaitLimbFlexion } from "@automovie/engine";
import { IAutoMovieGaitLimb } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Observe any synchronous refusal without constraining its class or message. */
const throws: (task: () => void) => boolean = (task: () => void): boolean => {
  try {
    task();
    return false;
  } catch {
    return true;
  }
};

const limb: IAutoMovieGaitLimb = {
  bone: "leftUpperLeg",
  phase: 0,
  duty: 0.5,
  amplitude: 30,
};

/**
 * Pin scalar admission at the public gait-limb evaluator before invalid period or limb parameters can enter its phase and easing arithmetic.
 *
 * Scenarios:
 *
 * 1. Invalid period, phase, duty, amplitude, and neutral values throw.
 * 2. Boundary-adjacent duty values inside `(0, 1)` remain valid.
 *
 * @evidence contracts/testing.md#behavioral-verification Invokes gaitLimbFlexion for each invalid scalar and asserts synchronous refusal, then checks finite output for two duties inside the open interval, catching missing admission or rejection of valid nearby values.
 * @evidence contracts/testing.md#independent-expectations The gait-limb contract requires a finite positive period, finite phase/amplitude/neutral and duty strictly between zero and one. Literal malformed values and interior duties supply expectations without evaluating the production formula; the refusal helper accepts any thrown value and does not establish a message or error class.
 * @evidence contracts/testing.md#distinguishing-cases Preserves NaN/zero period, NaN phase/duty/amplitude/neutral, duty zero/one and valid 0.01/0.99 duties. Time admission, easing controls and clip-level sample/phase/root-bob behavior remain outside this unit.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns the scalar table and both valid duty evaluations directly through the engine export. The local helper records thrown status only; no host, process or native artifact is needed.
 */
export function test_motion_gait_limb_scalars(): void {
  const invalids: [string, IAutoMovieGaitLimb, number][] = [
    ["nan period", limb, Number.NaN],
    ["zero period", limb, 0],
    ["nan phase", { ...limb, phase: Number.NaN }, 1],
    ["nan duty", { ...limb, duty: Number.NaN }, 1],
    ["zero duty", { ...limb, duty: 0 }, 1],
    ["one duty", { ...limb, duty: 1 }, 1],
    ["nan amplitude", { ...limb, amplitude: Number.NaN }, 1],
    ["nan neutral", { ...limb, neutral: Number.NaN }, 1],
  ];

  for (const [label, candidate, period] of invalids)
    TestValidator.predicate(
      `${label} throws`,
      throws((): void => {
        gaitLimbFlexion(candidate, 0.25, period);
      }),
    );

  for (const duty of [0.01, 0.99])
    TestValidator.predicate(
      `duty ${duty} remains finite`,
      Number.isFinite(gaitLimbFlexion({ ...limb, duty }, 0.25, 1)),
    );
}
