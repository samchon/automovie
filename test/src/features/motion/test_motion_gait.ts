import { gaitMotion, validateMotion } from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieGait,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkeleton } from "../internal/fixtures";
import {
  hasViolation,
  namedFacts,
  nclose,
  throwsError,
} from "../internal/predicates";

const GAIT: IAutoMovieGait = {
  name: "walk",
  period: 1,
  limbs: [
    { bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 30 },
    { bone: "rightUpperLeg", phase: 0.5, duty: 0.5, amplitude: 30 },
  ],
};

const flexionSeq: (
  motion: IAutoMovieMotion,
  bone: AutoMovieHumanoidBone,
) => number[] = (
  motion: ReturnType<typeof gaitMotion>,
  bone: AutoMovieHumanoidBone,
): number[] =>
  motion.keyframes.map(
    (k: IAutoMovieKeyframe): number =>
      k.pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === bone)!
        .flexion!,
  );

/**
 * `gaitMotion`: synthesise a declarative {@link IAutoMovieGait} into a looping
 * clip. The difference between a creature's gaits lives entirely in the
 * per-limb phase / duty / amplitude data, not the code.
 *
 * Scenarios (period 1, duty 0.5, amplitude 30, sampled at 4 even steps):
 *
 * 1. The clip is a one-period seamless loop: 5 keyframes (the closing one
 *    repeating t=0), duration = period, loop = true.
 * 2. A phase-0 limb sweeps the stance→swing sawtooth +30 → 0 → −30 → 0 → +30
 *    (planted push, then recovery), the closing frame matching the first.
 * 3. A phase-0.5 limb runs exactly half a cycle out of step: the per-limb phase
 *    offset that makes one gait a walk and another a trot.
 * 4. `neutral` centers the swing: a knee swung symmetrically about zero crosses
 *    into hyperextension and the ROM validator rejects it, while the same swing
 *    centered on `neutral: 25` stays inside `[0, 150]°` and passes.
 * 5. A limb can target `abduction` instead of the default `flexion`.
 * 6. Multiple rows for one bone fold into a single multi-axis joint pose.
 * 7. Stance and swing can use different named easing curves while keeping the same
 *    endpoints.
 * 8. `cubicBezier` stance/swing phases use their own control points instead of
 *    falling back to linear.
 * 9. `rootBob` adds a vertical identity-TRS root curve while plain gaits keep
 *    `root: null`.
 * 10. Duplicate same-bone/same-axis rows are rejected instead of silently
 *     overwriting earlier profile data.
 *
 * @evidence contracts/testing.md#behavioral-verification Bakes actual gait clips and checks sample population, loop identity, phased clinical angles, neutral ROM behavior, axis aggregation, phase easing and root bob, then requires the duplicate-axis refusal. Lost phase, overwritten axes or ignoring authored controls fails these observations.
 * @evidence contracts/testing.md#independent-expectations A period-one half-duty triangular wave with amplitude 30 gives [30,0,-30,0,30]; a half-cycle shift negates it and neutral 25 with amplitude 22 stays between three and 47. Quadratic easing and the authored CSS Bezier curves supply the retained phase samples, while sinusoidal root bob gives [1,1.08,1,.92,1]. ROM admission also uses the real validator and may share its defects; it does not establish physiological gait quality.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all ten numbered cases: loop closure, both limb phases, rejected/centered knee, abduction, multi-axis folding, named and Bezier phase controls, optional/null roots and duplicate-axis refusal. Sample-count, period, phase and malformed gait-scalar admission are owned by the companion sampler tests.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns each local bake and assertion and uses the existing portable skeleton fixture. It installs no consumer, compiles no native artifact, starts no process/browser/GPU and registers no extra Human cases.
 */
export function test_motion_gait(): void {
  const motion: IAutoMovieMotion = gaitMotion("g", "sk", GAIT, 4);

  // 1. loop shape
  TestValidator.equals(
    "five keyframes (closing repeat)",
    motion.keyframes.length,
    5,
  );
  TestValidator.predicate("duration is the period", nclose(motion.duration, 1));
  TestValidator.equals("clip loops", motion.loop, true);
  TestValidator.equals("skeleton stamped", motion.skeleton, "sk");
  TestValidator.predicate(
    "plain gait keeps root unset",
    motion.keyframes.every(
      (k: IAutoMovieKeyframe): boolean => k.pose.root === null,
    ),
  );

  // 2. phase-0 limb: the stance→swing sawtooth, ends where it began
  const left: number[] = flexionSeq(motion, "leftUpperLeg");
  TestValidator.predicate(
    "phase-0 sweeps +30 → 0 → −30 → 0 → +30",
    [30, 0, -30, 0, 30].every((v: number, i: number): boolean =>
      nclose(left[i]!, v),
    ),
  );

  // 3. phase-0.5 limb is the half-cycle inverse at every frame
  const right: number[] = flexionSeq(motion, "rightUpperLeg");
  TestValidator.predicate(
    "phase-0.5 limb is half a cycle out of step",
    right.every((v: number, i: number): boolean => nclose(v, -left[i]!)),
  );

  // 4. neutral centers the swing: the knee's negative twin
  const sk: IAutoMovieSkeleton = createSkeleton();
  const kneeGait: (neutral: number | undefined) => IAutoMovieGait = (
    neutral: number | undefined,
  ): IAutoMovieGait => ({
    name: "step",
    period: 1,
    limbs: [
      { bone: "leftLowerLeg", phase: 0, duty: 0.5, amplitude: 22, neutral },
    ],
  });
  const hyperextended: IAutoMovieValidation = validateMotion({
    motion: gaitMotion("bare", sk.id, kneeGait(undefined), 4),
    skeleton: sk,
  });
  TestValidator.predicate(
    "a knee swung about zero hyperextends (ROM rejects it)",
    hasViolation(hyperextended, "rom", "leftLowerLeg") ||
      hasViolation(hyperextended, "rom", "flexion"),
  );
  const centered: IAutoMovieValidation = validateMotion({
    motion: gaitMotion("bent", sk.id, kneeGait(25), 4),
    skeleton: sk,
  });
  TestValidator.equals(
    "the same swing centered on neutral 25 stays in ROM",
    centered.success,
    true,
  );
  const knee: number[] = flexionSeq(
    gaitMotion("bent", sk.id, kneeGait(25), 4),
    "leftLowerLeg",
  );
  TestValidator.equals(
    "the centered swing is 25 ± 22 (every sample positive)",
    namedFacts([
      ["kneeEveryV", (): boolean => knee.every((v: number): boolean => v >= 0)],
      ["ncloseMaxKnee", (): boolean => nclose(Math.max(...knee), 47)],
    ]),
    { kneeEveryV: true, ncloseMaxKnee: true },
  );

  // 5. non-flexion axis target
  const sideGait: IAutoMovieMotion = gaitMotion(
    "side",
    sk.id,
    {
      name: "side",
      period: 1,
      limbs: [
        {
          bone: "leftUpperArm",
          axis: "abduction",
          phase: 0,
          duty: 0.5,
          amplitude: 12,
        },
      ],
    },
    4,
  );
  const sideSeq: number[] = sideGait.keyframes.map(
    (k: IAutoMovieKeyframe): number => k.pose.joints[0]!.abduction!,
  );
  TestValidator.predicate(
    "abduction limb writes the sawtooth to abduction",
    [12, 0, -12, 0, 12].every((v: number, i: number): boolean =>
      nclose(sideSeq[i]!, v),
    ),
  );
  TestValidator.predicate(
    "abduction limb leaves the other axes unset",
    sideGait.keyframes.every((k: IAutoMovieKeyframe): boolean => {
      const joint: IAutoMovieJointPose = k.pose.joints[0]!;
      return joint.flexion === null && joint.twist === null;
    }),
  );
  TestValidator.equals(
    "abduction gait validates against the skeleton",
    validateMotion({ motion: sideGait, skeleton: sk }).success,
    true,
  );

  // 6. same-bone limb rows fold into one multi-axis joint
  const multiAxis: IAutoMovieMotion = gaitMotion(
    "multi",
    sk.id,
    {
      name: "multi",
      period: 1,
      limbs: [
        { bone: "leftUpperArm", phase: 0, duty: 0.5, amplitude: 10 },
        {
          bone: "leftUpperArm",
          axis: "abduction",
          phase: 0,
          duty: 0.5,
          amplitude: 12,
        },
      ],
    },
    4,
  );
  TestValidator.predicate(
    "same-bone gait rows emit one joint per keyframe",
    multiAxis.keyframes.every(
      (k: IAutoMovieKeyframe): boolean => k.pose.joints.length === 1,
    ),
  );
  TestValidator.predicate(
    "multi-axis joint carries both flexion and abduction",
    multiAxis.keyframes.every((k: IAutoMovieKeyframe, i: number): boolean => {
      const joint: IAutoMovieJointPose = k.pose.joints[0]!;
      const flexion: number = [10, 0, -10, 0, 10][i]!;
      const abduction: number = [12, 0, -12, 0, 12][i]!;
      return (
        nclose(joint.flexion!, flexion) && nclose(joint.abduction!, abduction)
      );
    }),
  );
  TestValidator.equals(
    "multi-axis gait validates against the skeleton",
    validateMotion({ motion: multiAxis, skeleton: sk }).success,
    true,
  );

  // 7. per-phase named easing curves
  const eased: number[] = flexionSeq(
    gaitMotion(
      "eased",
      sk.id,
      {
        name: "eased",
        period: 1,
        limbs: [
          {
            bone: "leftUpperLeg",
            phase: 0,
            duty: 0.5,
            amplitude: 30,
            stanceEasing: "easeIn",
            swingEasing: "easeOut",
          },
        ],
      },
      8,
    ),
    "leftUpperLeg",
  );
  TestValidator.predicate(
    "easeIn stance and easeOut swing shape the sawtooth",
    [30, 26.25, 15, -3.75, -30, -3.75, 15, 26.25, 30].every(
      (v: number, i: number): boolean => nclose(eased[i]!, v),
    ),
  );

  // 8. cubic-bezier phase controls
  const bezier: number[] = flexionSeq(
    gaitMotion(
      "bezier",
      sk.id,
      {
        name: "bezier",
        period: 1,
        limbs: [
          {
            bone: "leftUpperLeg",
            phase: 0,
            duty: 0.5,
            amplitude: 30,
            stanceEasing: "cubicBezier",
            stanceBezier: [0.42, 0, 1, 1],
            swingEasing: "cubicBezier",
            swingBezier: [0, 0, 0.58, 1],
          },
        ],
      },
      8,
    ),
    "leftUpperLeg",
  );
  TestValidator.predicate(
    "cubicBezier stance and swing use phase control points",
    [30, 24.392, 11.079, -7.312, -30, -7.312, 11.079, 24.392, 30].every(
      (v: number, i: number): boolean => nclose(bezier[i]!, v, 1e-3),
    ),
  );

  // 9. optional vertical root bob
  const bobbing: IAutoMovieMotion = gaitMotion(
    "bob",
    sk.id,
    {
      name: "bob",
      period: 1,
      rootBob: { amplitude: 0.08, phase: 0, center: 1 },
      limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 20 }],
    },
    4,
  );
  const rootY: number[] = bobbing.keyframes.map(
    (k: IAutoMovieKeyframe): number => k.pose.root!.translation.y,
  );
  TestValidator.predicate(
    "root bob follows the gait sine",
    [1, 1.08, 1, 0.92, 1].every((v: number, i: number): boolean =>
      nclose(rootY[i]!, v),
    ),
  );
  TestValidator.predicate(
    "root bob is identity TRS except vertical translation",
    bobbing.keyframes.every((k: IAutoMovieKeyframe): boolean => {
      const root: IAutoMovieTransform = k.pose.root!;
      return (
        nclose(root.translation.x, 0) &&
        nclose(root.translation.z, 0) &&
        nclose(root.rotation.x, 0) &&
        nclose(root.rotation.y, 0) &&
        nclose(root.rotation.z, 0) &&
        nclose(root.rotation.w, 1) &&
        nclose(root.scale.x, 1) &&
        nclose(root.scale.y, 1) &&
        nclose(root.scale.z, 1)
      );
    }),
  );
  TestValidator.equals(
    "root bob still validates against the skeleton",
    validateMotion({ motion: bobbing, skeleton: sk }).success,
    true,
  );

  // 10. duplicate same-bone/same-axis rows are an authoring error
  TestValidator.predicate(
    "duplicate gait rows for one bone axis throw",
    throwsError(
      (): IAutoMovieMotion =>
        gaitMotion(
          "duplicate",
          sk.id,
          {
            name: "duplicate",
            period: 1,
            limbs: [
              { bone: "leftUpperArm", phase: 0, duty: 0.5, amplitude: 10 },
              {
                bone: "leftUpperArm",
                axis: "flexion",
                phase: 0.25,
                duty: 0.5,
                amplitude: 12,
              },
            ],
          },
          4,
        ),
      "duplicate gait row for leftUpperArm.flexion",
    ),
  );
}
