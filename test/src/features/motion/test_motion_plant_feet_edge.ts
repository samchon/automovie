import { plantStanceFeet, resolvePose, sampleMotion, IAutoMovieFootLeg } from "@automovie/engine";
import {
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  AutoMovieHumanoidBone,
  IAutoMovieKeyframe,
  IAutoMovieJointPose,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";

const t: (x: number, y: number, z: number) => IAutoMovieTransform = (x: number, y: number, z: number): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const LEG: IAutoMovieFootLeg = {
  foot: "leftFoot",
  upper: "leftUpperLeg",
  lower: "leftLowerLeg",
};

const staticMotion: (skeletonId: string, travelX?: number) => IAutoMovieMotion = (skeletonId: string, travelX: number = 0): IAutoMovieMotion => ({
  id: "m",
  skeleton: skeletonId,
  duration: 1,
  loop: false,
  keyframes: [
    {
      time: 0,
      pose: { skeleton: skeletonId, root: t(0, 0, 0), joints: [] },
      expression: null,
      easing: "linear",
      bezier: null,
    },
    {
      time: 1,
      pose: { skeleton: skeletonId, root: t(travelX, 0, 0), joints: [] },
      expression: null,
      easing: "linear",
      bezier: null,
    },
  ],
});

const bone: (name: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null, rest: IAutoMovieTransform) => IAutoMovieSkeleton [ "bones" ] [ number ] = (name: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null, rest: IAutoMovieTransform): IAutoMovieSkeleton["bones"][number] =>
  ({
    bone: name,
    parent,
    rest,
    constraint: null,
  }) as IAutoMovieSkeleton["bones"][number];

// A stance foot exists but the leg segments named by LEG are absent from the rig.
const noSegments: IAutoMovieSkeleton = {
  id: "no-seg",
  bones: [
    bone("hips", null, t(0, 0.05, 0)),
    bone("leftFoot", "hips", t(0, -0.05, 0)),
  ],
};

// A zero-length thigh: the knee sits on the hip (l1 = 0).
const zeroThigh: IAutoMovieSkeleton = {
  id: "zero-thigh",
  bones: [
    bone("hips", null, t(0, 0.8, 0)),
    bone("leftUpperLeg", "hips", t(0, 0, 0)),
    bone("leftLowerLeg", "leftUpperLeg", t(0, 0, 0)),
    bone("leftFoot", "leftLowerLeg", t(0, -0.8, 0)),
  ],
};

// A leg folded so the foot rests exactly on the hip, both on the ground
// (target == hip, so the reach distance is zero).
const folded: IAutoMovieSkeleton = {
  id: "folded",
  bones: [
    bone("hips", null, t(0, 0, 0)),
    bone("leftUpperLeg", "hips", t(0, 0, 0)),
    bone("leftLowerLeg", "leftUpperLeg", t(0, -0.4, 0)),
    bone("leftFoot", "leftLowerLeg", t(0, 0.4, 0)),
  ],
};

// A reachable-slack leg (as the main test), driven far enough that the pinned
// foot is out of the leg's reach.
const reachLeg: IAutoMovieSkeleton = {
  id: "reach",
  bones: [
    bone("hips", null, t(0, 0.8, 0)),
    bone("leftUpperLeg", "hips", t(0.1, 0, 0)),
    bone("leftLowerLeg", "leftUpperLeg", t(0, -0.4, 0.15)),
    bone("leftFoot", "leftLowerLeg", t(0, -0.4, -0.15)),
  ],
};

// Every named bone is root-reachable, but the foot is the lower leg's sibling
// rather than its descendant. It is not a two-segment chain.
const branchedLeg: IAutoMovieSkeleton = {
  id: "branched-leg",
  bones: [
    bone("hips", null, t(0, 0.8, 0)),
    bone("leftUpperLeg", "hips", t(0, 0, 0)),
    bone("leftLowerLeg", "leftUpperLeg", t(0, -0.4, 0)),
    bone("leftFoot", "leftUpperLeg", t(0, -0.8, 0)),
  ],
};

// The lower leg and its foot form a separate root-reachable branch from the
// declared upper leg, so the first ancestry edge is invalid.
const splitLeg: IAutoMovieSkeleton = {
  id: "split-leg",
  bones: [
    bone("hips", null, t(0, 0.8, 0)),
    bone("leftUpperLeg", "hips", t(0, 0, 0)),
    bone("leftLowerLeg", "hips", t(0, -0.4, 0)),
    bone("leftFoot", "leftLowerLeg", t(0, -0.4, 0)),
  ],
};

// A fixed intermediate descendant is legal: the prepared relative transform
// includes it even though the declared upper and lower are not direct parent.
const indirectLeg: IAutoMovieSkeleton = {
  id: "indirect-leg",
  bones: [
    bone("hips", null, t(0, 0.8, 0)),
    bone("leftUpperLeg", "hips", t(0, 0, 0)),
    bone("leftToes", "leftUpperLeg", t(0, -0.2, 0)),
    bone("leftLowerLeg", "leftToes", t(0, -0.2, 0)),
    bone("leftFoot", "leftLowerLeg", t(0, -0.4, 0)),
  ],
};

/**
 * Observe completed stance reporting for absent and degenerate chains, articulation omission for invalid ancestry, correction for indirect ancestry, and finite FK for an unreachable target. The unreachable case asserts finiteness, not full extension or exact placement on the reach shell.
 *
 * Scenarios:
 *
 * 1. A foot whose leg segments are absent still reports one stance run without throwing; unchanged articulation is not separately asserted.
 * 2. A zero-length thigh (l1 = 0) still reports one run without throwing.
 * 3. A folded leg whose foot rests on the hip (reach distance 0) still reports one run without throwing.
 * 4. A pin beyond the leg's reach produces finite corrected foot coordinates; exact extension is not asserted.
 * 5. A root-reachable but branched pseudo-chain is left untouched because the fast
 *    chain FK requires lower and effector descendant ancestry.
 * 6. A lower/effector branch separated from the declared upper is likewise left
 *    untouched, while a valid indirect descendant chain is still solved.
 * 7. A non-positive sample rate throws.
 * 8. Nonfinite/negative tolerance, scalar ground, callback height and carried opening-target coordinates refuse; zero tolerance on an actual ground contact remains valid.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises planting through absent/degenerate/branched and valid indirect chains, then observes finite unreachable correction and exact input refusals; malformed contact fields cannot silently suppress detection or inject NaN targets.
 * @evidence contracts/testing.md#independent-expectations Declared hierarchy determines whether upper-to-lower-to-foot is descendant-connected, and explicit zero-length offsets determine degeneracy independently. Exact one-run counts, authored absence/presence of chain joints, finite coordinates and malformed-input fragments constrain outputs without calling fitting as an oracle. A zero-height foot at tolerance 0 is contact; no reach-shell distance is expected here.
 * @evidence contracts/testing.md#distinguishing-cases Missing/zero/folded/unreachable/branched/split/indirect chains, sample-rate boundary and static/dynamic/contact-target invalid numbers distinguish non-destructive best effort from malformed numeric input; exact achievable pin and swing trajectories belong to planting suites.
 * @evidence contracts/testing.md#execution-ownership Portable unit test discovered as test_motion_plant_feet_edge; this export owns the directly invoked numeric cases and requires no Human inspection, renderer or native artifact.
 */
export function test_motion_plant_feet_edge(): void {
  TestValidator.equals(
    "absent leg segments: run detected, leg untouched",
    plantStanceFeet({
      skeleton: noSegments,
      motion: staticMotion("no-seg"),
      legs: [LEG],
    }).plants.length,
    1,
  );
  TestValidator.equals(
    "zero-length thigh skipped without throw",
    plantStanceFeet({
      skeleton: zeroThigh,
      motion: staticMotion("zero-thigh"),
      legs: [LEG],
    }).plants.length,
    1,
  );
  TestValidator.equals(
    "folded leg (reach distance 0) skipped without throw",
    plantStanceFeet({
      skeleton: folded,
      motion: staticMotion("folded"),
      legs: [LEG],
    }).plants.length,
    1,
  );

  const far: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton: reachLeg,
    motion: staticMotion("reach", 0.5),
    legs: [LEG],
    sampleRate: 8,
  });
  const foot: ReturnType<typeof resolvePose>[number]["worldPosition"] = resolvePose(sampleMotion(far.motion, 1).pose, reachLeg).find(
    (b: ReturnType<typeof resolvePose>[number]) : boolean => b.bone === "leftFoot",
  )!.worldPosition;
  TestValidator.equals(
    "unreachable pin extends the leg without NaN",
    namedFacts([
      ["isFiniteFootX", () : boolean => Number.isFinite(foot.x)],
      ["isFiniteFootY", () : boolean => Number.isFinite(foot.y)],
      ["isFiniteFootZ", () : boolean => Number.isFinite(foot.z)],
    ]),
    { isFiniteFootX: true, isFiniteFootY: true, isFiniteFootZ: true },
  );

  const branched: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton: branchedLeg,
    motion: staticMotion("branched-leg", 0.25),
    legs: [LEG],
    sampleRate: 8,
  });
  TestValidator.equals(
    "branched pseudo-chain stays unchanged",
    namedFacts([
      ["branchedPlantsLength", () : boolean => branched.plants.length === 1],
      [
        "branchedMotionKeyframes",
        () : boolean =>
          branched.plants.length === 1 &&
          branched.motion.keyframes.every((keyframe: IAutoMovieKeyframe) : boolean =>
            keyframe.pose.joints.every(
              (joint: IAutoMovieJointPose) : boolean => joint.bone !== LEG.upper && joint.bone !== LEG.lower,
            ),
          ),
      ],
    ]),
    { branchedPlantsLength: true, branchedMotionKeyframes: true },
  );
  const split: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton: splitLeg,
    motion: staticMotion("split-leg", 0.25),
    legs: [LEG],
    sampleRate: 8,
  });
  const indirect: ReturnType<typeof plantStanceFeet> = plantStanceFeet({
    skeleton: indirectLeg,
    motion: staticMotion("indirect-leg", 0.25),
    legs: [LEG],
    sampleRate: 8,
  });
  TestValidator.equals(
    "both ancestry edges are enforced without rejecting indirect descendants",
    namedFacts([
      ["splitPlants", () : boolean => split.plants.length === 1],
      [
        "splitMotionKeyframes",
        () : boolean =>
          split.motion.keyframes.every((keyframe: IAutoMovieKeyframe) : boolean =>
            keyframe.pose.joints.every(
              (joint: IAutoMovieJointPose) : boolean => joint.bone !== LEG.upper && joint.bone !== LEG.lower,
            ),
          ),
      ],
      ["indirectPlants", () : boolean => indirect.plants.length === 1],
      [
        "indirectMotionKeyframes",
        () : boolean =>
          indirect.motion.keyframes.some((keyframe: IAutoMovieKeyframe) : boolean =>
            keyframe.pose.joints.some(
              (joint: IAutoMovieJointPose) : boolean => joint.bone === LEG.upper || joint.bone === LEG.lower,
            ),
          ),
      ],
    ]),
    {
      splitPlants: true,
      splitMotionKeyframes: true,
      indirectPlants: true,
      indirectMotionKeyframes: true,
    },
  );

  TestValidator.predicate(
    "non-positive sample rate throws",
    throwsError(() : ReturnType<typeof plantStanceFeet> =>
      plantStanceFeet({
        skeleton: reachLeg,
        motion: staticMotion("reach"),
        sampleRate: 0,
      }),
    ),
  );
  for (const tolerance of [-0.01, Number.NaN, Number.POSITIVE_INFINITY])
    TestValidator.predicate("invalid tolerance cannot hide stance", throwsError((): ReturnType<typeof plantStanceFeet> => plantStanceFeet({ skeleton: noSegments, motion: staticMotion(noSegments.id), legs: [LEG], tolerance }), "finite and non-negative"));
  for (const groundY of [Number.NaN, Number.NEGATIVE_INFINITY])
    TestValidator.predicate("nonfinite scalar ground refuses", throwsError((): ReturnType<typeof plantStanceFeet> => plantStanceFeet({ skeleton: noSegments, motion: staticMotion(noSegments.id), legs: [LEG], groundY }), "ground height must be finite"));
  TestValidator.predicate("nonfinite sampled ground refuses", throwsError((): ReturnType<typeof plantStanceFeet> => plantStanceFeet({ skeleton: noSegments, motion: staticMotion(noSegments.id), legs: [LEG], groundY: (): number => Number.NaN }), "contact ground height"));
  TestValidator.predicate("nonfinite opening pin refuses", throwsError((): ReturnType<typeof plantStanceFeet> => plantStanceFeet({ skeleton: noSegments, motion: staticMotion(noSegments.id), legs: [LEG], openingPlants: [{ foot: LEG.foot, position: { x: 0, y: Number.NaN, z: 0 } }] }), "stance target"));
  TestValidator.equals("zero tolerance retains exact ground contact", plantStanceFeet({ skeleton: noSegments, motion: staticMotion(noSegments.id), legs: [LEG], tolerance: 0 }).plants.length, 1);
}
