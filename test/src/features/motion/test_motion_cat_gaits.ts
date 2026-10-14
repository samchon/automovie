import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieGait,
  IAutoMovieGaitLimb,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { CAT_GAITS } from "../../../../packages/archetypes/src/CAT_GAITS";
import { CAT_PROFILE } from "../../../../packages/archetypes/src/CAT_PROFILE";
import { bindProfileGaits } from "@automovie/engine";
import { gaitMotion } from "@automovie/engine";
import { validateMotion } from "@automovie/engine";
import { namedFacts, nclose } from "../internal/predicates";

function range(min: number, max: number): { min: number; max: number } {
  return { min, max };
}
function con(
  flexion: { min: number; max: number } | null,
  abduction: { min: number; max: number } | null,
  twist: { min: number; max: number } | null,
): IAutoMovieJointConstraint {
  return { flexion, abduction, twist };
}

const legCon: IAutoMovieJointConstraint = con(
  range(-70, 80),
  range(-20, 35),
  range(-20, 20),
);
const kneeCon: IAutoMovieJointConstraint = con(range(0, 150), null, null);
const tailCon: IAutoMovieJointConstraint = con(
  range(-80, 80),
  range(-50, 50),
  null,
);

const CAT_ROM: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieJointConstraint>
> = {
  spine: con(range(-40, 55), range(-25, 25), range(-30, 30)),
  chest: con(range(-30, 45), range(-20, 20), range(-25, 25)),
  neck: con(range(-60, 70), range(-45, 45), range(-60, 60)),
  head: con(range(-50, 60), range(-45, 45), range(-70, 70)),
  leftUpperArm: legCon,
  rightUpperArm: legCon,
  leftLowerArm: kneeCon,
  rightLowerArm: kneeCon,
  leftUpperLeg: legCon,
  rightUpperLeg: legCon,
  leftLowerLeg: kneeCon,
  rightLowerLeg: kneeCon,
  leftLittleProximal: tailCon,
  leftLittleIntermediate: tailCon,
  leftLittleDistal: tailCon,
};

function bone(b: AutoMovieHumanoidBone): IAutoMovieBone {
  return {
    bone: b,
    parent: null,
    rest: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: CAT_ROM[b] ?? null,
  };
}

const BONES: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "spine",
  "chest",
  "neck",
  "head",
  "leftUpperArm",
  "rightUpperArm",
  "leftLowerArm",
  "rightLowerArm",
  "leftUpperLeg",
  "rightUpperLeg",
  "leftLowerLeg",
  "rightLowerLeg",
  "leftLittleProximal",
  "leftLittleIntermediate",
  "leftLittleDistal",
];

const RIG: IAutoMovieSkeleton = {
  id: "cat",
  bones: BONES.map((b: AutoMovieHumanoidBone): IAutoMovieBone => bone(b)),
};

const NAMES: readonly ["walk", "leap", "stalk"] = ["walk", "leap", "stalk"];

function limbOf(
  gait: IAutoMovieGait,
  b: AutoMovieHumanoidBone,
): IAutoMovieGaitLimb {
  return gait.limbs.find(
    (l: IAutoMovieGaitLimb): boolean => l.bone === b && l.axis === undefined,
  )!;
}

/**
 * Canonical cat gait data produces its declared sample clock, sinusoidal root height and clinical bone channels inside the cat ROM fixture.
 *
 * Scenarios:
 *
 * 1. The fixture exposes walk/leap/stalk under their stable names and keeps the
 *    walk/leap periods inherited from the playground clips.
 * 2. Every gait synthesises into a concrete clip and validates against cat ROM,
 *    including tail rows on the repurposed finger chain.
 * 3. Walk keeps diagonal-pair phases; sampled leap root height spans a larger range and stalk sits lower with a longer period.
 * 4. The cat profile carries the same names and binds each gait to profile-scoped
 *    clip ids.
 *
 * @evidence contracts/testing.md#behavioral-verification Bakes all three canonical gaits through gaitMotion, checks sampled root and bone output and ROM admission, then binds the profile and checks scoped clip identity; ignored style metadata is no longer treated as motion behavior.
 * @evidence contracts/testing.md#independent-expectations Periods and root heights come from the authored catalog and sinusoidal root contract; at phase zero a right upper front limb is its positive amplitude, while sampled max-minus-min root height distinguishes actual leap output. ROM uses an independently declared cat constraint fixture, not a generated snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Walk, leap and stalk cover differing periods, root envelopes, diagonal versus paired limbs and profile binding; generated samples include the closing cycle point and repurposed tail axes. Generic malformed gait and sample-count refusals belong to the gait sampler tests.
 * @evidence contracts/testing.md#execution-ownership Portable unit entry test_motion_cat_gaits imports catalog and engine source directly and owns every case synchronously; it starts no browser, native artifact, process or installed consumer.
 */
export function test_motion_cat_gaits(): void {
  TestValidator.equals(
    "all cat movement names present",
    Object.keys(CAT_GAITS).sort((a: string, b: string): number =>
      a.localeCompare(b),
    ),
    [...NAMES].sort((a: string, b: string): number => a.localeCompare(b)),
  );
  for (const name of NAMES)
    TestValidator.equals(`${name} stamps its name`, CAT_GAITS[name].name, name);

  TestValidator.predicate(
    "walk keeps playground period",
    nclose(CAT_GAITS.walk.period, 0.8),
  );
  TestValidator.predicate(
    "leap keeps playground period",
    nclose(CAT_GAITS.leap.period, 1),
  );
  TestValidator.predicate(
    "stalk uses a slower prowl period",
    nclose(CAT_GAITS.stalk.period, 1.2),
  );

  const clips: Record<(typeof NAMES)[number], IAutoMovieMotion> = {
    walk: gaitMotion("walk", RIG.id, CAT_GAITS.walk, 24),
    leap: gaitMotion("leap", RIG.id, CAT_GAITS.leap, 24),
    stalk: gaitMotion("stalk", RIG.id, CAT_GAITS.stalk, 24),
  };
  for (const name of NAMES) {
    const clip: IAutoMovieMotion = clips[name];
    TestValidator.equals(
      `${name} stays inside cat ROM`,
      validateMotion({ motion: clip, skeleton: RIG }).success,
      true,
    );
    TestValidator.predicate(
      `${name} preserves the declared cycle duration`,
      nclose(clip.duration, CAT_GAITS[name].period),
    );
    TestValidator.predicate(
      `${name} samples the declared root sinusoid`,
      clip.keyframes.every((frame: IAutoMovieKeyframe): boolean => {
        const bob: NonNullable<IAutoMovieGait["rootBob"]> =
          CAT_GAITS[name].rootBob!;
        const expected: number =
          bob.center +
          bob.amplitude *
            Math.sin(
              2 * Math.PI * (frame.time / CAT_GAITS[name].period + bob.phase),
            );
        return (
          frame.pose.root !== null &&
          nclose(frame.pose.root.translation.y, expected, 1e-12)
        );
      }),
    );
  }

  const walkFront: IAutoMovieJointPose =
    clips.walk.keyframes[0]!.pose.joints.find(
      (joint: IAutoMovieJointPose): boolean => joint.bone === "rightUpperArm",
    )!;
  TestValidator.predicate(
    "walk right front starts at its authored positive amplitude",
    nclose(walkFront.flexion!, 24),
  );
  TestValidator.predicate(
    "every generated clip carries the tail abduction channel",
    Object.values(clips).every((clip: IAutoMovieMotion): boolean =>
      clip.keyframes.every((frame: IAutoMovieKeyframe): boolean =>
        frame.pose.joints.some(
          (joint: IAutoMovieJointPose): boolean =>
            joint.bone === "leftLittleProximal" && joint.abduction !== null,
        ),
      ),
    ),
  );

  TestValidator.predicate(
    "walk phases front-left with hind-right",
    nclose(
      limbOf(CAT_GAITS.walk, "leftUpperArm").phase,
      limbOf(CAT_GAITS.walk, "rightUpperLeg").phase,
      0,
    ),
  );
  TestValidator.predicate(
    "walk phases front-right with hind-left",
    nclose(
      limbOf(CAT_GAITS.walk, "rightUpperArm").phase,
      limbOf(CAT_GAITS.walk, "leftUpperLeg").phase,
      0,
    ),
  );
  const walkHeights: number[] = clips.walk.keyframes.map(
    (frame: IAutoMovieKeyframe): number => frame.pose.root!.translation.y,
  );
  const leapHeights: number[] = clips.leap.keyframes.map(
    (frame: IAutoMovieKeyframe): number => frame.pose.root!.translation.y,
  );
  TestValidator.predicate(
    "sampled leap has a larger vertical envelope than sampled walk",
    Math.max(...leapHeights) - Math.min(...leapHeights) >
      Math.max(...walkHeights) - Math.min(...walkHeights),
  );
  TestValidator.predicate(
    "sampled stalk starts below sampled walk",
    clips.stalk.keyframes[0]!.pose.root!.translation.y <
      clips.walk.keyframes[0]!.pose.root!.translation.y,
  );
  TestValidator.equals(
    "stalk is slower and lower than walk",
    namedFacts([
      [
        "cAT_GAITSStalkPeriod",
        (): boolean => CAT_GAITS.stalk.period > CAT_GAITS.walk.period,
      ],
      [
        "cAT_GAITSStalkRootBob",
        (): boolean =>
          CAT_GAITS.stalk.period > CAT_GAITS.walk.period &&
          CAT_GAITS.stalk.rootBob!.center < CAT_GAITS.walk.rootBob!.center,
      ],
    ]),
    { cAT_GAITSStalkPeriod: true, cAT_GAITSStalkRootBob: true },
  );

  const bound: Record<string, IAutoMovieMotion> = bindProfileGaits(
    CAT_PROFILE,
    RIG.id,
    24,
  );
  TestValidator.equals(
    "cat profile carries all gait names",
    CAT_PROFILE.gaits!.map((g: IAutoMovieGait): string => g.name).sort(
      (a: string, b: string): number => a.localeCompare(b),
    ),
    [...NAMES].sort((a: string, b: string): number => a.localeCompare(b)),
  );
  TestValidator.equals(
    "cat profile binds every gait",
    Object.keys(bound).sort((a: string, b: string): number =>
      a.localeCompare(b),
    ),
    [...NAMES].sort((a: string, b: string): number => a.localeCompare(b)),
  );
  TestValidator.equals(
    "profile-bound stalk has a profile-scoped id",
    bound.stalk!.id,
    "cat:stalk",
  );
  for (const name of NAMES)
    TestValidator.equals(
      `profile-bound ${name} stays inside cat ROM`,
      validateMotion({ motion: bound[name], skeleton: RIG }).success,
      true,
    );
}
