import { HUMANOID_GAITS, HUMANOID_PROFILE } from "@automovie/archetypes";
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
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

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
  constraint: null,
});

// A rig carrying exactly the bones the gaits drive, all with null constraints
// so validateMotion falls back to the engine's default humanoid ROM table.
const RIG: IAutoMovieSkeleton = {
  id: "humanoid",
  bones: [
    "hips",
    "leftUpperLeg",
    "rightUpperLeg",
    "leftLowerLeg",
    "rightLowerLeg",
    "leftUpperArm",
    "rightUpperArm",
  ].map((b: string): IAutoMovieBone => bone(b as AutoMovieHumanoidBone)),
};

const NAMES: readonly (keyof typeof HUMANOID_GAITS)[] = [
  "walk",
  "run",
  "sprint",
  "sneak",
  "march",
] as const;

const ampOf: (
  gait: (typeof HUMANOID_GAITS)[keyof typeof HUMANOID_GAITS],
  b: AutoMovieHumanoidBone,
) => number = (
  gait: (typeof HUMANOID_GAITS)[keyof typeof HUMANOID_GAITS],
  b: AutoMovieHumanoidBone,
): number =>
  gait.limbs.find((l: IAutoMovieGaitLimb): boolean => l.bone === b)!.amplitude;

/**
 * Exercise all five canonical humanoid gaits through synthesis, shipped default-constraint admission and profile binding. These are authored numerical performance conventions; sampled validation and positive arm amplitudes do not establish biological feasibility or visible rendered movement.
 *
 * Scenarios:
 *
 * 1. All five gaits are present under their enum names, each stamping its own
 *    name.
 * 2. Each gait, synthesised densely (24 samples) and validated against the
 *    default-ROM humanoid rig, passes: knees never hyperextend, fast-gait hips
 *    never cross the −30° floor. This is the whole reason `neutral` is tuned
 *    per gait.
 * 3. The gaits are ordered by energy where it should show: sprint's hip swing
 *    exceeds run's exceeds walk's; sprint bends the knee hardest of the five;
 *    sneak is the slowest (longest period). 3b. Every gait carries positive
 *    contralateral upper-arm amplitudes: each arm is half a cycle from the same-side
 *    leg and therefore leads the opposite leg.
 * 4. The humanoid profile fixture carries the same gait names and binds them into
 *    concrete clips with profile-scoped ids.
 *
 * @evidence contracts/testing.md#behavioral-verification Synthesizes and validates each gait, checks literal name sets and intended hip/knee/period ordering, observes opposite-leg arm phase and positive amplitudes, and verifies profile-scoped binding and bound validation.
 * @evidence contracts/testing.md#independent-expectations The preserved literal five-name vocabulary, ordering inequalities, contralateral phase relation and humanoid:walk identity express the existing authored contract. The shipped default ROM is shared admission policy rather than an independent biological reference, and profile/table agreement alone cannot identify a shared wrong population; the literal names provide that independent boundary.
 * @evidence contracts/testing.md#distinguishing-cases Retains walk/run/sprint/sneak/march, dense sampled admission, hip progression, sprint knee amplitude, sneak period, both arms of every gait and all profile-bound results. Absolute sampled angle laws, contact, custom constraints and visual movement belong to other units or consumers.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns every direct gaitMotion, bindProfileGaits and validateMotion call using its own flat rig with null overrides. Private limb readers register no cases and no Human viewer, renderer, process or native artifact is started.
 */
export function test_motion_humanoid_gaits(): void {
  TestValidator.equals(
    "all five gaits present",
    Object.keys(HUMANOID_GAITS).sort((a: string, b: string): number =>
      a.localeCompare(b),
    ),
    [...NAMES].sort((a: string, b: string): number => a.localeCompare(b)),
  );
  for (const name of NAMES)
    TestValidator.equals(
      `${name} stamps its name`,
      HUMANOID_GAITS[name].name,
      name,
    );

  for (const name of NAMES) {
    const clip: ReturnType<typeof gaitMotion> = gaitMotion(
      name,
      RIG.id,
      HUMANOID_GAITS[name],
      24,
    );
    TestValidator.equals(
      `${name} stays inside ROM`,
      validateMotion({ motion: clip, skeleton: RIG }).success,
      true,
    );
  }

  const hip: AutoMovieHumanoidBone = "leftUpperLeg";
  const knee: AutoMovieHumanoidBone = "leftLowerLeg";
  TestValidator.equals(
    "hip swing grows walk < run < sprint",
    namedFacts([
      [
        "ampOfHUMANOID_GAITSWalk",
        (): boolean =>
          ampOf(HUMANOID_GAITS.walk, hip) < ampOf(HUMANOID_GAITS.run, hip),
      ],
      [
        "ampOfHUMANOID_GAITSRun",
        (): boolean =>
          ampOf(HUMANOID_GAITS.run, hip) < ampOf(HUMANOID_GAITS.sprint, hip),
      ],
    ]),
    { ampOfHUMANOID_GAITSWalk: true, ampOfHUMANOID_GAITSRun: true },
  );
  TestValidator.predicate(
    "sprint bends the knee hardest of the five",
    NAMES.filter(
      (n: keyof typeof HUMANOID_GAITS): boolean => n !== "sprint",
    ).every(
      (n: keyof typeof HUMANOID_GAITS): boolean =>
        ampOf(HUMANOID_GAITS[n], knee) < ampOf(HUMANOID_GAITS.sprint, knee),
    ),
  );
  TestValidator.predicate(
    "sneak is the slowest of the five",
    NAMES.filter(
      (n: keyof typeof HUMANOID_GAITS): boolean => n !== "sneak",
    ).every(
      (n: keyof typeof HUMANOID_GAITS): boolean =>
        HUMANOID_GAITS.sneak.period > HUMANOID_GAITS[n].period,
    ),
  );

  // 3b. the restored counter-swing is present on every shipped gait.
  for (const name of NAMES) {
    const gait: IAutoMovieGait = HUMANOID_GAITS[name];
    const leftArm: IAutoMovieGaitLimb = gait.limbs.find(
      (limb: IAutoMovieGaitLimb): boolean => limb.bone === "leftUpperArm",
    )!;
    const rightArm: IAutoMovieGaitLimb = gait.limbs.find(
      (limb: IAutoMovieGaitLimb): boolean => limb.bone === "rightUpperArm",
    )!;
    const leftLeg: IAutoMovieGaitLimb = gait.limbs.find(
      (limb: IAutoMovieGaitLimb): boolean => limb.bone === "leftUpperLeg",
    )!;
    const rightLeg: IAutoMovieGaitLimb = gait.limbs.find(
      (limb: IAutoMovieGaitLimb): boolean => limb.bone === "rightUpperLeg",
    )!;
    TestValidator.equals(
      `${name} carries positive contralateral arm amplitudes`,
      namedFacts([
        ["leftArmAmplitude", (): boolean => leftArm.amplitude > 0],
        ["rightArmAmplitude", (): boolean => rightArm.amplitude > 0],
        [
          "ncloseLeftArmPhase",
          (): boolean => nclose(leftArm.phase, rightLeg.phase),
        ],
        [
          "ncloseRightArmPhase",
          (): boolean => nclose(rightArm.phase, leftLeg.phase),
        ],
      ]),
      {
        leftArmAmplitude: true,
        rightArmAmplitude: true,
        ncloseLeftArmPhase: true,
        ncloseRightArmPhase: true,
      },
    );
  }

  const bound: ReturnType<typeof bindProfileGaits> = bindProfileGaits(
    HUMANOID_PROFILE,
    RIG.id,
    24,
  );
  TestValidator.equals(
    "humanoid profile carries all gait names",
    HUMANOID_PROFILE.gaits!.map((g: IAutoMovieGait): string => g.name).sort(
      (a: string, b: string): number => a.localeCompare(b),
    ),
    [...NAMES].sort((a: string, b: string): number => a.localeCompare(b)),
  );
  TestValidator.equals(
    "humanoid profile binds every gait",
    Object.keys(bound).sort((a: string, b: string): number =>
      a.localeCompare(b),
    ),
    [...NAMES].sort((a: string, b: string): number => a.localeCompare(b)),
  );
  TestValidator.equals(
    "profile-bound walk has a profile-scoped id",
    bound.walk!.id,
    "humanoid:walk",
  );
  for (const name of NAMES)
    TestValidator.equals(
      `profile-bound ${name} stays inside ROM`,
      validateMotion({ motion: bound[name], skeleton: RIG }).success,
      true,
    );
}
