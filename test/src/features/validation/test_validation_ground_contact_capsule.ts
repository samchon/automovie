import { validateGroundContact } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeMotion } from "../internal/fixtures";
import {
  hasViolation,
  namedFacts,
  validationHasNoWarnings,
  validationHasWarning,
} from "../internal/predicates";

const restAt: (x: number, y: number, z: number) => IAutoMovieTransform = (
  x: number,
  y: number,
  z: number,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

/**
 * Hips at world y=1, chest at 1.5, leftHand at 0.1: a body standing over y=0
 * ground with one low hand. A hips→leftHand capsule of radius 0.2 dips to y =
 * 0.1 − 0.2 = −0.1, penetrating; hips→chest (radius 0.2, lowest 0.8) clears.
 */
const body: IAutoMovieSkeleton = {
  id: "capsule-body",
  bones: [
    { bone: "hips", parent: null, rest: restAt(0, 1, 0), constraint: null },
    {
      bone: "chest",
      parent: "hips",
      rest: restAt(0, 0.5, 0),
      constraint: null,
    },
    {
      bone: "leftHand",
      parent: "hips",
      rest: restAt(0, -0.9, 0),
      constraint: null,
    },
  ],
};

/** Hips reachable, leftFoot declared under an absent `leftLowerLeg` → detached. */
const detached: IAutoMovieSkeleton = {
  id: "capsule-detached",
  bones: [
    { bone: "hips", parent: null, rest: restAt(0, 1, 0), constraint: null },
    {
      bone: "leftFoot",
      parent: "leftLowerLeg",
      rest: restAt(0, -0.9, 0),
      constraint: null,
    },
  ],
};

const pose: (skeletonId: string) => IAutoMoviePose = (
  skeletonId: string,
): IAutoMoviePose => ({
  skeleton: skeletonId,
  root: restAt(0, 0, 0),
  joints: [],
});
const key: (skeletonId: string, time: number) => IAutoMovieKeyframe = (
  skeletonId: string,
  time: number,
): IAutoMovieKeyframe => ({
  time,
  pose: pose(skeletonId),
  expression: null,
  easing: "linear",
  bezier: null,
});
const still: (target: IAutoMovieSkeleton) => IAutoMovieMotion = (
  target: IAutoMovieSkeleton,
): IAutoMovieMotion => makeMotion([key(target.id, 0), key(target.id, 1)], 1);

/**
 * A configured body capsule receives ground-penetration advice from its endpoint heights and radius; detached endpoints fail admission rather than disappearing from FK.
 *
 * Scenarios:
 *
 * 1. A hips→hand capsule whose radius sinks its lowest point below the ground
 *    warns at `$input.samples[i].capsules[0].lowestY` while the run succeeds.
 * 2. A hips→chest capsule that stays well above the ground raises no warning.
 * 3. Reversing the endpoints (hand→hips) still finds the low hand as the deepest
 *    point: the endpoint reduction is order-independent.
 * 4. `physicsIntent` suppresses the capsule warning, exactly as it does the foot
 *    warning.
 * 5. A capsule on a detached endpoint is a `type` error (not reachable), not a
 *    silent skip or a crash: the totality contract the point check lacks.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual ground validation with foot checks disabled and reads capsule warnings, clear/intent-suppressed reports and a detached-endpoint type error, catching a skipped low hand or unchecked unreachable bone.
 * @evidence contracts/testing.md#independent-expectations Existing rest offsets place the hand at 0.1m and the capsule's lower surface at 0.1-0.2=-0.1m; hips-to-chest stays at least 0.8m above ground. Reversing endpoints preserves that minimum, and an undeclared ancestor makes the foot unreachable. The test observes located warnings rather than their exact numerical depth.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts low/clear capsules, reversed endpoint order, intentional motion and detached topology; ordinary foot-point and surface-ground cases have separate entries. No continuous collision or curved-heightfield proof is claimed.
 * @evidence contracts/testing.md#execution-ownership The named synchronous entry owns its existing generic rig/clip/capsule records and invokes portable sampling/FK without adding a Human asset, geometry case, renderer or native artifact.
 */
export function test_validation_ground_contact_capsule(): void {
  const sunk: IAutoMovieValidation = validateGroundContact({
    motion: still(body),
    skeleton: body,
    footBones: [],
    capsules: [{ from: "hips", to: "leftHand", radius: 0.2 }],
    sampleRate: 1,
  });
  TestValidator.predicate(
    "a capsule dipping below ground warns but succeeds",
    validationHasWarning(
      "sunk body capsule",
      sunk,
      "physics",
      "$input.samples[0].capsules[0].lowestY",
    ),
  );

  const clear: IAutoMovieValidation = validateGroundContact({
    motion: still(body),
    skeleton: body,
    footBones: [],
    capsules: [{ from: "hips", to: "chest", radius: 0.2 }],
    sampleRate: 1,
  });
  TestValidator.predicate(
    "a capsule above the ground raises no warning",
    validationHasNoWarnings("clear ground capsule", clear),
  );

  const reversed: IAutoMovieValidation = validateGroundContact({
    motion: still(body),
    skeleton: body,
    footBones: [],
    capsules: [{ from: "leftHand", to: "hips", radius: 0.2 }],
    sampleRate: 1,
  });
  TestValidator.predicate(
    "the deepest endpoint is found regardless of capsule order",
    validationHasWarning(
      "reversed sunk body capsule",
      reversed,
      "physics",
      "$input.samples[0].capsules[0].lowestY",
    ),
  );

  const acknowledged: IAutoMovieValidation = validateGroundContact({
    motion: still(body),
    skeleton: body,
    footBones: [],
    capsules: [{ from: "hips", to: "leftHand", radius: 0.2 }],
    sampleRate: 1,
    physicsIntent: "phasing",
  });
  TestValidator.predicate(
    "physicsIntent suppresses the capsule warning",
    validationHasNoWarnings("acknowledged ground capsule", acknowledged),
  );

  const bad: IAutoMovieValidation = validateGroundContact({
    motion: still(detached),
    skeleton: detached,
    footBones: [],
    capsules: [{ from: "hips", to: "leftFoot", radius: 0.2 }],
    sampleRate: 1,
  });
  TestValidator.equals(
    "a detached capsule endpoint is a reachability error, not a crash",
    namedFacts([
      ["badSuccess", (): boolean => bad.success === false],
      [
        "hasViolationBadType",
        (): boolean =>
          bad.success === false &&
          hasViolation(bad, "type", "$input.capsules[0].to"),
      ],
      [
        "badViolationsV",
        (): boolean =>
          bad.success === false &&
          bad.violations.some((v: IAutoMovieConstraintViolation): boolean =>
            v.expected.includes("not reachable"),
          ),
      ],
    ]),
    { badSuccess: true, hasViolationBadType: true, badViolationsV: true },
  );
}
