import { CAT_PROFILE, HORSE_PROFILE } from "@automovie/archetypes";
import { bindProfileGaits } from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

/** Sampled angular degrees or root metres, according to the caller's channel; the reader owns the nonempty sample premise.
 * @author Samchon
 */
interface NumericRange {
  /** Smallest sampled channel value. */
  min: number;

  /** Largest sampled channel value. */
  max: number;
}

const rangeOf: (values: number[]) => NumericRange = (
  values: number[],
): NumericRange => ({
  min: Math.min(...values),
  max: Math.max(...values),
});

const flexionRange: (
  motion: IAutoMovieMotion,
  bone: AutoMovieHumanoidBone,
) => NumericRange = (
  motion: IAutoMovieMotion,
  bone: AutoMovieHumanoidBone,
): NumericRange =>
  rangeOf(
    motion.keyframes.map(
      (kf: IAutoMovieKeyframe): number =>
        kf.pose.joints.find(
          (j: IAutoMovieJointPose): boolean => j.bone === bone,
        )?.flexion ?? 0,
    ),
  );

const rootYRange: (motion: IAutoMovieMotion) => NumericRange = (
  motion: IAutoMovieMotion,
): NumericRange =>
  rangeOf(
    motion.keyframes.map(
      (kf: IAutoMovieKeyframe): number => kf.pose.root?.translation.y ?? 0,
    ),
  );

const coversRange: (
  actual: NumericRange,
  expected: NumericRange,
  tolerance: number,
) => boolean = (
  actual: NumericRange,
  expected: NumericRange,
  tolerance: number,
): boolean =>
  actual.min <= expected.min + tolerance &&
  actual.max >= expected.max - tolerance;

const closesRange: (
  actual: NumericRange,
  expected: NumericRange,
  tolerance: number,
) => boolean = (
  actual: NumericRange,
  expected: NumericRange,
  tolerance: number,
): boolean =>
  nclose(actual.min, expected.min, tolerance) &&
  nclose(actual.max, expected.max, tolerance);

const horseHandAuthored: Record<
  "walk" | "trot" | "gallop" | "rear",
  { duration: number; leftUpperArm: NumericRange; leftLowerArm: NumericRange }
> & {
  trot: { rootY: NumericRange };
  gallop: { rootY: NumericRange };
  rear: { spine: NumericRange };
} = {
  walk: {
    duration: 1,
    leftUpperArm: { min: -16, max: 16 },
    leftLowerArm: { min: 8.8, max: 22 },
  },
  trot: {
    duration: 0.72,
    leftUpperArm: { min: -28, max: 28 },
    leftLowerArm: { min: 16, max: 40 },
    rootY: { min: 0.05, max: 0.09 },
  },
  gallop: {
    duration: 0.6,
    leftUpperArm: { min: -46, max: 46 },
    leftLowerArm: { min: 30, max: 74 },
    rootY: { min: 0.03, max: 0.16 },
  },
  rear: {
    duration: 2.6,
    leftUpperArm: { min: -78, max: -34 },
    leftLowerArm: { min: 66, max: 110 },
    spine: { min: -45, max: 8 },
  },
} as const;

const catHandAuthored: Record<
  "walk" | "leap",
  {
    duration: number;
    leftUpperArm: NumericRange;
    leftLowerArm: NumericRange;
    leftUpperLeg: NumericRange;
  }
> & {
  walk: { rightLowerLeg: NumericRange };
  leap: { leftLowerLeg: NumericRange; rootY: NumericRange };
} = {
  walk: {
    duration: 0.8,
    leftUpperArm: { min: -24, max: 24 },
    leftLowerArm: { min: 14, max: 36 },
    leftUpperLeg: { min: -24, max: 24 },
    rightLowerLeg: { min: 18, max: 44 },
  },
  leap: {
    duration: 1,
    leftUpperArm: { min: -34, max: 0 },
    leftLowerArm: { min: 42, max: 52 },
    leftUpperLeg: { min: -38, max: 34 },
    leftLowerLeg: { min: 58, max: 92 },
    rootY: { min: -0.13, max: 0.24 },
  },
} as const;

/**
 * Observe profile-generated creature clips against the preserved local hand-authored duration and channel-range fixtures. Current playground walk producers already bind the same profiles, so these literal fixture tables are the independent historical contract here; no current handwritten source comparison, visual envelope or biological motion is certified.
 *
 * Scenarios:
 *
 * 1. Horse profile clips preserve the local walk/trot/gallop/rear duration and limb/root envelopes; the old horse-motion.ts aggregate is no longer a current source.
 * 2. Cat profile clips preserve the local walk/leap duration and limb/root envelopes; stalk is outside this unchanged fixture selection.
 *
 * @evidence contracts/testing.md#behavioral-verification Binds shipped horse and cat profiles at 48 samples, then observes literal durations, sampled flexion ranges, the trot root-height lower bound and closed gallop/leap root ranges. The unit inspects product clip data rather than the profile arrangement alone.
 * @evidence contracts/testing.md#independent-expectations Local hand-authored tables retain the existing expected periods and degree/metre envelopes without extracting expectations from the generated clips or the current profile-backed playground producers. One-sided range coverage intentionally allows wider extrema, and closesRange retains the original absolute tolerances through nclose. Fixture provenance is historical rather than a claim that removed aggregate files were freshly read.
 * @evidence contracts/testing.md#distinguishing-cases Preserves horse walk/trot/gallop/rear and cat walk/leap, different limb subsets, one-sided angular coverage, trot root maximum and two-sided gallop/leap root bounds with every original tolerance. Phase, contacts, stalk and rendered geometry belong to other units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns both bindProfileGaits calls and private sampled-range readers. Fixtures contain only authored data and register no cases; no playground, viewer, process or native artifact is started.
 */
export function test_motion_profile_observables(): void {
  const horse: ReturnType<typeof bindProfileGaits> = bindProfileGaits(
    HORSE_PROFILE,
    "horse",
    48,
  );
  TestValidator.predicate(
    "horse walk duration matches handwritten clip",
    nclose(horse.walk!.duration, horseHandAuthored.walk.duration),
  );
  TestValidator.predicate(
    "horse trot duration matches handwritten clip",
    nclose(horse.trot!.duration, horseHandAuthored.trot.duration),
  );
  TestValidator.predicate(
    "horse gallop duration matches handwritten clip",
    nclose(horse.gallop!.duration, horseHandAuthored.gallop.duration),
  );
  TestValidator.predicate(
    "horse rear duration matches handwritten clip",
    nclose(horse.rear!.duration, horseHandAuthored.rear.duration),
  );
  TestValidator.equals(
    "horse walk preserves left foreleg envelope",
    namedFacts([
      [
        "coversRangeFlexionRangeHorse",
        (): boolean =>
          coversRange(
            flexionRange(horse.walk!, "leftUpperArm"),
            horseHandAuthored.walk.leftUpperArm,
            3,
          ),
      ],
      [
        "coversRangeFlexionRangeHorse2",
        (): boolean =>
          coversRange(
            flexionRange(horse.walk!, "leftLowerArm"),
            horseHandAuthored.walk.leftLowerArm,
            2,
          ),
      ],
    ]),
    { coversRangeFlexionRangeHorse: true, coversRangeFlexionRangeHorse2: true },
  );
  TestValidator.equals(
    "horse trot preserves left foreleg and high-root envelope",
    namedFacts([
      [
        "coversRangeFlexionRangeHorse",
        (): boolean =>
          coversRange(
            flexionRange(horse.trot!, "leftUpperArm"),
            horseHandAuthored.trot.leftUpperArm,
            4,
          ),
      ],
      [
        "coversRangeFlexionRangeHorse2",
        (): boolean =>
          coversRange(
            flexionRange(horse.trot!, "leftLowerArm"),
            horseHandAuthored.trot.leftLowerArm,
            2,
          ),
      ],
      [
        "rootYRangeHorseTrot",
        (): boolean =>
          rootYRange(horse.trot!).max >=
          horseHandAuthored.trot.rootY.max - 0.005,
      ],
    ]),
    {
      coversRangeFlexionRangeHorse: true,
      coversRangeFlexionRangeHorse2: true,
      rootYRangeHorseTrot: true,
    },
  );
  TestValidator.equals(
    "horse gallop preserves gather and suspension envelope",
    namedFacts([
      [
        "coversRangeFlexionRangeHorse",
        (): boolean =>
          coversRange(
            flexionRange(horse.gallop!, "leftUpperArm"),
            horseHandAuthored.gallop.leftUpperArm,
            4,
          ),
      ],
      [
        "coversRangeFlexionRangeHorse2",
        (): boolean =>
          coversRange(
            flexionRange(horse.gallop!, "leftLowerArm"),
            horseHandAuthored.gallop.leftLowerArm,
            3,
          ),
      ],
      [
        "closesRangeRootYRangeHorse",
        (): boolean =>
          closesRange(
            rootYRange(horse.gallop!),
            horseHandAuthored.gallop.rootY,
            0.01,
          ),
      ],
    ]),
    {
      coversRangeFlexionRangeHorse: true,
      coversRangeFlexionRangeHorse2: true,
      closesRangeRootYRangeHorse: true,
    },
  );
  TestValidator.equals(
    "horse rear preserves paw and spine envelope",
    namedFacts([
      [
        "coversRangeFlexionRangeHorse",
        (): boolean =>
          coversRange(
            flexionRange(horse.rear!, "leftUpperArm"),
            horseHandAuthored.rear.leftUpperArm,
            5,
          ),
      ],
      [
        "coversRangeFlexionRangeHorse2",
        (): boolean =>
          coversRange(
            flexionRange(horse.rear!, "leftLowerArm"),
            horseHandAuthored.rear.leftLowerArm,
            5,
          ),
      ],
      [
        "coversRangeFlexionRangeHorse3",
        (): boolean =>
          coversRange(
            flexionRange(horse.rear!, "spine"),
            horseHandAuthored.rear.spine,
            4,
          ),
      ],
    ]),
    {
      coversRangeFlexionRangeHorse: true,
      coversRangeFlexionRangeHorse2: true,
      coversRangeFlexionRangeHorse3: true,
    },
  );

  const cat: ReturnType<typeof bindProfileGaits> = bindProfileGaits(
    CAT_PROFILE,
    "cat",
    48,
  );
  TestValidator.predicate(
    "cat walk duration matches handwritten clip",
    nclose(cat.walk!.duration, catHandAuthored.walk.duration),
  );
  TestValidator.predicate(
    "cat leap duration matches handwritten clip",
    nclose(cat.leap!.duration, catHandAuthored.leap.duration),
  );
  TestValidator.equals(
    "cat walk preserves diagonal gait envelopes",
    namedFacts([
      [
        "coversRangeFlexionRangeCat",
        (): boolean =>
          coversRange(
            flexionRange(cat.walk!, "leftUpperArm"),
            catHandAuthored.walk.leftUpperArm,
            3,
          ),
      ],
      [
        "coversRangeFlexionRangeCat2",
        (): boolean =>
          coversRange(
            flexionRange(cat.walk!, "leftLowerArm"),
            catHandAuthored.walk.leftLowerArm,
            2,
          ),
      ],
      [
        "coversRangeFlexionRangeCat3",
        (): boolean =>
          coversRange(
            flexionRange(cat.walk!, "leftUpperLeg"),
            catHandAuthored.walk.leftUpperLeg,
            3,
          ),
      ],
      [
        "coversRangeFlexionRangeCat4",
        (): boolean =>
          coversRange(
            flexionRange(cat.walk!, "rightLowerLeg"),
            catHandAuthored.walk.rightLowerLeg,
            2,
          ),
      ],
    ]),
    {
      coversRangeFlexionRangeCat: true,
      coversRangeFlexionRangeCat2: true,
      coversRangeFlexionRangeCat3: true,
      coversRangeFlexionRangeCat4: true,
    },
  );
  TestValidator.equals(
    "cat leap preserves crouch and airborne envelope",
    namedFacts([
      [
        "coversRangeFlexionRangeCat",
        (): boolean =>
          coversRange(
            flexionRange(cat.leap!, "leftUpperArm"),
            catHandAuthored.leap.leftUpperArm,
            3,
          ),
      ],
      [
        "coversRangeFlexionRangeCat2",
        (): boolean =>
          coversRange(
            flexionRange(cat.leap!, "leftLowerArm"),
            catHandAuthored.leap.leftLowerArm,
            2,
          ),
      ],
      [
        "coversRangeFlexionRangeCat3",
        (): boolean =>
          coversRange(
            flexionRange(cat.leap!, "leftUpperLeg"),
            catHandAuthored.leap.leftUpperLeg,
            4,
          ),
      ],
      [
        "coversRangeFlexionRangeCat4",
        (): boolean =>
          coversRange(
            flexionRange(cat.leap!, "leftLowerLeg"),
            catHandAuthored.leap.leftLowerLeg,
            3,
          ),
      ],
      [
        "closesRangeRootYRangeCat",
        (): boolean =>
          closesRange(rootYRange(cat.leap!), catHandAuthored.leap.rootY, 0.02),
      ],
    ]),
    {
      coversRangeFlexionRangeCat: true,
      coversRangeFlexionRangeCat2: true,
      coversRangeFlexionRangeCat3: true,
      coversRangeFlexionRangeCat4: true,
      closesRangeRootYRangeCat: true,
    },
  );
}
