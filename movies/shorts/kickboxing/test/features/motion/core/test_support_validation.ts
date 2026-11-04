import assert from "node:assert/strict";

import { MotionAction } from "../../../../src/motion/core/MotionAction";

/**
 * Pin semantic load ownership before any numerical or displayed actor mutation.
 *
 * Scenarios:
 * 1. Both single-foot sides and normalized double support accept original own-side carriers.
 * 2. NaN, infinity, negative, zero-total and nonnormalized shares refuse.
 * 3. Side swaps, foreign/non-foot bones and missing explicit loaded witnesses refuse.
 * 4. Free hard trajectories stay distinct from loaded support and cannot satisfy a share.
 * 5. Mixed foot/hand/knee/hip/trunk contacts and airborne intent use separate closed branches.
 * 6. Contact identities, anatomical regions and root quaternions reject malformed inputs.
 * 7. Body snapshots detach root orientation, original goals and authored control selection.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the public support validators and snapshot boundary without a host, process or GPU. Rejection catches semantic records that previously bypassed loaded-side inspection. These tests cannot prove emitted-vertex membership, world contact, balance or convergence; actual actor consumers own those checks.
 * @evidence contracts/testing.md#independent-cases Literal anatomical carriers, normalized fractions, unit quaternions and the documented 1e-9 sum tolerance supply independent expectations. Both sides, each whole-body support region, unknown branches, contradictory authorities, duplicate ids, sparse coordinates and detached mutation distinguish valid support from structural or numeric errors.
 */
export function test_support_validation(): void {
  const left: MotionAction.SupportPatch = {
    side: "left",
    bone: "leftFoot",
    localPoint: [0.02, -0.04, 0.01],
    world: [1, 0, 2],
    mode: "planted",
  };
  const right: MotionAction.SupportPatch = {
    side: "right",
    bone: "rightToe2Distal",
    localPoint: [0.01, -0.01, 0],
    world: [1.4, 0, 2.1],
    mode: "pivot",
    yawDegrees: 12,
  };
  MotionAction.validateSupport({ left: 1, right: 0, patches: [left] });
  MotionAction.validateSupport({
    kind: "feet",
    left: 0,
    right: 1,
    patches: [right],
  });
  MotionAction.validateSupport({
    left: 0.4,
    right: 0.6,
    patches: [left, right],
  });
  MotionAction.validateSupport({ left: 0.5, right: 0.5 });
  MotionAction.validateSupport({ left: 0.5, right: 0.5 + 5e-10 });
  const original: MotionAction.SupportPatch = structuredClone(left);
  for (const shares of [
    [NaN, NaN],
    [Infinity, 0],
    [-0.2, 1.2],
    [0, 0],
    [0.4, 0.5],
    [0.5, 0.5 + 2e-9],
  ] as const)
    rejectSupport({
      left: shares[0],
      right: shares[1],
      patches: [left, right],
    });
  rejectSupport({ left: 1, right: 0, patches: [] });
  rejectSupport({ left: 1, right: 0, patches: [right] });
  rejectSupport({
    left: 1,
    right: 0,
    patches: [{ ...left, bone: "rightFoot" }],
  });
  rejectSupport({
    left: 1,
    right: 0,
    patches: [{ ...left, bone: "leftHand" }],
  });
  rejectSupport({
    left: 1,
    right: 0,
    patches: [{ ...left, bone: "leftFootDecoration" }],
  });
  rejectSupport({ left: 1, right: 0, patches: [{ ...left, side: "front" }] });
  rejectSupport({
    left: 1,
    right: 0,
    patches: [{ ...left, mode: "free", constraint: "hard" }],
  });
  rejectSupport({
    left: 1,
    right: 0,
    patches: [{ ...left, mode: "planted", constraint: "soft" }],
  });
  rejectSupport({
    left: 1,
    right: 0,
    patches: [{ ...left, localPoint: new Array<number>(3) }],
  });
  rejectSupport({
    left: 1,
    right: 0,
    patches: [{ ...left, world: [0, NaN, 0] }],
  });
  rejectSupport({ left: 1, right: 0, kind: "floating" });
  rejectSupport({ left: 1, right: 0, contacts: [] });
  rejectSupport({ left: 1, right: 0, patches: {} });
  assert.deepEqual(left, original);

  const contacts: MotionAction.GroundContact[] = [
    {
      id: "foot",
      region: "foot",
      side: "left",
      bone: "leftMidfoot",
      localPoint: [0, -0.02, 0],
      world: [0, 0, 0],
      share: 0.2,
      mode: "planted",
    },
    {
      id: "hand",
      region: "hand",
      side: "right",
      bone: "rightHand",
      localPoint: [0.02, 0, 0],
      world: [0.3, 0, 0.1],
      share: 0.1,
      mode: "planted",
    },
    {
      id: "forearm",
      region: "forearm",
      side: "right",
      bone: "rightLowerArm",
      localPoint: [0, -0.03, 0],
      world: [0.25, 0, 0.1],
      share: 0.1,
      mode: "planted",
    },
    {
      id: "elbow",
      region: "elbow",
      side: "left",
      bone: "leftLowerArm",
      localPoint: [0, -0.03, 0],
      world: [0.25, 0, -0.1],
      share: 0.1,
      mode: "planted",
    },
    {
      id: "knee",
      region: "knee",
      side: "left",
      bone: "leftLowerLeg",
      localPoint: [0.02, 0, 0],
      world: [0.1, 0, -0.1],
      share: 0.1,
      mode: "planted",
    },
    {
      id: "hip",
      region: "hip",
      bone: "hips",
      localPoint: [0, -0.1, 0.1],
      world: [0, 0, 0.1],
      share: 0.1,
      mode: "planted",
    },
    {
      id: "side-hip",
      region: "hip",
      side: "right",
      bone: "rightUpperLeg",
      localPoint: [0, 0, -0.08],
      world: [0, 0, 0.2],
      share: 0.1,
      mode: "planted",
    },
    {
      id: "trunk",
      region: "trunk",
      bone: "chest",
      localPoint: [0, 0, -0.12],
      world: [-0.2, 0, 0.2],
      share: 0.2,
      mode: "planted",
    },
  ];
  const mixed: MotionAction.ContactSupport = {
    kind: "contacts",
    left: 0,
    right: 0,
    contacts,
  };
  const before: MotionAction.ContactSupport = structuredClone(mixed);
  MotionAction.validateSupport(mixed);
  assert.deepEqual(mixed, before);
  for (const contact of contacts) MotionAction.validateGroundContact(contact);
  MotionAction.validateGroundContact({
    id: "shoulder",
    region: "shoulder",
    side: "left",
    bone: "leftUpperArm",
    localPoint: [0, -0.06, 0],
    world: [0, 0, 0],
    share: 1,
    mode: "planted",
  });
  const down: MotionAction.GroundContact = { ...contacts[7]!, share: 1 };
  MotionAction.validateSupport({
    kind: "contacts",
    left: 0,
    right: 0,
    contacts: [down],
  });
  const free: MotionAction.SupportPatch = {
    ...left,
    mode: "free",
    constraint: "hard",
    world: [1, 0.4, 2],
  };
  MotionAction.validateSupport({
    kind: "contacts",
    left: 0,
    right: 0,
    contacts: [down],
    patches: [free],
  });
  MotionAction.validateSupport({
    kind: "airborne",
    left: 0,
    right: 0,
    patches: [free],
  });
  MotionAction.validateSupport({ kind: "airborne", left: 0, right: 0 });
  for (const invalid of [
    { ...mixed, contacts: [] },
    { ...mixed, contacts: [down, down] },
    { ...mixed, contacts: [{ ...down, share: NaN }] },
    { ...mixed, contacts: [{ ...down, share: -1 }] },
    { ...mixed, contacts: [{ ...down, share: 0.9 }] },
    { ...mixed, contacts: [{ ...down, id: " " }] },
    { ...mixed, contacts: [{ ...down, side: "left" }] },
    { ...mixed, contacts: [{ ...down, region: "knee" }] },
    { ...mixed, contacts: [{ ...contacts[1]!, share: 1, bone: "leftHand" }] },
    { ...mixed, contacts: [{ ...contacts[1]!, share: 1, side: undefined }] },
    {
      ...mixed,
      contacts: [{ ...contacts[1]!, share: 1, bone: "rightLowerLeg" }],
    },
    { ...mixed, contacts: [{ ...down, mode: "free" }] },
    { ...mixed, contacts: [{ ...down, constraint: "soft" }] },
    { ...mixed, left: 0.2 },
    { ...mixed, patches: [left] },
    { kind: "airborne", left: 0, right: 0, patches: [left] },
    { kind: "airborne", left: 0, right: 0, contacts: [] },
    { kind: "airborne", left: 0, right: 1 },
  ])
    rejectSupport(invalid);

  MotionAction.validateRootRotation(undefined);
  MotionAction.validateRootRotation([0, 0, 0, 1]);
  MotionAction.validateRootRotation([Math.SQRT1_2, 0, 0, Math.SQRT1_2]);
  for (const rotation of [
    [0, 0, 0, 0],
    [0, 0, 0, 2],
    [NaN, 0, 0, 1],
    new Array<number>(4),
  ])
    assert.throws((): void =>
      MotionAction.validateRootRotation(
        rotation as [number, number, number, number],
      ),
    );
  const sample: MotionAction.Sample = {
    pose: {},
    rootOffset: [1, 2, 3],
    rootRotation: [0, 0, 0, 1],
    preservedChannels: [],
    support: mixed,
    effectors: [],
    phase: "recovery",
    elapsed: 1,
    progress: 0.5,
  };
  const detached: MotionAction.BodyPlacement =
    MotionAction.snapshotBodyPlacement(sample);
  sample.rootRotation![0] = 1;
  mixed.contacts[0]!.world[0] = 99;
  assert.equal(detached.rootRotation![0], 0);
  assert.equal(detached.support.kind, "contacts");
  assert.ok(detached.support.kind === "contacts");
  assert.equal(detached.support.contacts[0]!.world[0], 0);
  assert.notEqual(detached.preservedChannels, sample.preservedChannels);
}

/** Reject deliberately malformed runtime data through the same exported semantic boundary. */
function rejectSupport(value: unknown): void {
  assert.throws((): void =>
    MotionAction.validateSupport(value as MotionAction.Support),
  );
}
