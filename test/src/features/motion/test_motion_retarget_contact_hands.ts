import {
  IAutoMovieRetargetHandContact,
  retargetHumanoidMotion,
} from "@automovie/engine";
import type { IAutoMovieKeyframe, IAutoMovieMotion, IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, validationHasNoWarnings, vclose } from "../internal/predicates";
import {
  keyframeWorld,
  mapped,
  proportionedRig,
  rootShiftClip,
  withoutBones,
} from "../internal/retargetRigs";
import { test12ValuesClose } from "../internal/test12ValuesClose";

const LEFT_ARM: Omit<IAutoMovieRetargetHandContact, "start" | "end"> = {
  hand: "leftHand",
  upper: "leftUpperArm",
  lower: "leftLowerArm",
};

/**
 * Observe caller-declared hand contact at existing key times, against undeclared and between-key windows. Ground inference is limited to the default feet; hand pins require explicit chain/window data in this API.
 *
 * The pass applies inclusive hand windows to authored key times rather than inserting a continuous contact clock. No table, wall or partner geometry is inspected by these numeric cases.
 *
 * The unchanged target scales arm offsets by 1.3 while retaining the leg/torso offsets. Its root scale remains one, isolating the authored arm-contact comparison.
 *
 * Scenarios:
 *
 * 1. Without a declaration, the left hand matches authored target rest position (0.923,1.645,0) and fails the source-position componentwise vclose tolerance 0.2; exact Euclidean miss is not asserted.
 * 2. Declaring the left-arm chain over the whole clip pins the hand back onto the
 *    mapped source contact within 0.005, on both keyframes, with no
 *    plausibility warning.
 * 3. A window that falls between the authored keyframe times pins nothing, so the
 *    clip is deep-equal to the undeclared retarget: the window bounds are
 *    inclusive tests against real keyframe times, not a hint.
 * 4. A declaration naming bones the target rig does not have is skipped rather
 *    than half-solved, and the retarget still succeeds.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures the undeclared longer-arm hand position and miss, declares a full-clip left-hand window and checks achieved contacts at both keys without warnings, compares a between-key window to undeclared output, and observes successful omission of an absent right-arm chain.
 * @evidence contracts/testing.md#independent-expectations Authored offsets give the literal target rest hand (0.923,1.645,0) and root scale 1; mapped source FK defines the existing pin target. The 0.2 negative-twin and 5e-3 contact tolerances are preserved. Shared FK is a consumer, and exact plain-record equality through test12ValuesClose eps0 bounds the between-key twin without asserting prototype/NaN/signed-zero identity.
 * @evidence contracts/testing.md#distinguishing-cases Retains undeclared versus full [0,1] versus empty-at-keys [0.4,0.6] windows, both existing keys and an absent declared right-arm chain. Window validation, grounded feet and continuous interpolation are separate concerns.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all four retarget calls and fixture FK observations. Existing rig/comparison helpers register no extra cases and start no viewer, process or native artifact.
 */
export function test_motion_retarget_contact_hands(): void {
  const source: IAutoMovieSkeleton = proportionedRig("hand-source");
  const target: IAutoMovieSkeleton = proportionedRig("long-arm-target", { arm: 1.3 });
  const motion: IAutoMovieMotion = rootShiftClip(source.id, { x: 0, y: 0, z: 0.25 });

  // 1. undeclared: the arm keeps its angles and the hand lands elsewhere.
  const undeclared: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({ motion, source, target });
  if (undeclared.motion === null || undeclared.characterization === null)
    throw new Error("undeclared hand retarget unexpectedly failed");
  TestValidator.predicate(
    "an arm-only proportion change leaves the root scale at one",
    nclose(undeclared.characterization.rootScale, 1, 0),
  );
  TestValidator.predicate(
    "the longer forearm puts the hand at its own rest position",
    vclose(keyframeWorld(target, undeclared.motion, 0, "leftHand"), {
      x: 0.923,
      y: 1.645,
      z: 0,
    }),
  );
  TestValidator.predicate(
    "an undeclared hand contact is not preserved",
    vclose(
      keyframeWorld(target, undeclared.motion, 0, "leftHand"),
      keyframeWorld(source, motion, 0, "leftHand"),
      0.2,
    ) === false,
  );

  // 2. declared over the whole clip: the hand holds the mapped contact.
  const declared: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion,
    source,
    target,
    contacts: { hands: [{ ...LEFT_ARM, start: 0, end: 1 }] },
  });
  TestValidator.equals("declared hand retarget succeeds", declared.validation, {
    success: true,
  });
  if (declared.motion === null) throw new Error("declared retarget failed");
  for (const index of [0, 1] as const)
    TestValidator.predicate(
      `the declared hand holds its contact on keyframe ${index}`,
      vclose(
        keyframeWorld(target, declared.motion, index, "leftHand"),
        mapped(keyframeWorld(source, motion, index, "leftHand"), 1),
        5e-3,
      ),
    );
  TestValidator.predicate(
    "a reachable hand contact reports no warning",
    validationHasNoWarnings("reachable hand contact", declared.validation),
  );

  // 3. a window between the keyframes pins nothing.
  const between: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion,
    source,
    target,
    contacts: { hands: [{ ...LEFT_ARM, start: 0.4, end: 0.6 }] },
  });
  if (between.motion === null) throw new Error("windowed retarget failed");
  TestValidator.predicate(
    "a window covering no keyframe leaves the clip untouched",
    test12ValuesClose(between.motion, undeclared.motion),
  );

  // 4. a declaration the target rig cannot resolve is skipped.
  const armless: IAutoMovieSkeleton = withoutBones(target, [
    "rightUpperArm",
    "rightLowerArm",
    "rightHand",
  ]);
  const skipped: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion,
    source,
    target: armless,
    contacts: {
      hands: [
        {
          hand: "rightHand",
          upper: "rightUpperArm",
          lower: "rightLowerArm",
          start: 0,
          end: 1,
        },
      ],
    },
  });
  TestValidator.equals(
    "a declaration naming absent bones still succeeds",
    skipped.validation,
    { success: true },
  );
  if (skipped.motion === null) throw new Error("skipped retarget failed");
  TestValidator.equals(
    "the unresolvable chain contributes no correction",
    skipped.motion.keyframes.map((kf: IAutoMovieKeyframe): number => kf.pose.joints.length),
    [0, 0],
  );
}
