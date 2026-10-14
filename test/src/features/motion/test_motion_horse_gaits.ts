import { HORSE_GAITS, HORSE_PROFILE } from "@automovie/archetypes";
import {
  bindProfileGaits,
  gaitMotion,
  validateMotion,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieGait,
  IAutoMovieGaitLimb,
  IAutoMovieJointConstraint,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

const range: (min: number, max: number) => { min: number; max: number } = (
  min: number,
  max: number,
): { min: number; max: number } => ({ min, max });
const con: (
  flexion: { min: number; max: number } | null,
  abduction: { min: number; max: number } | null,
  twist: { min: number; max: number } | null,
) => IAutoMovieJointConstraint = (
  flexion: { min: number; max: number } | null,
  abduction: { min: number; max: number } | null,
  twist: { min: number; max: number } | null,
): IAutoMovieJointConstraint => ({ flexion, abduction, twist });

const legCon: IAutoMovieJointConstraint = con(
  range(-80, 90),
  range(-15, 25),
  range(-15, 15),
);
const kneeCon: IAutoMovieJointConstraint = con(range(-10, 150), null, null);

const HORSE_ROM: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieJointConstraint>
> = {
  spine: con(range(-45, 50), range(-20, 20), range(-25, 25)),
  chest: con(range(-35, 40), range(-15, 15), range(-20, 20)),
  neck: con(range(-70, 80), range(-40, 40), range(-40, 40)),
  head: con(range(-60, 60), range(-30, 30), range(-50, 50)),
  leftUpperArm: legCon,
  rightUpperArm: legCon,
  leftLowerArm: kneeCon,
  rightLowerArm: kneeCon,
  leftUpperLeg: legCon,
  rightUpperLeg: legCon,
  leftLowerLeg: kneeCon,
  rightLowerLeg: kneeCon,
};

const bone: (b: AutoMovieHumanoidBone) => IAutoMovieBone = (
  b: AutoMovieHumanoidBone,
): IAutoMovieBone => ({
  bone: b,
  parent: null,
  rest: {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  },
  constraint: HORSE_ROM[b] ?? null,
});

const RIG: IAutoMovieSkeleton = {
  id: "horse",
  bones: [
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
  ].map((b: string): IAutoMovieBone => bone(b as AutoMovieHumanoidBone)),
};

const NAMES: readonly (keyof typeof HORSE_GAITS)[] = [
  "walk",
  "trot",
  "gallop",
  "rear",
] as const;

const limbOf: (
  gait: (typeof HORSE_GAITS)[keyof typeof HORSE_GAITS],
  b: AutoMovieHumanoidBone,
) => IAutoMovieGaitLimb = (
  gait: (typeof HORSE_GAITS)[keyof typeof HORSE_GAITS],
  b: AutoMovieHumanoidBone,
): IAutoMovieGaitLimb =>
  gait.limbs.find((l: IAutoMovieGaitLimb): boolean => l.bone === b)!;

const minimumFlexion: (
  gait: (typeof HORSE_GAITS)[keyof typeof HORSE_GAITS],
  b: AutoMovieHumanoidBone,
) => number = (
  gait: (typeof HORSE_GAITS)[keyof typeof HORSE_GAITS],
  b: AutoMovieHumanoidBone,
): number => {
  const limb: IAutoMovieGaitLimb = limbOf(gait, b);
  return (limb.neutral ?? 0) - limb.amplitude;
};

/**
 * Exercise the canonical horse gait table through actual cycle synthesis, the test-owned quadruped constraints and profile binding. The arm-named rows act as front legs in this rig; this unit observes numerical clips rather than equine motion or rendered appearance.
 *
 * Scenarios:
 *
 * 1. The fixture exposes walk/trot/gallop/rear with the stable authored periods.
 * 2. Every gait synthesizes and validates against the test-owned quadruped constraints.
 * 3. Walk, trot and gallop increase stride amplitude and shorten period, while rear exceeds the tested front-leg and spine extrema.
 * 4. The profile carries the same names and binds them to profile-scoped clip identities.
 *
 * @evidence contracts/testing.md#behavioral-verification Synthesizes and validates all four shipped horse cycles, checks intended amplitude/period/rear distinctions and observes profile-bound identities and validation; catches missing rows, unusable numerical motion or binding to the wrong profile identity.
 * @evidence contracts/testing.md#independent-expectations Existing literal names, periods, ordering inequalities and rear thresholds are the authored fixture contract, while the unit supplies its own quadruped constraints. Profile-to-table name agreement is a related-input consistency check and cannot alone prove either population correct; the literal name list supplies that independent boundary. These conventions are not biological measurements.
 * @evidence contracts/testing.md#distinguishing-cases Preserves walk/trot/gallop/rear, exact name sets, each expected period, increasing stride and decreasing periods, rear leg/spine differences, concrete synthesis, profile identity and all bound validations. Unsupported gait data, contact and visual execution belong to other units or real consumers.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all direct calls to gaitMotion, bindProfileGaits and validateMotion using a test-owned rig. Private helpers supply constraint and limb views only; no playground, renderer, process or native artifact is started.
 */
export function test_motion_horse_gaits(): void {
  TestValidator.equals(
    "all horse movement names present",
    Object.keys(HORSE_GAITS).sort((a: string, b: string): number =>
      a.localeCompare(b),
    ),
    [...NAMES].sort((a: string, b: string): number => a.localeCompare(b)),
  );
  for (const name of NAMES)
    TestValidator.equals(
      `${name} stamps its name`,
      HORSE_GAITS[name].name,
      name,
    );

  TestValidator.predicate(
    "walk keeps playground period",
    nclose(HORSE_GAITS.walk.period, 1),
  );
  TestValidator.predicate(
    "trot keeps playground period",
    nclose(HORSE_GAITS.trot.period, 0.72),
  );
  TestValidator.predicate(
    "gallop keeps playground period",
    nclose(HORSE_GAITS.gallop.period, 0.6),
  );
  TestValidator.predicate(
    "rear keeps playground period",
    nclose(HORSE_GAITS.rear.period, 2.6),
  );

  for (const name of NAMES) {
    const clip: ReturnType<typeof gaitMotion> = gaitMotion(
      name,
      RIG.id,
      HORSE_GAITS[name],
      24,
    );
    TestValidator.equals(
      `${name} stays inside horse ROM`,
      validateMotion({ motion: clip, skeleton: RIG }).success,
      true,
    );
  }

  TestValidator.equals(
    "stride grows walk < trot < gallop",
    namedFacts([
      [
        "limbOfHORSE_GAITSWalk",
        (): boolean =>
          limbOf(HORSE_GAITS.walk, "leftUpperArm").amplitude <
          limbOf(HORSE_GAITS.trot, "leftUpperArm").amplitude,
      ],
      [
        "limbOfHORSE_GAITSTrot",
        (): boolean =>
          limbOf(HORSE_GAITS.trot, "leftUpperArm").amplitude <
          limbOf(HORSE_GAITS.gallop, "leftUpperArm").amplitude,
      ],
    ]),
    { limbOfHORSE_GAITSWalk: true, limbOfHORSE_GAITSTrot: true },
  );
  TestValidator.equals(
    "faster horse gaits have shorter periods",
    namedFacts([
      [
        "hORSE_GAITSWalkPeriod",
        (): boolean => HORSE_GAITS.walk.period > HORSE_GAITS.trot.period,
      ],
      [
        "hORSE_GAITSTrotPeriod",
        (): boolean =>
          HORSE_GAITS.walk.period > HORSE_GAITS.trot.period &&
          HORSE_GAITS.trot.period > HORSE_GAITS.gallop.period,
      ],
    ]),
    { hORSE_GAITSWalkPeriod: true, hORSE_GAITSTrotPeriod: true },
  );
  TestValidator.equals(
    "rear lifts front and pitches spine beyond locomotion",
    namedFacts([
      [
        "minimumFlexionHORSE_GAITSRear",
        (): boolean => -70 > minimumFlexion(HORSE_GAITS.rear, "leftUpperArm"),
      ],
      [
        "minimumFlexionHORSE_GAITSRear2",
        (): boolean =>
          minimumFlexion(HORSE_GAITS.rear, "spine") <
          minimumFlexion(HORSE_GAITS.gallop, "spine"),
      ],
    ]),
    {
      minimumFlexionHORSE_GAITSRear: true,
      minimumFlexionHORSE_GAITSRear2: true,
    },
  );

  const bound: ReturnType<typeof bindProfileGaits> = bindProfileGaits(
    HORSE_PROFILE,
    RIG.id,
    24,
  );
  TestValidator.equals(
    "horse profile carries all gait names",
    HORSE_PROFILE.gaits!.map((g: IAutoMovieGait): string => g.name).sort(
      (a: string, b: string): number => a.localeCompare(b),
    ),
    [...NAMES].sort((a: string, b: string): number => a.localeCompare(b)),
  );
  TestValidator.equals(
    "horse profile binds every gait",
    Object.keys(bound).sort((a: string, b: string): number =>
      a.localeCompare(b),
    ),
    [...NAMES].sort((a: string, b: string): number => a.localeCompare(b)),
  );
  TestValidator.equals(
    "profile-bound gallop has a profile-scoped id",
    bound.gallop!.id,
    "horse:gallop",
  );
  for (const name of NAMES)
    TestValidator.equals(
      `profile-bound ${name} stays inside horse ROM`,
      validateMotion({ motion: bound[name], skeleton: RIG }).success,
      true,
    );
}
