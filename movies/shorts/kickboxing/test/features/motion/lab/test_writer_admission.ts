import { AutoMovieHumanRigControls } from "@automovie/human";
import assert from "node:assert/strict";

import { LabArmAnatomy } from "../../../../src/motion-lab/LabArmAnatomy";
import type { LabArmWriter } from "../../../../src/motion-lab/LabArmWriter";
import { LabBodyStage } from "../../../../src/motion-lab/LabBodyStage";
import { LabPlacement } from "../../../../src/motion-lab/LabPlacement";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";

/**
 * Reject competing roots and support plans before merging either owned arm.
 *
 * Scenarios:
 * 1. Disjoint arms consume the exact same body and retain both local clocks.
 * 2. Root translation, load or original anchor changes refuse without mutation.
 * 3. Equal support objects remain valid regardless of property insertion order.
 *
 * @evidence contracts/testing.md#observable-behavior Executes the real pure arm merger, requiring exact original root/support authority while allowing different arm poses and source clocks. Conflicting world goals cannot be silently overwritten by placement.
 * @evidence contracts/testing.md#independent-cases Literal root, foot point and load values define independent expectations. Inputs and output are independently owned. Native physical admission is covered by actual actor-stage tests.
 */
export function test_writer_admission_body_authority(): void {
  const placement: MotionAction.BodyPlacement = body();
  const left: LabArmWriter = writer("left", placement);
  const right: LabArmWriter = writer("right", placement);
  right.sample.elapsed = 0.27;
  const before: string = JSON.stringify([placement, left, right]);
  const result: MotionAction.Sample = LabBodyStage.arms(
    [left, right],
    placement,
  );
  const informational: LabArmWriter = structuredClone(left);
  informational.sample.pose.pelvis = { rotation: 91 };
  informational.sample.pose.spine = { thoracic: { rotation: 42 } };
  informational.sample.pose.legs = {
    left: { knee: { flexion: 72 } },
    right: {},
  };
  informational.sample.preservedChannels = [
    AutoMovieHumanRigControls.channel("pelvis.rotation"),
  ];
  const narrow: MotionAction.Sample = LabBodyStage.arms(
    [informational],
    placement,
  );
  assert.deepEqual(narrow.pose.pelvis, placement.pose.pelvis);
  assert.deepEqual(narrow.pose.spine, placement.pose.spine);
  assert.deepEqual(narrow.pose.legs, placement.pose.legs);
  assert.ok(
    !narrow.preservedChannels?.includes(
      AutoMovieHumanRigControls.channel("pelvis.rotation"),
    ),
  );
  assert.equal(result.pose.arms?.left.elbow?.flexion, 81);
  assert.equal(result.pose.arms?.right.elbow?.flexion, 97);
  assert.deepEqual(result.rootOffset, [0.02, 0, -0.01]);
  assert.equal(left.sample.elapsed, 0.13);
  assert.equal(right.sample.elapsed, 0.27);
  for (const conflict of ["root", "rotation", "load", "anchor"] as const) {
    const invalid: LabArmWriter = structuredClone(right);
    if (conflict === "root") invalid.sample.rootOffset[0] += 0.001;
    else if (conflict === "rotation")
      invalid.sample.rootRotation = [0, 0, Math.SQRT1_2, Math.SQRT1_2];
    else if (conflict === "load") {
      invalid.sample.support.left = 0.5;
      invalid.sample.support.right = 0.5;
    } else invalid.sample.support.patches![0]!.world[0] += 0.001;
    assert.throws(
      (): unknown => LabBodyStage.arms([left, invalid], placement),
      /single realized root and support/u,
    );
  }
  const equivalent: LabArmWriter = structuredClone(right);
  equivalent.sample.support = {
    patches: equivalent.sample.support.patches,
    right: 0.4,
    left: 0.6,
  };
  equivalent.sample.rootRotation = [0, 0, 0, -1];
  assert.doesNotThrow((): unknown =>
    LabBodyStage.arms([left, equivalent], placement),
  );
  result.support.patches![0]!.world[0] = 9;
  result.rootOffset[0] = 9;
  assert.equal(JSON.stringify([placement, left, right]), before);
}

/**
 * Anatomical ownership excludes same-side feet as well as the opposite arm.
 *
 * Scenarios:
 * 1. Own Hand and LowerArm tasks remain valid.
 * 2. Same-side Foot, Eye and opposite Hand tasks refuse.
 * 3. Duplicate writers and foreign channels refuse before output construction.
 *
 * @evidence contracts/testing.md#observable-behavior Passes actual public Human joint identities through the merger. The same-side Foot case catches the former prefix-only admission; a valid own-arm guide remains accepted.
 * @evidence contracts/testing.md#independent-cases Public anatomical joint names independently distinguish arm from leg and eye. This portable authority test does not replace real host support or collision checks.
 */
export function test_writer_admission_anatomy(): void {
  const placement: MotionAction.BodyPlacement = body();
  const left: LabArmWriter = writer("left", placement);
  left.sample.effectors.push({
    bone: AutoMovieHumanRigControls.joint("leftLowerArm"),
    target: [0.2, 1.3, 0.1],
    role: "guide",
    radius: 0.03,
  });
  left.sample.effectors.push({
    bone: AutoMovieHumanRigControls.joint("leftIndexIntermediate"),
    target: [0.25, 1.3, 0.1],
    role: "guide",
    radius: 0.01,
  });
  assert.equal(LabArmAnatomy.contains("leftIndexIntermediate", "left"), true);
  assert.equal(LabArmAnatomy.contains("leftIndexIntermediate", "right"), false);
  assert.doesNotThrow((): unknown => LabBodyStage.arms([left], placement));
  for (const bone of ["leftFoot", "leftEye", "rightHand"]) {
    const invalid: LabArmWriter = structuredClone(left);
    invalid.sample.effectors[0]!.bone = AutoMovieHumanRigControls.joint(bone);
    assert.throws(
      (): unknown => LabBodyStage.arms([invalid], placement),
      /anatomical arm/u,
    );
    assert.throws(
      (): unknown => LabBodyStage.arm(invalid.sample, placement, "left"),
      /anatomical arm/u,
    );
  }
  assert.throws(
    (): unknown => LabBodyStage.arms([left, left], placement),
    /Duplicate arm writer/u,
  );
  const foreign: LabArmWriter = {
    ...left,
    channels: [AutoMovieHumanRigControls.channel("arms.right.elbow.flexion")],
  };
  assert.throws(
    (): unknown => LabBodyStage.arms([foreign], placement),
    /own-side/u,
  );
}

/**
 * A continuing arm cannot discard or relabel the host's retained leg goals.
 *
 * Scenarios:
 * 1. Original shin strike and sole guide survive body preparation and arm merge.
 * 2. Duplicate leg identities and arm tasks disguised as retained body goals refuse.
 * 3. Returned goals own their arrays independently of both inputs.
 *
 * @evidence contracts/testing.md#observable-behavior Supplies literal non-arm targets through the actual optional body-task boundary and final arm merger. It checks complete metadata/value preservation and input mutation independence, catching the former loss of leg effectors during arm carry.
 * @evidence contracts/testing.md#independent-cases The independent shin and sole coordinates differ from arm goals and root coordinates. This proves request retention, while the real actor retained-leg-goal unit verifies WORLD preservation after actual support fitting.
 */
export function test_writer_admission_retained_leg_goals(): void {
  const placement: MotionAction.BodyPlacement = body();
  const oldArm: LabArmWriter = writer("left", placement);
  const legs: MotionAction.Effector[] = [
    {
      bone: AutoMovieHumanRigControls.joint("rightLowerLeg"),
      localPoint: [0, -0.2, 0.01],
      target: [0.62, 1.52, 0.02],
      role: "strike",
      radius: 0.04,
    },
    {
      bone: AutoMovieHumanRigControls.joint("rightFoot"),
      localPoint: [0.05, -0.03, 0],
      target: [0.3, 0.8, -0.1],
      role: "guide",
      constraint: "hard",
      radius: 0,
    },
  ];
  const before: string = JSON.stringify([placement, oldArm, legs]);
  assert.deepEqual(LabBodyStage.sample(placement, legs).effectors, legs);
  const output: MotionAction.Sample = LabBodyStage.arms(
    [oldArm],
    placement,
    legs,
  );
  assert.deepEqual(output.effectors.slice(0, 2), legs);
  assert.deepEqual(output.effectors[2], oldArm.sample.effectors[0]);
  assert.deepEqual(output.rootOffset, placement.rootOffset);
  assert.throws(
    (): unknown => LabBodyStage.arms([oldArm], placement, [legs[0]!, legs[0]!]),
    /unique non-arm/u,
  );
  assert.throws(
    (): unknown =>
      LabBodyStage.arms([oldArm], placement, oldArm.sample.effectors),
    /unique non-arm/u,
  );
  assert.throws(
    (): unknown =>
      LabBodyStage.arms([oldArm], placement, [
        {
          ...legs[0]!,
          bone: AutoMovieHumanRigControls.joint("leftIndexIntermediate"),
        },
      ]),
    /unique non-arm/u,
  );
  output.effectors[0]!.target[0] = 99;
  output.effectors[1]!.localPoint![0] = 99;
  assert.equal(JSON.stringify([placement, oldArm, legs]), before);
}

/**
 * Prepared placement equality follows body semantics rather than serialization order.
 * @evidence contracts/testing.md#observable-behavior Calls the shared predicate used by actor admission with reordered complete pose/support objects and q/-q root orientation, then changes each authoritative body, root, support and lock field independently.
 * @evidence contracts/testing.md#independent-cases Literal value changes remain unequal while insertion-order-only changes remain equal. Narrow writer acceptance is checked separately and cannot authorize changing the prepared body.
 */
export function test_writer_admission_prepared_placement(): void {
  const placement: MotionAction.BodyPlacement = {
    ...body(),
    rootRotation: [0, 0, 0, 1],
    preservedChannels: [
      AutoMovieHumanRigControls.channel("legs.left.knee.flexion"),
    ],
  };
  const reordered: MotionAction.BodyPlacement = {
    support: { patches: placement.support.patches, right: 0.4, left: 0.6 },
    rootOffset: [0.02, 0, -0.01],
    pose: { arms: { right: {}, left: {} }, pelvis: { rotation: 6 } },
    rootRotation: [0, 0, 0, -1],
    preservedChannels: [
      AutoMovieHumanRigControls.channel("legs.left.knee.flexion"),
    ],
  };
  assert.equal(LabPlacement.same(placement, reordered), true);
  for (const field of ["body", "root", "support", "locks"] as const) {
    const changed: MotionAction.Sample = LabBodyStage.sample(placement);
    changed.preservedChannels = [...(placement.preservedChannels ?? [])];
    if (field === "body") changed.pose.pelvis = { rotation: 7 };
    else if (field === "root") changed.rootOffset[0] += 0.001;
    else if (field === "support")
      changed.support.patches![0]!.world[0] += 0.001;
    else changed.preservedChannels = [];
    assert.equal(LabPlacement.same(placement, changed), false, field);
  }
}

/** Literal original world support is independent of the tested merger. */
function body(): MotionAction.BodyPlacement {
  return {
    pose: { pelvis: { rotation: 6 }, arms: { left: {}, right: {} } },
    rootOffset: [0.02, 0, -0.01],
    support: {
      left: 0.6,
      right: 0.4,
      patches: [
        {
          side: "left",
          bone: AutoMovieHumanRigControls.joint("leftFoot"),
          localPoint: [0.04, -0.03, 0],
          world: [0.14, 0, 0.1],
          mode: "planted",
          constraint: "hard",
        },
      ],
    },
  };
}

/** Each writer owns one real arm and borrows the same immutable body authority. */
function writer(
  side: MotionAction.Side,
  placement: MotionAction.BodyPlacement,
): LabArmWriter {
  const sample: MotionAction.Sample = LabBodyStage.sample(placement);
  sample.pose.arms ??= { left: {}, right: {} };
  sample.pose.arms[side] = { elbow: { flexion: side === "left" ? 81 : 97 } };
  sample.elapsed = 0.13;
  sample.effectors = [
    {
      bone: AutoMovieHumanRigControls.joint(`${side}Hand`),
      target: [0.4, 1.4, side === "left" ? 0.1 : -0.1],
      role: "strike",
      radius: 0.08,
    },
  ];
  return {
    side,
    sample,
    channels: [AutoMovieHumanRigControls.channel(`arms.${side}.elbow.flexion`)],
  };
}
