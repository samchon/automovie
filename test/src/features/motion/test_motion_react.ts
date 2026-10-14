import { reactMotion, validateMotion } from "@automovie/engine";
import {
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  namedFacts,
  nclose,
  validationHasNoWarnings,
} from "../internal/predicates";

const rest: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
const bone: (
  name: IAutoMovieBone["bone"],
  constraint: IAutoMovieBone["constraint"],
) => IAutoMovieBone = (
  name: IAutoMovieBone["bone"],
  constraint: IAutoMovieBone["constraint"],
): IAutoMovieBone => ({ bone: name, parent: null, rest, constraint });

const skeleton: IAutoMovieSkeleton = {
  id: "react-rig",
  bones: [
    bone("spine", {
      flexion: { min: -30, max: 40 },
      abduction: null,
      twist: null,
    }),
    bone("chest", null),
  ],
};

const sp: (p: IAutoMoviePose) => IAutoMovieJointPose = (
  p: IAutoMoviePose,
): IAutoMovieJointPose =>
  p.joints.find((x: IAutoMovieJointPose): boolean => x.bone === "spine")!;

const throws: (task: () => void) => boolean = (task: () => void): boolean => {
  try {
    task();
    return false;
  } catch {
    return true;
  }
};

/**
 * Observe reactMotion's rest-to-clamped-flinch-to-rest clip, its neutral-axis semantics and explicit/default timing admission. Direct motion data and validator results are observed here; no harness dispatch, integrated impulse simulation or rendered reaction is exercised.
 *
 * Scenarios:
 *
 * 1. Three keyframes at 0, peak, duration; the skeleton id is carried.
 * 2. The flinch keyframe is the effective-ROM recoil: the explicit spine clamps at
 *    −30°, and a null-override canonical chest uses its default −20° minimum.
 * 3. The clip starts and ends with `null` resting axes. A zero-excluding override
 *    therefore validates across the whole rest → flinch → rest motion.
 * 4. Invalid explicit timing rejects: non-positive/NaN durations, and explicit
 *    peaks outside (0, duration).
 * 5. The DEFAULT peak scales to the duration: a 0.1 s quick flinch peaks at 0.04 s
 *    instead of rejecting outright, while a 0.5 s react keeps the exact 0.16 s
 *    snap within the original nclose tolerance; bit identity is not asserted.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls reactMotion, checks three times and carried skeleton identity, literal clamped spine/chest values and null endpoints, then validates ordinary and zero-excluding rigs. Invalid timing must throw, and short versus longer duration observes the default peak policy.
 * @evidence contracts/testing.md#independent-expectations The authored spine range sets -30, the fixed humanoid chest convention sets -20, and null denotes unauthored rest even when a numeric range excludes zero. The existing policy min(0.16,0.4*duration) gives literal peaks 0.04 and 0.16; expected values are local literals rather than a second reactMotion call. Shared validateMotion supplies consumer admission, not an independent biological oracle, and any thrown value retains the original refusal semantics.
 * @evidence contracts/testing.md#distinguishing-cases Retains explicit versus default ROM, zero-excluding flexion/abduction with a twist-only push, null rest endpoints, invalid duration and peak tables, quick 0.1-second and longer 0.5-second defaults. Chain propagation and malformed push axes belong to recoil units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns direct reaction and validation calls with local skeletons. Private bone/spine/refusal helpers register no cases and start no viewer, process or native artifact.
 */
export function test_motion_react(): void {
  const clip: ReturnType<typeof reactMotion> = reactMotion(
    "r",
    skeleton,
    { flexion: -200 },
    ["spine", "chest"],
    1.0,
    0.2,
  );

  // 1. shape
  TestValidator.equals("three keyframes", clip.keyframes.length, 3);
  TestValidator.equals(
    "times 0, peak, duration",
    namedFacts([
      [
        "ncloseClipKeyframes",
        (): boolean => nclose(clip.keyframes[0]!.time, 0),
      ],
      [
        "ncloseClipKeyframes2",
        (): boolean => nclose(clip.keyframes[1]!.time, 0.2),
      ],
      [
        "ncloseClipKeyframes3",
        (): boolean => nclose(clip.keyframes[2]!.time, 1.0),
      ],
    ]),
    {
      ncloseClipKeyframes: true,
      ncloseClipKeyframes2: true,
      ncloseClipKeyframes3: true,
    },
  );
  TestValidator.equals("skeleton id carried", clip.skeleton, "react-rig");

  // 2. flinch is ROM-clamped
  TestValidator.predicate(
    "spine flinch clamped to ROM min −30",
    nclose(sp(clip.keyframes[1]!.pose).flexion!, -30),
  );
  TestValidator.predicate(
    "null-override chest clamps to the default humanoid ROM minimum",
    nclose(
      clip.keyframes[1]!.pose.joints.find(
        (x: IAutoMovieJointPose): boolean => x.bone === "chest",
      )!.flexion!,
      -20,
    ),
  );

  // 3. starts and ends at rest
  TestValidator.equals(
    "starts at rest",
    sp(clip.keyframes[0]!.pose).flexion,
    null,
  );
  TestValidator.equals(
    "ends at rest",
    sp(clip.keyframes[2]!.pose).flexion,
    null,
  );
  TestValidator.predicate(
    "the effective-ROM react clip validates as a whole",
    validationHasNoWarnings(
      "effective-ROM react clip",
      validateMotion({ motion: clip, skeleton }),
    ),
  );
  const zeroExcludingSkeleton: IAutoMovieSkeleton = {
    id: "zero-excluding-react-rig",
    bones: [
      bone("leftLowerArm", {
        flexion: { min: 10, max: 145 },
        abduction: { min: 5, max: 30 },
        twist: null,
      }),
    ],
  };
  const zeroExcluding: ReturnType<typeof reactMotion> = reactMotion(
    "zero-excluding",
    zeroExcludingSkeleton,
    { twist: 8 },
    ["leftLowerArm"],
    1,
    0.2,
  );
  TestValidator.equals(
    "zero-excluding react rests at null and validates through its flinch",
    namedFacts([
      [
        "zeroExcludingKeyframesPose",
        (): boolean =>
          zeroExcluding.keyframes[0]!.pose.joints[0]!.flexion === null,
      ],
      [
        "zeroExcludingKeyframesPose2",
        (): boolean =>
          zeroExcluding.keyframes[2]!.pose.joints[0]!.abduction === null,
      ],
      [
        "validationHasNoWarningsZeroExcluding",
        (): boolean =>
          validationHasNoWarnings(
            "zero-excluding react clip",
            validateMotion({
              motion: zeroExcluding,
              skeleton: zeroExcludingSkeleton,
            }),
          ),
      ],
    ]),
    {
      zeroExcludingKeyframesPose: true,
      zeroExcludingKeyframesPose2: true,
      validationHasNoWarningsZeroExcluding: true,
    },
  );
  // 4. invalid timing rejects before emitting non-increasing keyframes
  for (const duration of [Number.NaN, 0, -1])
    TestValidator.predicate(
      `rejects invalid duration ${duration}`,
      throws((): void => {
        reactMotion(
          "badDuration",
          skeleton,
          { flexion: -10 },
          ["spine"],
          duration,
        );
      }),
    );

  for (const peak of [Number.NaN, 0, -0.1, 1])
    TestValidator.predicate(
      `rejects invalid peak ${peak}`,
      throws((): void => {
        reactMotion("badPeak", skeleton, { flexion: -10 }, ["spine"], 1, peak);
      }),
    );

  // 5. the default peak scales to a quick flinch instead of rejecting it
  const quick: ReturnType<typeof reactMotion> = reactMotion(
    "short",
    skeleton,
    { flexion: -10 },
    ["spine"],
    0.1,
  );
  TestValidator.equals(
    "a 0.1 s duration scales the default peak to 0.04",
    namedFacts([
      [
        "ncloseQuickKeyframes",
        (): boolean => nclose(quick.keyframes[1]!.time, 0.04),
      ],
      ["ncloseQuickDuration", (): boolean => nclose(quick.duration, 0.1)],
    ]),
    { ncloseQuickKeyframes: true, ncloseQuickDuration: true },
  );
  const long: ReturnType<typeof reactMotion> = reactMotion(
    "long",
    skeleton,
    { flexion: -10 },
    ["spine"],
    0.5,
  );
  TestValidator.predicate(
    "durations ≥ 0.4 s keep the exact 0.16 s default peak",
    nclose(long.keyframes[1]!.time, 0.16),
  );
}
