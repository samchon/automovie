import { gaitMotion } from "@automovie/engine";
import { IAutoMovieGait, IAutoMovieGaitRootBob, IAutoMovieKeyframe } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

const gait: (rootBob: IAutoMovieGaitRootBob) => IAutoMovieGait = (rootBob: IAutoMovieGaitRootBob): IAutoMovieGait => ({
  name: "bob",
  period: 1,
  rootBob,
  limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 30 }],
});

/**
 * `gaitMotion` root bob writes a root translation from `center + amplitude *
 * sin(...)`. Invalid root-bob scalars must fail before generated clips can
 * carry non-finite root transforms.
 *
 * Scenarios:
 *
 * 1. Non-finite root-bob amplitude, phase, and center values throw.
 * 2. Zero amplitude remains valid and emits a constant vertical root offset.
 * 3. Mutating one returned root's scale/rotation does not rewrite another frame or a later bake.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs gait synthesis with invalid bob scalars and constant height, then mutates an output root and checks independent subsequent frame/bake values; catches exposure of module identity records.
 * @evidence contracts/testing.md#independent-expectations Zero amplitude makes center1.2 the constant height by the authored sinusoid contract, and identity rotation/scale remain w=1,x=1 on outputs the caller did not modify.
 * @evidence contracts/testing.md#distinguishing-cases NaN amplitude/phase, infinite center, valid zero amplitude and same-frame versus later-frame/later-bake mutation separate domain admission from ownership; moving sinusoid shape and cycle phase belong to gait suites.
 * @evidence contracts/testing.md#execution-ownership Portable unit test discovered as test_motion_gait_root_bob_scalars; this function owns all directly invoked cases without a renderer, native build or consumer host.
 */
export function test_motion_gait_root_bob_scalars(): void {
  const base: IAutoMovieGaitRootBob = {
    amplitude: 0.1,
    phase: 0,
    center: 1,
  };
  const invalids: [string, IAutoMovieGaitRootBob][] = [
    ["nan amplitude", { ...base, amplitude: Number.NaN }],
    ["nan phase", { ...base, phase: Number.NaN }],
    ["infinite center", { ...base, center: Infinity }],
  ];

  for (const [label, rootBob] of invalids)
    TestValidator.predicate(
      `${label} throws`,
      throwsError((): void => {
        gaitMotion("invalid", "sk", gait(rootBob), 2);
      }),
    );

  const constant: ReturnType<typeof gaitMotion> = gaitMotion(
    "constant",
    "sk",
    gait({ amplitude: 0, phase: 0.75, center: 1.2 }),
    2,
  );
  TestValidator.predicate(
    "zero amplitude keeps root bob finite and constant",
    constant.keyframes.every((k: IAutoMovieKeyframe): boolean => nclose(k.pose.root!.translation.y, 1.2)),
  );
  constant.keyframes[0]!.pose.root!.scale.x = 7;
  constant.keyframes[0]!.pose.root!.rotation.w = 0;
  const next: ReturnType<typeof gaitMotion> = gaitMotion("next", "sk", gait(base), 2);
  TestValidator.predicate("root records belong to their output frame and bake", (): boolean =>
    nclose(constant.keyframes[1]!.pose.root!.scale.x, 1) &&
    nclose(constant.keyframes[1]!.pose.root!.rotation.w, 1) &&
    next.keyframes.every((frame: IAutoMovieKeyframe): boolean => nclose(frame.pose.root!.scale.x, 1) && nclose(frame.pose.root!.rotation.w, 1)));
}
