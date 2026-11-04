import {
  AutoMovieHumanRigControls,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import assert from "node:assert/strict";

import { MotionAction } from "../../../../src/motion/core/MotionAction";

/**
 * Keep the supported body boundary independent of later requests and task fitting.
 *
 * Scenarios:
 * 1. Nested clinical pose, root, frame/contact identity and load shares are exact owned copies.
 * 2. Mutating an original request cannot alter an earlier placement or another snapshot.
 * 3. Only body fields cross the boundary; external tasks and mutable host state do not.
 * 4. Public Human pose generation and direct clone assignment retain bilateral structure and branded numeric leaves.
 *
 * @evidence contracts/testing.md#observable-behavior Public snapshotBodyPlacement returns the body-only input unchanged in value with no shared nested object. Mutations of caller clinical controls, WORLD anchors, quaternion and load shares after capture must leave the earlier placement unchanged. This is ownership verification, not evidence that either authored body can be physically supported.
 * @evidence contracts/testing.md#independent-cases The public RigControls blend creates a bilateral pose from a typed source with both sides. A detached readonly pose clone is assigned directly to IAutoMovieHumanPose without a cast, and its branded knee value is consumed as a number. Mutations of the original left knee and separately cloned right knee cannot alter either snapshot. Explicit asymmetric coordinates, a nonidentity unit frame and unequal load shares supply independent ownership expectations; exact copied keys detect accidental task forwarding. The actual lab owns original-frame callback geometry, fixed WORLD task conversion, support-first admission, final arm/body origin and full-floor/per-foot-load checks.
 */
export function test_body_placement(): void {
  const pose: IAutoMovieHumanPose = AutoMovieHumanRigControls.blend(
    {},
    {
      pelvis: { rotation: 17 },
      legs: { left: { knee: { flexion: 23 } }, right: {} },
    },
    1,
  );
  const patch: MotionAction.SupportPatch = {
    side: "left",
    bone: "leftFoot",
    localPoint: [0.01, -0.02, 0.03],
    world: [2, 0, -3],
    initialWorld: [2, 0.02, -3],
    mode: "free",
    constraint: "hard",
    frameRotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
  };
  const request: MotionAction.Sample = {
    pose,
    rootOffset: [0.04, -0.03, 0.02],
    support: { left: 0.3, right: 0.7, patches: [patch] },
    effectors: [
      {
        bone: "leftHand",
        localPoint: [0.065, 0, 0],
        target: [0.9, 1.2, -0.1],
        role: "strike",
        radius: 0.07,
      },
    ],
    elapsed: 0.125,
    progress: 0.5,
    phase: "delivery",
  };
  const expected: MotionAction.BodyPlacement = structuredClone({
    pose: request.pose,
    rootOffset: request.rootOffset,
    support: request.support,
  });
  const first: MotionAction.BodyPlacement =
    MotionAction.snapshotBodyPlacement(request);
  const second: MotionAction.BodyPlacement =
    MotionAction.snapshotBodyPlacement(request);
  const consumerPose: IAutoMovieHumanPose = structuredClone(first.pose);
  const kneeDegrees: number = first.pose.legs!.left.knee!.flexion!;

  assert.deepEqual(first, expected);
  assert.deepEqual(
    Object.keys(first).sort((left: string, right: string): number =>
      left.localeCompare(right),
    ),
    ["pose", "rootOffset", "support"],
  );
  assert.notEqual(first.pose, request.pose);
  assert.notEqual(first.pose.legs?.left, request.pose.legs?.left);
  assert.ok(first.pose.legs?.right);
  assert.notEqual(first.pose.legs?.right, request.pose.legs?.right);
  assert.equal(kneeDegrees, 23);
  assert.equal(consumerPose.legs?.left.knee?.flexion, 23);
  assert.notEqual(first.rootOffset, request.rootOffset);
  assert.notEqual(first.support.patches?.[0].localPoint, patch.localPoint);
  assert.notEqual(first.support.patches?.[0].world, patch.world);
  assert.notEqual(
    first.support.patches?.[0].frameRotation,
    patch.frameRotation,
  );
  assert.notEqual(first.support.patches, second.support.patches);
  assert.notEqual(first.pose, second.pose);

  const oriented: MotionAction.Sample = {
    ...request,
    rootRotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
    preservedChannels: [
      AutoMovieHumanRigControls.channel("legs.left.knee.flexion"),
    ],
  };
  const orientedSnapshot: MotionAction.BodyPlacement =
    MotionAction.snapshotBodyPlacement(oriented);
  assert.deepEqual(orientedSnapshot.rootRotation, [
    0,
    Math.SQRT1_2,
    0,
    Math.SQRT1_2,
  ]);
  assert.deepEqual(orientedSnapshot.preservedChannels, [
    "legs.left.knee.flexion",
  ]);
  oriented.rootRotation![0] = 0.5;
  oriented.preservedChannels = [];
  assert.equal(orientedSnapshot.rootRotation![0], 0);
  assert.deepEqual(orientedSnapshot.preservedChannels, [
    "legs.left.knee.flexion",
  ]);

  request.pose.legs!.left!.knee!.flexion = 77;
  consumerPose.legs!.right.knee = { flexion: 13 };
  request.rootOffset[1] = 8;
  request.support.left = 0.9;
  request.support.right = 0.1;
  patch.world[0] = 99;
  patch.localPoint[2] = -9;
  patch.initialWorld![1] = 4;
  patch.frameRotation![0] = 1;
  request.effectors[0].target[0] = 50;

  assert.deepEqual(first, expected);
  assert.deepEqual(second, expected);
  assert.equal(first.pose.legs?.right.knee?.flexion, undefined);
  assert.equal(consumerPose.legs?.right.knee?.flexion, 13);
  const changed: MotionAction.BodyPlacement =
    MotionAction.snapshotBodyPlacement(request);
  assert.equal(changed.rootOffset[1], 8);
  assert.equal(first.rootOffset[1], -0.03);
  assert.deepEqual(first.support.patches?.[0].world, [2, 0, -3]);
}
